import "server-only";

import { fechaHoy } from "./fechas";

/**
 * Preparación del registro que se envía al flujo de Power Automate.
 * Sólo se usa desde `app/api/submit/[formato]/route.ts`.
 */

/** Formatos que aceptan registros. Cualquier otro se rechaza con 404. */
export const FORMATOS_ENVIABLES = [
  "enfermeria",
  "consulta-medica",
  "tamizaje",
  "poliza",
] as const;

export type FormatoEnviable = (typeof FORMATOS_ENVIABLES)[number];

export function esFormatoEnviable(valor: string): valor is FormatoEnviable {
  return (FORMATOS_ENVIABLES as readonly string[]).includes(valor);
}

/** `consulta-medica` → `PA_URL_CONSULTA_MEDICA`. */
export function variableDeFlujo(formato: FormatoEnviable): string {
  return `PA_URL_${formato.toUpperCase().replace(/-/g, "_")}`;
}

/* ---------------------------------------------------------------------------
   Saneamiento del payload
   --------------------------------------------------------------------------- */

/** Excel no admite claves raras: sólo minúsculas, dígitos y guión bajo. */
const CLAVE_VALIDA = /^[a-z][a-z0-9_]*$/;

const MAXIMO_CAMPOS = 60;
const MAXIMO_LARGO_VALOR = 5_000;

/** Una celda de la fila: texto o número. Los números se conservan como tales. */
export type ValorRegistro = string | number;

/**
 * Convierte el cuerpo recibido en una fila plana, lista para la acción
 * "Agregar fila a tabla" de Excel.
 *
 * Se descarta todo lo que no sea un par clave/valor simple: objetos, arreglos y
 * claves con formato inesperado. Así, lo que llegue del navegador no puede
 * inyectar estructuras en el flujo de Power Automate.
 *
 * Los números viajan como números —no como texto— para que Excel los reciba
 * como cifras: el IMC, el peso o la glicemia deben poder promediarse.
 */
export function sanearRegistro(cuerpo: unknown): Record<string, ValorRegistro> {
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) return {};

  const fila: Record<string, ValorRegistro> = {};

  for (const [clave, valor] of Object.entries(cuerpo)) {
    if (Object.keys(fila).length >= MAXIMO_CAMPOS) break;
    if (!CLAVE_VALIDA.test(clave)) continue;

    if (typeof valor === "string") {
      fila[clave] = valor.trim().slice(0, MAXIMO_LARGO_VALOR);
    } else if (typeof valor === "number" && Number.isFinite(valor)) {
      fila[clave] = valor;
    } else if (typeof valor === "boolean") {
      fila[clave] = valor ? "Sí" : "No";
    }
    // null, undefined, objetos y arreglos se omiten a propósito.
  }

  return fila;
}

/** Marca de tiempo del registro. La pone el servidor: el reloj del cliente no es fiable. */
export function marcaDeTiempo(): string {
  return new Date().toISOString();
}

/* ---------------------------------------------------------------------------
   Identificador de caso (sólo póliza)
   --------------------------------------------------------------------------- */

const LONGITUD_SUFIJO = 6;

/**
 * Milisegundos que abarcan seis caracteres en base 36: 36⁶ = 2 176 782 336,
 * algo más de 25 días. Pasado ese lapso el sufijo vuelve a empezar.
 */
const CICLO_MS = 36 ** LONGITUD_SUFIJO;

/**
 * Radicado del accidente, con el formato `AP-{AAAA}-{6 caracteres base 36}`
 * — por ejemplo `AP-2026-1KP4ZC`.
 *
 * Es la llave que une la atención con sus seguimientos y nombra la carpeta de
 * soportes, así que la prioridad es que no se repita. El sufijo son los
 * milisegundos del reloj en base 36: dos registros sólo coinciden si el
 * servidor los sella **en el mismo milisegundo**, o si están separados por un
 * múltiplo exacto de 25,2 días al milisegundo (≈ 1 en 2 176 millones). Frente a
 * un número aleatorio de la misma longitud es bastante mejor: los registros
 * reales están separados por segundos o minutos, no por azar.
 *
 * De paso, el sufijo crece con el tiempo, así que dentro de una misma ventana
 * de 25 días los radicados quedan en orden cronológico.
 *
 * Lo genera el servidor para que no dependa del reloj ni del navegador de quien
 * registra. El año se toma en hora de Colombia, no en UTC, para que un registro
 * de la noche del 31 de diciembre no quede con el año siguiente.
 */
export function generarCasoId(referencia: number = Date.now()): string {
  const anio = fechaHoy().slice(0, 4);
  const sufijo = (referencia % CICLO_MS)
    .toString(36)
    .padStart(LONGITUD_SUFIJO, "0")
    .toUpperCase();
  return `AP-${anio}-${sufijo}`;
}

/** Campos que agrega el servidor según el formato. */
export function camposDelServidor(
  formato: FormatoEnviable,
): Record<string, string> {
  const generados: Record<string, string> = { registrado_en: marcaDeTiempo() };
  if (formato === "poliza") generados.caso_id = generarCasoId();
  return generados;
}
