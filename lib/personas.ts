import "server-only";

import { MODULOS, type ModuloId } from "./modulos";

/**
 * Cliente de lectura de la tabla Personas (Excel), vía Power Automate.
 *
 * Sólo se usa desde `/api/login`. El "quién puede ver qué" se administra a
 * mano en el Excel; este módulo únicamente lee la fila del documento y la
 * valida — nunca la devuelve cruda al navegador.
 *
 * Nota: la forma de la respuesta del flujo no está confirmada contra el flujo
 * real. Se admiten tres formas plausibles —`{ value: [...] }` (la salida
 * típica de la acción "List rows present in a table"), `{ valor: {...} }`
 * (como Smart Campus, ver `lib/smartcampus.ts`) o la fila directa— para no
 * quedar atado a una sola hasta probarlo contra `PA_URL_LEER_PERSONAS`.
 */

interface FilaPersonas {
  documento?: string;
  nombres?: string;
  apellidos?: string;
  modulos?: string;
  clave?: string;
  activo?: string;
}

export class ErrorPersonas extends Error {}

export interface PersonaEncontrada {
  documento: string;
  nombres: string;
  apellidos: string;
  modulos: ModuloId[];
  clave?: string;
  activo: boolean;
}

function limpiar(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function extraerFila(carga: unknown): FilaPersonas | undefined {
  if (!carga || typeof carga !== "object") return undefined;

  if (Array.isArray(carga)) {
    const primera = carga[0];
    return primera && typeof primera === "object"
      ? (primera as FilaPersonas)
      : undefined;
  }

  const sobre = carga as { value?: unknown; valor?: unknown };

  // Salida típica de la acción "List rows present in a table" de Power Automate.
  if (Array.isArray(sobre.value)) {
    const primera = sobre.value[0];
    return primera && typeof primera === "object"
      ? (primera as FilaPersonas)
      : undefined;
  }

  // Envoltorio tipo Smart Campus.
  if ("valor" in sobre) {
    const valor = sobre.valor;
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
      return undefined;
    }
    return valor as FilaPersonas;
  }

  return carga as FilaPersonas;
}

/** `"enfermeria, admin"` → `["enfermeria", "admin"]`, descartando ids que no existan. */
function parsearModulos(valor: unknown): ModuloId[] {
  if (typeof valor !== "string") return [];
  const vistos = new Set<ModuloId>();
  for (const crudo of valor.split(",")) {
    const id = crudo.trim();
    if ((MODULOS as readonly string[]).includes(id)) vistos.add(id as ModuloId);
  }
  return [...vistos];
}

function esActivo(valor: unknown): boolean {
  const texto = limpiar(valor).toLowerCase();
  return texto === "sí" || texto === "si";
}

export function mapearPersona(carga: unknown): PersonaEncontrada | undefined {
  const fila = extraerFila(carga);
  if (!fila) return undefined;

  const documento = limpiar(fila.documento);
  if (!documento) return undefined;

  return {
    documento,
    nombres: limpiar(fila.nombres),
    apellidos: limpiar(fila.apellidos),
    modulos: parsearModulos(fila.modulos),
    clave: limpiar(fila.clave) || undefined,
    activo: esActivo(fila.activo),
  };
}

const TIEMPO_LIMITE_MS = 8_000;

export async function consultarPersona(
  documento: string,
): Promise<PersonaEncontrada | undefined> {
  const url = process.env.PA_URL_LEER_PERSONAS;
  if (!url) {
    throw new ErrorPersonas("Falta configurar PA_URL_LEER_PERSONAS.");
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ documento }),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (causa) {
    throw new ErrorPersonas(
      causa instanceof Error && causa.name === "TimeoutError"
        ? "El servicio de personas no respondió a tiempo."
        : "No fue posible contactar el servicio de personas.",
    );
  }

  if (respuesta.status === 404) return undefined;

  if (!respuesta.ok) {
    throw new ErrorPersonas(
      `El servicio de personas respondió ${respuesta.status}.`,
    );
  }

  let carga: unknown;
  try {
    carga = await respuesta.json();
  } catch {
    throw new ErrorPersonas(
      "El servicio de personas devolvió una respuesta ilegible.",
    );
  }

  return mapearPersona(carga);
}

/* ---------------------------------------------------------------------------
   Administración de personas (panel /admin/personas)

   A diferencia de `consultarPersona` (una fila, por documento), estas
   funciones leen y escriben la tabla completa. `listarPersonas` se usa desde
   `app/api/admin/personas/**` (que ya valida la sesión con módulo "admin") y
   también desde `lib/notificaciones.ts`, para sacar los correos de quienes
   deben enterarse de un caso nuevo en seguimiento.
   --------------------------------------------------------------------------- */

