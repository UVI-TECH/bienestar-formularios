import type { RespuestaConsultaCedula } from "./types";

/**
 * Cliente de `POST /api/lookup`.
 *
 * El endpoint señala las condiciones de error con el código HTTP y mantiene
 * siempre la misma forma de cuerpo. Aquí eso se traduce a un resultado
 * discriminado, para que la interfaz no tenga que interpretar códigos.
 */

export type ResultadoConsulta =
  | { estado: "encontrado"; datos: RespuestaConsultaCedula }
  | { estado: "no-encontrado" }
  | { estado: "error"; mensaje: string };

const MENSAJES: Record<number, string> = {
  400: "El número de documento no es válido.",
  429: "Se hicieron demasiadas consultas seguidas. Espere un momento e intente de nuevo.",
  502: "El servicio de Smart Campus no está disponible. Diligencie los datos manualmente.",
};

const MENSAJE_RED =
  "No fue posible conectarse al servicio de consulta. Diligencie los datos manualmente.";

export async function consultarCedula(
  cedula: string,
  tipoPersona?: string,
): Promise<ResultadoConsulta> {
  let respuesta: Response;

  try {
    respuesta = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cedula, tipoPersona }),
    });
  } catch {
    return { estado: "error", mensaje: MENSAJE_RED };
  }

  if (!respuesta.ok) {
    return {
      estado: "error",
      mensaje: MENSAJES[respuesta.status] ?? MENSAJE_RED,
    };
  }

  let cuerpo: RespuestaConsultaCedula;
  try {
    cuerpo = (await respuesta.json()) as RespuestaConsultaCedula;
  } catch {
    return { estado: "error", mensaje: MENSAJE_RED };
  }

  return cuerpo.encontrado
    ? { estado: "encontrado", datos: cuerpo }
    : { estado: "no-encontrado" };
}
