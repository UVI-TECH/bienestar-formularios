import { generarActividadId, marcaDeTiempo } from "@/lib/envio";
import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import { tieneModulo } from "@/lib/modulos";
import { obtenerSesion } from "@/lib/sesion";

/**
 * POST /api/submit/actividad
 *
 * Registra una actividad institucional completa: los datos del evento más la
 * lista de asistentes que se fueron agregando en pantalla. Mismo criterio que
 * `/api/submit/brigada`: el cuerpo trae un arreglo (`asistentes`), así que no
 * pasa por `sanearRegistro` (que descarta arreglos a propósito para los
 * formatos de fila plana) — este endpoint sanea el suyo a mano.
 *
 * La URL del flujo NUNCA sale de aquí: vive en `PA_URL_GUARDAR_ACTIVIDAD` y ni
 * su valor ni su existencia se reflejan en la respuesta.
 *
 *   200  actividad entregada
 *   400  cuerpo ilegible, sin datos del evento o sin asistentes
 *   401  sin sesión
 *   403  la sesión no tiene el módulo "actividades"
 *   429  demasiados envíos seguidos
 *   502  el flujo falló, no respondió o no está configurado
 */

const TIEMPO_LIMITE_MS = 15_000;
const LATENCIA_SIMULADA_MS = 500;

const MAXIMO_POR_VENTANA = 20;
const VENTANA_MS = 60_000;

const MAXIMO_ASISTENTES = 500;
const MAXIMO_LARGO_CORTO = 200;

interface AsistenteActividad {
  nombres_apellidos: string;
  documento: string;
  cargo: string;
  dependencia: string;
  correo: string;
}

function limpiarTexto(valor: unknown, maximo = MAXIMO_LARGO_CORTO): string {
  return typeof valor === "string" ? valor.trim().slice(0, maximo) : "";
}

/** `undefined` si al asistente le falta un dato obligatorio. */
function sanearAsistente(valor: unknown): AsistenteActividad | undefined {
  if (!valor || typeof valor !== "object") return undefined;
  const v = valor as Record<string, unknown>;

  const nombresApellidos = limpiarTexto(v.nombres_apellidos, 160);
  const documento = limpiarTexto(v.documento, 12);

  if (!nombresApellidos || !documento) return undefined;

  return {
    nombres_apellidos: nombresApellidos,
    documento,
    cargo: limpiarTexto(v.cargo, 120),
    dependencia: limpiarTexto(v.dependencia, 120),
    correo: limpiarTexto(v.correo, 160),
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
  if (!tieneModulo(sesion.modulos, "actividades")) return responder(false, 403);

  const ip = ipDeSolicitud(request.headers);
  const cupo = consumirCupo(`submit:actividad:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS);
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

  const tema = limpiarTexto(c.tema, MAXIMO_LARGO_CORTO);
  const facilitador = limpiarTexto(c.facilitador, 120);
  const fecha = limpiarTexto(c.fecha, 10);
  const horaInicio = limpiarTexto(c.hora_inicio, 5);
  const horaFin = limpiarTexto(c.hora_fin, 5);
  const lugar = limpiarTexto(c.lugar, MAXIMO_LARGO_CORTO);

  if (!tema || !facilitador || !fecha) return responder(false, 400);

  const entrada = Array.isArray(c.asistentes) ? c.asistentes : [];
  const asistentes = entrada
    .slice(0, MAXIMO_ASISTENTES)
    .map(sanearAsistente)
    .filter((asistente): asistente is AsistenteActividad => Boolean(asistente));

  if (asistentes.length === 0) return responder(false, 400);

  const actividadId = generarActividadId();
  const fila = {
    actividad_id: actividadId,
    tema,
    facilitador,
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    lugar,
    registrado_en: marcaDeTiempo(),
    asistentes,
  };

  // Modo simulado: nada sale a la red, el registro queda en la consola.
  if (process.env.SUBMIT_MOCK === "true") {
    console.log("[submit:actividad] (simulado)", JSON.stringify(fila, null, 2));
    await new Promise((resolver) => setTimeout(resolver, LATENCIA_SIMULADA_MS));
    return responder(true, 200, { actividad_id: actividadId, asistentes: asistentes.length });
  }

  const url = process.env.PA_URL_GUARDAR_ACTIVIDAD;
  if (!url) {
    console.error("[submit:actividad] falta la variable PA_URL_GUARDAR_ACTIVIDAD.");
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
      console.error(`[submit:actividad] Power Automate respondió ${respuesta.status}.`);
      return responder(false, 502);
    }

    return responder(true, 200, { actividad_id: actividadId, asistentes: asistentes.length });
  } catch (causa) {
    console.error("[submit:actividad] no fue posible entregar el registro:", causa);
    return responder(false, 502);
  }
}
