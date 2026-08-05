import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import { MODULOS, tieneModulo } from "@/lib/modulos";
import { ErrorPersonas, actualizarPersona, listarPersonas } from "@/lib/personas";
import { obtenerSesion } from "@/lib/sesion";

const MAXIMO_POR_VENTANA = 20;
const VENTANA_MS = 60_000;

function responder(cuerpo: unknown, estado = 200, cabeceras?: HeadersInit): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", ...cabeceras },
  });
}

export async function POST(
  request: Request,
  contexto: { params: Promise<{ documento: string }> },
): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder({ ok: false }, 401);
  if (!tieneModulo(sesion.modulos, "admin")) return responder({ ok: false }, 403);

  const ip = ipDeSolicitud(request.headers);
  const cupo = consumirCupo(`admin-personas:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS);
  if (!cupo.permitido) {
    return responder({ ok: false }, 429, { "Retry-After": String(cupo.reintentarEn) });
  }

  const { documento } = await contexto.params;
  if (!documento?.trim()) return responder({ ok: false }, 400);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ ok: false, mensaje: "Datos inválidos." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object") return responder({ ok: false }, 400);

  const {
    nombres,
    apellidos,
    rol_etiqueta: rolEtiqueta,
    modulos: modulosCrudo,
    clave,
    activo,
  } = cuerpo as Record<string, unknown>;

  if (
    typeof nombres !== "string" ||
    !nombres.trim() ||
    typeof apellidos !== "string" ||
    !apellidos.trim()
  ) {
    return responder({ ok: false, mensaje: "Ingrese nombres y apellidos." }, 400);
  }

  const listaModulos = Array.isArray(modulosCrudo)
    ? modulosCrudo.filter(
        (m): m is string => typeof m === "string" && (MODULOS as readonly string[]).includes(m),
      )
    : [];
  const activoNuevo = activo !== false;

  // Candado de seguridad: nadie se quita a sí mismo el acceso de administrador,
  // ni se desactiva a sí mismo. Se valida aquí, no sólo ocultando la opción en
  // la interfaz, porque una solicitud puede llegar sin pasar por el formulario.
  if (documento === sesion.documento) {
    if (!listaModulos.includes("admin")) {
      return responder(
        { ok: false, mensaje: "No puedes quitarte el acceso de administrador a ti mismo." },
        400,
      );
    }
    if (!activoNuevo) {
      return responder({ ok: false, mensaje: "No puedes desactivarte a ti mismo." }, 400);
    }
  }

  try {
    const existentes = await listarPersonas();
    const actual = existentes.find((p) => p.documento === documento);
    if (!actual) return responder({ ok: false, mensaje: "No se encontró esa persona." }, 404);

    // Si no llegó una clave nueva, se reenvía la que ya tenía: el navegador
    // nunca la recibió, así que "en blanco" significa "no cambiarla".
    const clavePropuesta = typeof clave === "string" ? clave.trim() : "";
    const claveFinal = clavePropuesta || actual.clave || "";

    await actualizarPersona({
      documento,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      rolEtiqueta: typeof rolEtiqueta === "string" ? rolEtiqueta.trim() : "",
      modulos: listaModulos,
      clave: claveFinal,
      activo: activoNuevo,
    });

    return responder({ ok: true });
  } catch (causa) {
    console.error(
      "[admin/personas] fallo al actualizar persona:",
      causa instanceof ErrorPersonas ? causa.message : causa,
    );
    return responder({ ok: false }, 502);
  }
}
