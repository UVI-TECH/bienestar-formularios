import "server-only";

import { PROGRAMAS } from "./catalogos";
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
 * Devuelve exactamente los mismos campos que el servicio real —es decir, **sin
 * semestre**, porque Smart Campus no lo entrega— para que el formulario no se
 * comporte distinto al cambiar de modo.
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
  };
}

/* ---------------------------------------------------------------------------
   Servicio real
   --------------------------------------------------------------------------- */

export class ErrorSmartCampus extends Error {}

/**
 * Respuesta documentada de `POST /api/v1/aulas-virtuales/estudiantes/consultar`.
 *
 * Se declara completa para dejar constancia de lo que entrega el servicio,
 * pero de aquí sólo salen cuatro campos: correos, facultad, código de programa,
 * grupos, unidad docente y usuario no se publican al navegador porque el
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

function limpiar(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor.trim() : undefined;
}

/**
 * Traduce la respuesta de Smart Campus a nuestra forma pública.
 * Todo lo que no esté en `RespuestaConsultaCedula` se descarta aquí.
 *
 * Nota: el servicio **no devuelve el semestre**, así que ese campo queda para
 * que lo seleccione quien registra.
 */
export function mapearRespuesta(carga: unknown): RespuestaConsultaCedula {
  if (!carga || typeof carga !== "object") return { encontrado: false };

  const datos = carga as EstudianteSmartCampus;

  const nombres = limpiar(datos.nombre);
  const apellidos = limpiar(datos.apellido);

  // Sin nombre no hay nada que autocompletar: se trata como no encontrado.
  if (!nombres && !apellidos) return { encontrado: false };

  return {
    encontrado: true,
    nombres,
    apellidos,
    programa: limpiar(datos.programa),
  };
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

  return mapearRespuesta(carga);
}
