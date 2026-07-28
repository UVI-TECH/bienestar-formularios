import "server-only";

import { randomInt } from "node:crypto";
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

/**
 * Radicado del accidente, con el formato `AP-{AAAA}-{4 dígitos}`.
 *
 * Lo genera el servidor para que el número no dependa del reloj ni del
 * navegador de quien registra. El año se toma en hora de Colombia, no en UTC,
 * para que un registro de la noche del 31 de diciembre no quede con el año
 * siguiente.
 *
 * NOTA: son cuatro dígitos aleatorios, así que **no está garantizado que sea
 * único**: con unos cientos de casos al año la probabilidad de repetir uno es
 * apreciable. Sirve como referencia legible para hablar del caso; la fila de
 * Excel sigue siendo el registro autoritativo. Si más adelante se necesita
 * unicidad, hay que llevar un consecutivo en el flujo o en la tabla.
 */
export function generarCasoId(): string {
  const anio = fechaHoy().slice(0, 4);
  const aleatorio = randomInt(0, 10_000).toString().padStart(4, "0");
  return `AP-${anio}-${aleatorio}`;
}

/** Campos que agrega el servidor según el formato. */
export function camposDelServidor(
  formato: FormatoEnviable,
): Record<string, string> {
  const generados: Record<string, string> = { registrado_en: marcaDeTiempo() };
  if (formato === "poliza") generados.caso_id = generarCasoId();
  return generados;
}
