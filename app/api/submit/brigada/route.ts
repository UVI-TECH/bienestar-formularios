import { generarBrigadaId, marcaDeTiempo } from "@/lib/envio";
import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import { tieneModulo } from "@/lib/modulos";
import { obtenerSesion } from "@/lib/sesion";

/**
 * POST /api/submit/brigada
 *
 * Registra una brigada de salud completa: los datos del evento más la lista
 * de asistentes que se fueron agregando en pantalla. A diferencia de
 * `/api/submit/[formato]`, el cuerpo trae un arreglo (`asistentes`), así que
 * no pasa por `sanearRegistro` (que descarta arreglos a propósito para los
 * formatos de fila plana) — este endpoint sanea el suyo a mano.
 *
 * La URL del flujo NUNCA sale de aquí: vive en `PA_URL_GUARDAR_BRIGADA` y ni
 * su valor ni su existencia se reflejan en la respuesta.
 *
 *   200  brigada entregada
 *   400  cuerpo ilegible, sin datos del evento o sin asistentes
 *   401  sin sesión
 *   403  la sesión no tiene el módulo "brigadas"
 *   429  demasiados envíos seguidos
 *   502  el flujo falló, no respondió o no está configurado
 */

const TIEMPO_LIMITE_MS = 15_000;
const LATENCIA_SIMULADA_MS = 500;

const MAXIMO_POR_VENTANA = 20;
const VENTANA_MS = 60_000;

const MAXIMO_ASISTENTES = 300;
const MAXIMO_LARGO_CORTO = 200;
const MAXIMO_LARGO_TEXTO = 2000;

interface AsistenteBrigada {
  documento: string;
  nombres: string;
  apellidos: string;
  tipo_persona: string;
  semestre: string;
  programa: string;
  motivo_consulta: string;
}

function limpiarTexto(valor: unknown, maximo = MAXIMO_LARGO_CORTO): string {
  return typeof valor === "string" ? valor.trim().slice(0, maximo) : "";
}

/** `undefined` si al asistente le falta un dato obligatorio. */
function sanearAsistente(valor: unknown): AsistenteBrigada | undefined {
  if (!valor || typeof valor !== "object") return undefined;
  const v = valor as Record<string, unknown>;

  const documento = limpiarTexto(v.documento, 12);
  const nombres = limpiarTexto(v.nombres, 120);
  const apellidos = limpiarTexto(v.apellidos, 120);
  const tipoPersona = limpiarTexto(v.tipo_persona, 40);
  const motivoConsulta = limpiarTexto(v.motivo_consulta, MAXIMO_LARGO_TEXTO);

  if (!documento || !nombres || !apellidos || !tipoPersona || !motivoConsulta) {
    return undefined;
  }

  return {
    documento,
    nombres,
    apellidos,
    tipo_persona: tipoPersona,
    semestre: limpiarTexto(v.semestre, 10),
    programa: limpiarTexto(v.programa, 120),
    motivo_consulta: motivoConsulta,
  };
}

function responder(
  ok: boolean,
  estado = 200,
  extra?: Record<string, unknown>,
  cabeceras?: HeadersInit,
): Response {
  return Response.json(
    { ok, ...extra },
    { status: estado, headers: { "Cache-Control": "no-store", ...cabeceras } },
  );
}

export async function POST(request: Request): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder(false, 401);
  if (!tieneModulo(sesion.modulos, "brigadas")) return responder(false, 403);

  const ip = ipDeSolicitud(request.headers);
  const cupo = consumirCupo(`submit:brigada:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS);
  if (!cupo.permitido) {
    return responder(false, 429, undefined, { "Retry-After": String(cupo.reintentarEn) });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder(false, 400);
  }

  if (!cuerpo || typeof cuerpo !== "object") return responder(false, 400);
  const c = cuerpo as Record<string, unknown>;

  const fecha = limpiarTexto(c.fecha, 10);
  const empresa = limpiarTexto(c.empresa, MAXIMO_LARGO_CORTO);
  const profesional = limpiarTexto(c.profesional, 120);
  const sede = limpiarTexto(c.sede, 60);

  if (!fecha || !empresa || !profesional) return responder(false, 400);

  const entrada = Array.isArray(c.asistentes) ? c.asistentes : [];
  const asistentes = entrada
    .slice(0, MAXIMO_ASISTENTES)
    .map(sanearAsistente)
    .filter((asistente): asistente is AsistenteBrigada => Boolean(asistente));

  if (asistentes.length === 0) return responder(false, 400);

  const brigadaId = generarBrigadaId();
  const fila = {
    brigada_id: brigadaId,
    fecha,
    empresa,
    profesional,
    sede,
    registrado_en: marcaDeTiempo(),
    asistentes,
  };

  // Modo simulado: nada sale a la red, el registro queda en la consola.
  if (process.env.SUBMIT_MOCK === "true") {
    console.log("[submit:brigada] (simulado)", JSON.stringify(fila, null, 2));
    await new Promise((resolver) => setTimeout(resolver, LATENCIA_SIMULADA_MS));
    return responder(true, 200, { brigada_id: brigadaId, asistentes: asistentes.length });
  }

  const url = process.env.PA_URL_GUARDAR_BRIGADA;
  if (!url) {
    console.error("[submit:brigada] falta la variable PA_URL_GUARDAR_BRIGADA.");
    return responder(false, 502);
  }

  try {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(fila),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      cache: "no-store",
    });

    if (!respuesta.ok) {
      console.error(`[submit:brigada] Power Automate respondió ${respuesta.status}.`);
      return responder(false, 502);
    }

    return responder(true, 200, { brigada_id: brigadaId, asistentes: asistentes.length });
  } catch (causa) {
    console.error("[submit:brigada] no fue posible entregar el registro:", causa);
    return responder(false, 502);
  }
}
