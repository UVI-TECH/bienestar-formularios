import { ErrorCasos, cerrarCaso } from "@/lib/casos";
import { tieneModulo } from "@/lib/modulos";
import { obtenerSesion } from "@/lib/sesion";

/**
 * POST /api/poliza/casos/[casoId]/cerrar
 *
 * Cierra un caso de póliza estudiantil: pone `estado = "Cerrado"` en
 * AtencionesPoliza. El caso sale del filtro "En seguimiento" de la lista.
 *
 *   200  caso cerrado
 *   400  casoId ausente
 *   401  sin sesión
 *   403  la sesión no tiene el módulo "seguimiento"
 *   502  el flujo de Power Automate falló o no está configurado
 */

function responder(ok: boolean, estado = 200): Response {
  return Response.json({ ok }, { status: estado, headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  _request: Request,
  contexto: { params: Promise<{ casoId: string }> },
): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder(false, 401);
  if (!tieneModulo(sesion.modulos, "seguimiento")) return responder(false, 403);

  const { casoId } = await contexto.params;
  if (!casoId?.trim()) return responder(false, 400);

  try {
    await cerrarCaso(casoId.trim());
    return responder(true);
  } catch (causa) {
    console.error(
      "[poliza/casos/cerrar] fallo al cerrar el caso:",
      causa instanceof ErrorCasos ? causa.message : causa,
    );
    return responder(false, 502);
  }
}
