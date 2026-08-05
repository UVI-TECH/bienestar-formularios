import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import { tieneModulo } from "@/lib/modulos";
import { ErrorSoportes, leerSoportes, subirSoporte } from "@/lib/soportes";
import { obtenerSesion } from "@/lib/sesion";

/**
 * /api/seguimiento/soporte
 *
 * GET  — lista los soportes ya subidos de un caso (`?caso_id=...`).
 * POST — sube un soporte (imagen o PDF): lo recibe ya comprimido y en base64
 *        desde el navegador y lo reenvía al flujo que lo guarda en OneDrive
 *        (ver `lib/soportes.ts`).
 *
 * Cuerpo de POST: { caso_id, documento, nombres, apellidos, periodo,
 *                    nombre_archivo, contenido_base64 }
 *
 *   200  ok
 *   400  cuerpo/parámetros ilegibles, incompletos o archivo demasiado grande
 *   401  sin sesión
 *   403  la sesión no tiene el módulo "seguimiento"
 *   429  demasiadas subidas seguidas (sólo POST)
 *   502  el flujo de Power Automate falló o no está configurado
 */

const MAXIMO_POR_VENTANA = 20;
const VENTANA_MS = 60_000;

/** `contenido_base64` decodifica a ~3/4 de su longitud: éste es el tope real de bytes que se acepta. */
const LIMITE_BASE64_CARACTERES = 8_000_000;

const PERIODO_VALIDO = /^\d{4}-[12]$/;
/** Ya viene saneado desde `lib/archivos.ts`; esto es una segunda comprobación en el servidor. */
const NOMBRE_ARCHIVO_VALIDO = /^[a-zA-Z0-9_.-]+$/;

function responder(cuerpo: unknown, estado = 200, cabeceras?: HeadersInit): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", ...cabeceras },
  });
}

export async function POST(request: Request): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder({ ok: false }, 401);
  if (!tieneModulo(sesion.modulos, "seguimiento")) return responder({ ok: false }, 403);

  const ip = ipDeSolicitud(request.headers);
  const cupo = consumirCupo(`seguimiento-soporte:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS);
  if (!cupo.permitido) {
    return responder({ ok: false }, 429, { "Retry-After": String(cupo.reintentarEn) });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ ok: false, mensaje: "Datos inválidos." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object") return responder({ ok: false }, 400);

  const {
    caso_id: casoId,
    documento,
    nombres,
    apellidos,
    periodo,
    nombre_archivo: nombreArchivo,
    contenido_base64: contenidoBase64,
  } = cuerpo as Record<string, unknown>;

  if (
    typeof casoId !== "string" ||
    !casoId.trim() ||
    typeof documento !== "string" ||
    !documento.trim() ||
    typeof nombres !== "string" ||
    !nombres.trim() ||
    typeof apellidos !== "string" ||
    !apellidos.trim() ||
    typeof periodo !== "string" ||
    !PERIODO_VALIDO.test(periodo) ||
    typeof nombreArchivo !== "string" ||
    !NOMBRE_ARCHIVO_VALIDO.test(nombreArchivo) ||
    typeof contenidoBase64 !== "string" ||
    !contenidoBase64
  ) {
    return responder({ ok: false, mensaje: "El soporte llegó incompleto o con datos inválidos." }, 400);
  }

  if (contenidoBase64.length > LIMITE_BASE64_CARACTERES) {
    return responder(
      { ok: false, mensaje: "El archivo supera el límite de 4 MB. Comprímelo o divídelo antes de subir." },
      400,
    );
  }

  try {
    await subirSoporte({
      casoId: casoId.trim(),
      documento: documento.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      periodo,
      nombreArchivo,
      contenidoBase64,
      // Quien sube el soporte es quien está logueado, no un dato que mande
      // el navegador (mismo criterio que `registrado_por` en seguimientos).
      subidoPor: `${sesion.nombres} ${sesion.apellidos}`.trim(),
    });
    return responder({ ok: true });
  } catch (causa) {
    console.error(
      "[seguimiento/soporte] fallo al subir el soporte:",
      causa instanceof ErrorSoportes ? causa.message : causa,
    );
    return responder({ ok: false }, 502);
  }
}

/** Forma pública de un soporte: lo mismo que `Soporte` de `lib/soportes.ts`, sin `casoId` (ya lo sabe el cliente). */
function paraCliente(soporte: Awaited<ReturnType<typeof leerSoportes>>[number]) {
  return {
    nombreArchivo: soporte.nombreArchivo,
    tipo: soporte.tipo,
    urlWeb: soporte.urlWeb,
    subidoPor: soporte.subidoPor,
    fecha: soporte.fecha,
  };
}

export async function GET(request: Request): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder({ ok: false }, 401);
  if (!tieneModulo(sesion.modulos, "seguimiento")) return responder({ ok: false }, 403);

  const casoId = new URL(request.url).searchParams.get("caso_id")?.trim();
  if (!casoId) return responder({ ok: false }, 400);

  try {
    const soportes = await leerSoportes(casoId);
    return responder({ ok: true, soportes: soportes.map(paraCliente) });
  } catch (causa) {
    console.error(
      "[seguimiento/soporte] fallo al listar soportes:",
      causa instanceof ErrorSoportes ? causa.message : causa,
    );
    return responder({ ok: false }, 502);
  }
}
