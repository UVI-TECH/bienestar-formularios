import { ErrorCasos, agregarSeguimiento } from "@/lib/casos";
import { TIPOS_SEGUIMIENTO } from "@/lib/catalogos";
import { tieneModulo } from "@/lib/modulos";
import { obtenerSesion } from "@/lib/sesion";

/**
 * POST /api/poliza/seguimiento
 *
 * Agrega una entrada a la línea de tiempo de un caso de póliza estudiantil.
 *
 * Cuerpo:  { caso_id, numero_seguimiento, fecha, tipo, descripcion,
 *            proxima_accion?, fecha_proxima_accion? }
 *
 * `registrado_por` NUNCA llega del cliente: lo pone el servidor a partir de
 * la sesión, porque quien registra es quien está logueado (ver AGENTS.md).
 *
 *   200  seguimiento agregado
 *   400  cuerpo ilegible o con campos obligatorios vacíos
 *   401  sin sesión
 *   403  la sesión no tiene el módulo "seguimiento"
 *   502  el flujo de Power Automate falló o no está configurado
 */

function responder(ok: boolean, estado = 200): Response {
  return Response.json({ ok }, { status: estado, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder(false, 401);
  if (!tieneModulo(sesion.modulos, "seguimiento")) return responder(false, 403);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder(false, 400);
  }

  if (!cuerpo || typeof cuerpo !== "object") return responder(false, 400);

  const {
    caso_id: casoId,
    numero_seguimiento: numeroSeguimiento,
    fecha,
    tipo,
    descripcion,
    proxima_accion: proximaAccion,
    fecha_proxima_accion: fechaProximaAccion,
  } = cuerpo as Record<string, unknown>;

  if (
    typeof casoId !== "string" ||
    !casoId.trim() ||
    typeof numeroSeguimiento !== "number" ||
    !Number.isInteger(numeroSeguimiento) ||
    numeroSeguimiento < 1 ||
    typeof fecha !== "string" ||
    !fecha ||
    typeof tipo !== "string" ||
    !(TIPOS_SEGUIMIENTO as readonly string[]).includes(tipo) ||
    typeof descripcion !== "string" ||
    !descripcion.trim()
  ) {
    return responder(false, 400);
  }

  try {
    await agregarSeguimiento({
      casoId: casoId.trim(),
      numeroSeguimiento,
      fecha,
      tipo,
      descripcion: descripcion.trim(),
      proximaAccion: typeof proximaAccion === "string" ? proximaAccion.trim() : "",
      fechaProximaAccion:
        typeof fechaProximaAccion === "string" ? fechaProximaAccion : "",
      registradoPor: `${sesion.nombres} ${sesion.apellidos}`.trim(),
    });
    return responder(true);
  } catch (causa) {
    console.error(
      "[poliza/seguimiento] fallo al agregar seguimiento:",
      causa instanceof ErrorCasos ? causa.message : causa,
    );
    return responder(false, 502);
  }
}
