import "server-only";

import { FACULTADES, PROGRAMAS, SEMESTRES } from "./catalogos";
import type { RespuestaConsultaCedula } from "./types";

/**
 * Cliente del servicio de estudiantes de Smart Campus.
 *
 * Sólo se usa desde el route handler `/api/lookup`. Nada de este módulo debe
 * llegar al navegador: la URL y el `peunId` del servicio no son públicos.
 */

const LATENCIA_SIMULADA_MS = 400;
const TIEMPO_LIMITE_MS = 8_000;

export function enModoSimulado(): boolean {
  return process.env.SMARTCAMPUS_MOCK === "true";
}

/* ---------------------------------------------------------------------------
   Modo simulado
   --------------------------------------------------------------------------- */

const NOMBRES = [
  "María Camila",
  "Juan Sebastián",
  "Laura Valentina",
  "Andrés Felipe",
  "Daniela",
  "Santiago",
  "Valeria",
  "Nicolás",
  "Isabella",
  "Miguel Ángel",
];

const APELLIDOS = [
  "Rodríguez Muñoz",
  "Gómez Salazar",
  "Vásquez Ortiz",
  "Ramírez Lozano",
  "Castillo Arboleda",
  "Moreno Quintero",
  "Zapata Ibarra",
  "Cardona Bejarano",
  "Solís Naranjo",
  "Herrera Cifuentes",
];

/** Se toman del catálogo real para que el simulador devuelva programas válidos. */
const PROGRAMAS_SIMULADOS = PROGRAMAS.length > 0 ? PROGRAMAS : ["Sin programa"];

/** Hash determinista de la cédula: la misma cédula da siempre la misma persona. */
function huella(cedula: string): number {
  let h = 2_166_136_261;
  for (const caracter of cedula) {
    h ^= caracter.charCodeAt(0);
    h = Math.imul(h, 16_777_619) >>> 0;
  }
  return h;
}

/**
 * Deriva un índice independiente por campo.
 *
 * Hace falta la mezcla: sembrar el mismo hash con distintos valores iniciales
 * sólo desplaza el resultado por una constante, y entonces dos cédulas con el
 * mismo nombre terminaban compartiendo también el apellido.
 */
function indice(base: number, sal: number, largo: number): number {
  let x = (base ^ sal) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 2_246_822_507) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3_266_489_909) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) % largo;
}

/**
 * Respuesta simulada, para desarrollar sin depender del servicio.
 *
 * Devuelve los mismos campos que el servicio real, semestre incluido, para
 * que el formulario no se comporte distinto al cambiar de modo.
 *
 * Convención para poder probar el camino de "no encontrado" sin tocar código:
 * **las cédulas terminadas en 0 se comportan como no registradas**.
 */
export async function consultarSimulado(
  cedula: string,
): Promise<RespuestaConsultaCedula> {
  await new Promise((resolver) => setTimeout(resolver, LATENCIA_SIMULADA_MS));

  if (cedula.endsWith("0")) return { encontrado: false };

  const base = huella(cedula);

  return {
    encontrado: true,
    nombres: NOMBRES[indice(base, 1, NOMBRES.length)],
    apellidos: APELLIDOS[indice(base, 2, APELLIDOS.length)],
    programa: PROGRAMAS_SIMULADOS[indice(base, 3, PROGRAMAS_SIMULADOS.length)],
    facultad: FACULTADES[indice(base, 4, FACULTADES.length)],
    semestre: SEMESTRES[indice(base, 5, SEMESTRES.length)],
  };
}

/* ---------------------------------------------------------------------------
   Servicio real
   --------------------------------------------------------------------------- */

export class ErrorSmartCampus extends Error {}

/**
 * `Persona`, el objeto que describe al estudiante.
 *
 * Se declara completo para dejar constancia de lo que entrega el servicio,
 * pero de aquí sólo se publican nombres, apellidos, programa y facultad, más
 * el semestre derivado de `grupos` (ver `semestreDeGrupos`). Correos, código
 * de programa, unidad docente y usuario no se publican al navegador porque el
 * formulario no los necesita.
 */
interface EstudianteSmartCampus {
  apellido?: string;
  codigoPrograma?: string;
  correoInstitucional?: string;
  correoPersonal?: string;
  documentoIdentidad?: string;
  facultad?: string;
  grupos?: Array<{ codigo?: string; franja?: string }>;
  nombre?: string;
  programa?: string;
  unidadDocente?: string;
  usuario?: string;
}

/**
 * `SimpleObjectResponse`, el sobre con que el servicio estandariza todas sus
 * respuestas. La `Persona` viaja dentro de `valor`.
 */
interface SobreSmartCampus {
  codigo?: number;
  mensaje?: string;
  valor?: unknown;
}

function limpiar(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor.trim() : undefined;
}

/** El semestre máximo que ofrece la institución (el mayor valor de `SEMESTRES`). */
const SEMESTRE_MAXIMO = SEMESTRES.length;

/**
 * Extrae el semestre de un código de grupo, p. ej. `841B` → 8, `S144` → 1.
 *
 * Regla deducida de los códigos reales: se ignoran las letras iniciales
 * (`S`, `SB`, …) y se toma el primer dígito de lo que sigue —salvo que
 * empiece por "10", el único semestre de dos cifras, en cuyo caso es 10—.
 * Así, `SB1040` da 10 y no 1.
 */