interface FilaPersonaAdmin {
  documento?: unknown;
  nombres?: unknown;
  apellidos?: unknown;
  rol_etiqueta?: unknown;
  modulos?: unknown;
  clave?: unknown;
  activo?: unknown;
  correo?: unknown;
}

export interface PersonaAdmin {
  documento: string;
  nombres: string;
  apellidos: string;
  rolEtiqueta: string;
  modulos: ModuloId[];
  /** Nunca se envía al navegador: ver `sinClave`. */
  clave?: string;
  activo: boolean;
  /** Tampoco se envía al navegador (ver `sinClave`); sólo la usa `lib/notificaciones.ts`. */
  correo: string;
}

/** Forma que sí puede llegar al cliente: igual a `PersonaAdmin`, sin `clave` ni `correo`. */
export type PersonaPublica = Omit<PersonaAdmin, "clave" | "correo">;

export function sinClave(persona: PersonaAdmin): PersonaPublica {
  return {
    documento: persona.documento,
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    rolEtiqueta: persona.rolEtiqueta,
    modulos: persona.modulos,
    activo: persona.activo,
  };
}

function extraerFilas(carga: unknown): unknown[] {
  if (Array.isArray(carga)) return carga;
  if (carga && typeof carga === "object") {
    const sobre = carga as { value?: unknown; valor?: unknown };
    if (Array.isArray(sobre.value)) return sobre.value;
    if (Array.isArray(sobre.valor)) return sobre.valor;
  }
  return [];
}

function mapearPersonaAdmin(fila: unknown): PersonaAdmin | undefined {
  if (!fila || typeof fila !== "object") return undefined;
  const f = fila as FilaPersonaAdmin;

  const documento = limpiar(f.documento);
  if (!documento) return undefined;

  return {
    documento,
    nombres: limpiar(f.nombres),
    apellidos: limpiar(f.apellidos),
    rolEtiqueta: limpiar(f.rol_etiqueta),
    modulos: parsearModulos(f.modulos),
    clave: limpiar(f.clave) || undefined,
    activo: esActivo(f.activo),
    correo: limpiar(f.correo),
  };
}

/** POST genérico contra un flujo de Power Automate de administración de personas. */
async function llamarFlujoPersonas(url: string, cuerpo: unknown): Promise<unknown> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (causa) {
    throw new ErrorPersonas(
      causa instanceof Error && causa.name === "TimeoutError"
        ? "El servicio de personas no respondió a tiempo."
        : "No fue posible contactar el servicio de personas.",
    );
  }

  if (!respuesta.ok) {
    throw new ErrorPersonas(`El servicio de personas respondió ${respuesta.status}.`);
  }

  try {
    return await respuesta.json();
  } catch {
    // Los flujos de escritura no siempre devuelven cuerpo; no es un error.
    return undefined;
  }
}

/** Todas las filas de la tabla Personas. Incluye `clave`: sólo para uso server-side. */
export async function listarPersonas(): Promise<PersonaAdmin[]> {
  const url = process.env.PA_URL_LISTAR_PERSONAS;
  if (!url) throw new ErrorPersonas("Falta configurar PA_URL_LISTAR_PERSONAS.");

  const carga = await llamarFlujoPersonas(url, {});
  return extraerFilas(carga)
    .map(mapearPersonaAdmin)
    .filter((persona): persona is PersonaAdmin => Boolean(persona));
}

export interface DatosPersonaAdmin {
  documento: string;
  nombres: string;
  apellidos: string;
  rolEtiqueta: string;
  modulos: string[];
  clave: string;
  activo: boolean;
}

export async function crearPersona(datos: DatosPersonaAdmin): Promise<void> {
  const url = process.env.PA_URL_CREAR_PERSONA;
  if (!url) throw new ErrorPersonas("Falta configurar PA_URL_CREAR_PERSONA.");

  await llamarFlujoPersonas(url, {
    documento: datos.documento,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    rol_etiqueta: datos.rolEtiqueta,
    modulos: datos.modulos.join(","),
    clave: datos.clave,
    activo: datos.activo ? "Sí" : "No",
  });
}

/** Actualiza por documento (la llave). Reenvía siempre una clave: quien llama
 *  (la ruta de API) decide si es la nueva o la que ya tenía la persona. */
export async function actualizarPersona(datos: DatosPersonaAdmin): Promise<void> {
  const url = process.env.PA_URL_ACTUALIZAR_PERSONA;
  if (!url) throw new ErrorPersonas("Falta configurar PA_URL_ACTUALIZAR_PERSONA.");

  await llamarFlujoPersonas(url, {
    documento: datos.documento,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    rol_etiqueta: datos.rolEtiqueta,
    modulos: datos.modulos.join(","),
    clave: datos.clave,
    activo: datos.activo ? "Sí" : "No",
  });
}
