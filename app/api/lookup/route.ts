import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import {
  ErrorSmartCampus,
  consultarSimulado,
  consultarSmartCampus,
  enModoSimulado,
} from "@/lib/smartcampus";
import type { RespuestaConsultaCedula } from "@/lib/types";
import { validarCedula } from "@/lib/validacion";

/**
 * POST /api/lookup
 *
 * Consulta los datos de un estudiante por documento contra el servicio de
 * Smart Campus, o contra el simulador si `SMARTCAMPUS_MOCK=true`.
 *
 * Cuerpo:  { cedula: string, tipoPersona?: string }
 * Respuesta (SIEMPRE esta forma, sin excepción):
 *          { encontrado: boolean, nombres?, apellidos?, programa?, facultad?, semestre? }
 *
 * Las condiciones de error viajan en el código HTTP, no en el cuerpo:
 *   400  cédula ausente o inválida
 *   429  se superó el límite de consultas
 *   502  Smart Campus falló o está mal configurado
 * En todos esos casos el cuerpo es `{ encontrado: false }`, de modo que un
 * cliente que sólo mire el JSON nunca se rompe.
 */

const MAXIMO_POR_VENTANA = 10;
const VENTANA_MS = 60_000;

const NO_ENCONTRADO: RespuestaConsultaCedula = { encontrado: false };

function responder(
  cuerpo: RespuestaConsultaCedula,
  estado = 200,
  cabeceras?: HeadersInit,
): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", ...cabeceras },
  });
}

export async function POST(request: Request): Promise<Response> {
  // 1. Límite de consultas, antes de cualquier trabajo.
  const ip = ipDeSolicitud(request.headers);
  const cupo = consumirCupo(`lookup:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS);

  if (!cupo.permitido) {
    return responder(NO_ENCONTRADO, 429, {
      "Retry-After": String(cupo.reintentarEn),
    });
  }

  // 2. Cuerpo de la solicitud.
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder(NO_ENCONTRADO, 400);
  }

  if (!cuerpo || typeof cuerpo !== "object") {
    return responder(NO_ENCONTRADO, 400);
  }

  const { cedula, tipoPersona } = cuerpo as {
    cedula?: unknown;
    tipoPersona?: unknown;
  };

  // 3. Validación del documento antes de llamar a ningún servicio.
  if (typeof cedula !== "string" || validarCedula(cedula)) {
    return responder(NO_ENCONTRADO, 400);
  }

  // Smart Campus sólo conoce estudiantes: para docentes, administrativos u
  // "Otro" no tiene sentido gastar una consulta.
  if (typeof tipoPersona === "string" && tipoPersona && tipoPersona !== "Estudiante") {
    return responder(NO_ENCONTRADO);
  }

  // 4. Consulta.
  try {
    const resultado = enModoSimulado()
      ? await consultarSimulado(cedula)
      : await consultarSmartCampus(cedula);

    return responder(resultado);
  } catch (causa) {
    // El detalle se queda en el servidor; al cliente sólo le llega el 502.
    console.error(
      "[lookup] fallo al consultar Smart Campus:",
      causa instanceof ErrorSmartCampus ? causa.message : causa,
    );
    return responder(NO_ENCONTRADO, 502);
  }
}