function semestreDeCodigo(codigo: string): number | undefined {
  const digitos = codigo.match(/^[^0-9]*([0-9]+)/)?.[1];
  if (!digitos) return undefined;

  const semestre = digitos.startsWith("10") ? 10 : Number(digitos[0]);
  return semestre >= 1 && semestre <= SEMESTRE_MAXIMO ? semestre : undefined;
}

/**
 * Un estudiante puede tener varios grupos vigentes a la vez (materias de
 * semestres distintos matriculadas en el mismo periodo). Se toma el semestre
 * más alto entre todos los códigos: es el que mejor describe en qué va.
 */
function semestreDeGrupos(
  grupos: EstudianteSmartCampus["grupos"],
): string | undefined {
  if (!grupos) return undefined;

  let maximo: number | undefined;
  for (const grupo of grupos) {
    if (typeof grupo.codigo !== "string") continue;
    const semestre = semestreDeCodigo(grupo.codigo);
    if (semestre !== undefined && (maximo === undefined || semestre > maximo)) {
      maximo = semestre;
    }
  }

  return maximo?.toString();
}

/**
 * Saca la `Persona` de la respuesta.
 *
 * En la práctica el servicio responde `{ codigo, mensaje, valor }` y la persona
 * está en `valor`; su propio Swagger, en cambio, declara la `Persona` como
 * cuerpo directo del 200. Se admiten las dos formas porque la documentación y
 * el comportamiento no coinciden y no conviene depender de cuál gane.
 *
 * `valor` también puede traer texto (en las respuestas de error trae la ruta),
 * así que se exige que sea un objeto.
 */
function extraerPersona(carga: unknown): EstudianteSmartCampus | undefined {
  if (!carga || typeof carga !== "object" || Array.isArray(carga)) return undefined;

  const sobre = carga as SobreSmartCampus;

  if ("valor" in sobre) {
    const valor = sobre.valor;
    // `valor: null` con código 200 es la forma en que el servicio dice que no
    // hay registro para ese documento y ese periodo.
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
      return undefined;
    }
    return valor as EstudianteSmartCampus;
  }

  return carga as EstudianteSmartCampus;
}

/**
 * Traduce la respuesta de Smart Campus a nuestra forma pública.
 * Todo lo que no esté en `RespuestaConsultaCedula` se descarta aquí.
 *
 * Nota: el servicio no entrega el semestre como campo propio; se deriva de
 * `grupos` (ver `semestreDeGrupos`). Si no hay grupos, o ninguno tiene un
 * código reconocible, queda sin definir y lo completa quien registra.
 */
export function mapearRespuesta(carga: unknown): RespuestaConsultaCedula {
  const datos = extraerPersona(carga);
  if (!datos) return { encontrado: false };

  const nombres = limpiar(datos.nombre);
  const apellidos = limpiar(datos.apellido);

  // Sin nombre no hay nada que autocompletar: se trata como no encontrado.
  if (!nombres && !apellidos) return { encontrado: false };

  return {
    encontrado: true,
    nombres,
    apellidos,
    programa: limpiar(datos.programa),
    facultad: limpiar(datos.facultad),
    semestre: semestreDeGrupos(datos.grupos),
  };
}

/** El servicio puede reportar un fallo suyo con HTTP 200 y `codigo` 4xx/5xx. */
function codigoDeFallo(carga: unknown): number | undefined {
  if (!carga || typeof carga !== "object") return undefined;
  const codigo = (carga as SobreSmartCampus).codigo;
  return typeof codigo === "number" && codigo >= 400 ? codigo : undefined;
}

export async function consultarSmartCampus(
  cedula: string,
): Promise<RespuestaConsultaCedula> {
  const url = process.env.SMARTCAMPUS_URL;
  const peunId = Number(process.env.SMARTCAMPUS_PEUN_ID);

  if (!url || !Number.isFinite(peunId)) {
    throw new ErrorSmartCampus(
      "Falta configurar SMARTCAMPUS_URL, o SMARTCAMPUS_PEUN_ID no es numérico.",
    );
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // El servicio espera `documento`, no `cedula`, y `peunId` numérico.
      body: JSON.stringify({ documento: cedula, peunId }),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (causa) {
    throw new ErrorSmartCampus(
      causa instanceof Error && causa.name === "TimeoutError"
        ? "Smart Campus no respondió a tiempo."
        : "No fue posible contactar a Smart Campus.",
    );
  }

  // 404 es una respuesta legítima: la cédula no está registrada.
  if (respuesta.status === 404) return { encontrado: false };

  if (!respuesta.ok) {
    throw new ErrorSmartCampus(
      `Smart Campus respondió ${respuesta.status}.`,
    );
  }

  let carga: unknown;
  try {
    carga = await respuesta.json();
  } catch {
    throw new ErrorSmartCampus("Smart Campus devolvió una respuesta ilegible.");
  }

  const fallo = codigoDeFallo(carga);
  if (fallo) {
    throw new ErrorSmartCampus(`Smart Campus reportó el código ${fallo}.`);
  }

  return mapearRespuesta(carga);
}
