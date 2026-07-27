import "server-only";

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

const PROGRAMAS_SIMULADOS = [
  "Tecnología en Sistemas de Información",
  "Ingeniería Industrial",
  "Administración de Empresas",
  "Tecnología en Electrónica Industrial",
  "Contaduría Pública",
  "Trabajo Social",
];

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
 * Respuesta simulada mientras no tengamos el `peunId` real.
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
    semestre: String(indice(base, 4, 10) + 1),
  };
}

/* ---------------------------------------------------------------------------
   Servicio real
   --------------------------------------------------------------------------- */

export class ErrorSmartCampus extends Error {}

/**
 * Extrae un campo de texto probando varios nombres de clave.
 *
 * TODO(Smart Campus): confirmar con la oficina el contrato real de
 * `estudiantes/consultar` y dejar sólo las claves correctas. Mientras tanto se
 * prueban las variantes más probables para que el mapeo no falle en silencio.
 */
function texto(
  origen: Record<string, unknown>,
  claves: readonly string[],
): string | undefined {
  for (const clave of claves) {
    const valor = origen[clave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number") return String(valor);
  }
  return undefined;
}

/** Desenvuelve envoltorios comunes (`data`, `estudiante`, `result`). */
function nucleo(carga: unknown): Record<string, unknown> | undefined {
  if (!carga || typeof carga !== "object") return undefined;
  const objeto = carga as Record<string, unknown>;

  for (const envoltorio of ["data", "estudiante", "result", "datos"]) {
    const interior = objeto[envoltorio];
    if (interior && typeof interior === "object" && !Array.isArray(interior)) {
      return interior as Record<string, unknown>;
    }
    if (Array.isArray(interior) && interior.length > 0) {
      const primero = interior[0];
      if (primero && typeof primero === "object") {
        return primero as Record<string, unknown>;
      }
    }
  }

  return objeto;
}

/**
 * Traduce la respuesta de Smart Campus a nuestra forma pública.
 * Todo lo que no esté en `RespuestaConsultaCedula` se descarta aquí.
 */
export function mapearRespuesta(carga: unknown): RespuestaConsultaCedula {
  const datos = nucleo(carga);
  if (!datos) return { encontrado: false };

  const nombres = texto(datos, ["nombres", "nombre", "primerNombre"]);
  const apellidos = texto(datos, [
    "apellidos",
    "apellido",
    "primerApellido",
    "primer_apellido",
  ]);
  const programa = texto(datos, [
    "programa",
    "programaAcademico",
    "programa_academico",
    "nombrePrograma",
  ]);
  const semestre = texto(datos, ["semestre", "semestreActual", "nivel"]);

  // Sin nombre no hay nada que autocompletar: se trata como no encontrado.
  if (!nombres && !apellidos) return { encontrado: false };

  return { encontrado: true, nombres, apellidos, programa, semestre };
}

export async function consultarSmartCampus(
  cedula: string,
): Promise<RespuestaConsultaCedula> {
  const url = process.env.SMARTCAMPUS_URL;
  const peunId = process.env.SMARTCAMPUS_PEUN_ID;

  if (!url || !peunId) {
    throw new ErrorSmartCampus(
      "Falta configurar SMARTCAMPUS_URL o SMARTCAMPUS_PEUN_ID.",
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
      body: JSON.stringify({ cedula, peunId }),
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
