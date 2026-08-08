import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import {
  ErrorAsistenteRedaccion,
  LONGITUD_MAXIMA,
  type ModoMejora,
  enModoSimulado,
  mejorarSimulado,
  mejorarTexto,
} from "@/lib/asistenteRedaccion";
import { obtenerSesion } from "@/lib/sesion";

/**
 * POST /api/mejorar-texto
 *
 * Mejora un campo de texto largo del formulario (motivo, procedimiento,
 * atención inicial, diagnóstico presuntivo, descripción de seguimiento,
 * observaciones), sin alterar el contenido clínico. Es una utilidad del
 * formulario: cualquier sesión activa puede usarla, sin importar el módulo.
 *
 * Cuerpo:  { texto: string, modo?: "corregir" | "profesional" }
 *
 * `modo` decide el system prompt:
 *   - "corregir" (por defecto): sólo ortografía, gramática, puntuación.
 *   - "profesional": reescribe a registro clínico (tercera persona, objetivo),
 *     con las mismas reglas estrictas.
 * Cualquier valor que no sea exactamente "profesional" se trata como
 * "corregir" — no hay un modo inválido que rechazar, sólo un valor por
 * defecto seguro.
 *
 * SÓLO recibe y reenvía el contenido del campo. NUNCA recibe ni reenvía
 * cédula, nombre completo, caso_id ni ningún otro dato de identidad
 * (ver AGENTS.md).
 *
 * Respuesta (200):  { textoMejorado: string }
 * Respuesta (error): { error: string }
 *
 *   400  cuerpo ilegible, texto vacío o supera la longitud máxima
 *   401  sin sesión
 *   429  se superó el límite de solicitudes
 *   502  el modelo falló o no está configurado
 */

const MAXIMO_POR_VENTANA = 15;
const VENTANA_MS = 60_000;

const MENSAJE_ERROR = "No se pudo mejorar el texto, intente de nuevo.";

function responder(
  cuerpo: { textoMejorado: string } | { error: string },
  estado = 200,
  cabeceras?: HeadersInit,
): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", ...cabeceras },
  });
}

export async function POST(request: Request): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder({ error: MENSAJE_ERROR }, 401);

  // Límite de solicitudes por persona (cada llamada tiene costo): antes de
  // leer el cuerpo, para no hacer trabajo de más si ya se superó el cupo.
  const cupo = consumirCupo(
    `mejorar-texto:${sesion.documento || ipDeSolicitud(request.headers)}`,
    MAXIMO_POR_VENTANA,
    VENTANA_MS,
  );
  if (!cupo.permitido) {
    return responder({ error: MENSAJE_ERROR }, 429, {
      "Retry-After": String(cupo.reintentarEn),
    });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ error: MENSAJE_ERROR }, 400);
  }

  if (!cuerpo || typeof cuerpo !== "object") {
    return responder({ error: MENSAJE_ERROR }, 400);
  }

  const { texto, modo: modoCrudo } = cuerpo as Record<string, unknown>;

  if (typeof texto !== "string" || !texto.trim() || texto.length > LONGITUD_MAXIMA) {
    return responder({ error: MENSAJE_ERROR }, 400);
  }

  const modo: ModoMejora = modoCrudo === "profesional" ? "profesional" : "corregir";

  try {
    const textoMejorado = enModoSimulado()
      ? await mejorarSimulado(texto, modo)
      : await mejorarTexto(texto, modo);
    return responder({ textoMejorado });
  } catch (causa) {
    console.error(
      "[mejorar-texto] fallo al mejorar el texto:",
      causa instanceof ErrorAsistenteRedaccion ? causa.message : causa,
    );
    return responder({ error: MENSAJE_ERROR }, 502);
  }
}
