import { timingSafeEqual } from "node:crypto";
import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import { tieneModulo } from "@/lib/modulos";
import { ErrorPersonas, consultarPersona } from "@/lib/personas";
import { crearSesion } from "@/lib/sesion";
import { normalizarCedula, validarCedula } from "@/lib/validacion";

/**
 * POST /api/login
 *
 * Verifica el documento —y la clave, si la persona la requiere— contra la
 * fila de la tabla Personas, y si es válido abre sesión.
 *
 * Cuerpo:  { documento: string, clave?: string }
 * Respuesta (SIEMPRE esta forma):
 *          { autenticado: boolean, requiereClave?, nombres?, apellidos?, modulos? }
 *
 * `requiereClave: true` con `autenticado: false` no es un error: es el aviso
 * de que hay que reenviar la solicitud con `clave`. Los errores de verdad
 * viajan en el código HTTP:
 *   400  cuerpo o documento inválido
 *   401  documento no encontrado, inactivo, o clave incorrecta
 *   429  se superó el límite de intentos
 *   502  el servicio de personas falló o está mal configurado
 */

const MAXIMO_POR_VENTANA = 10;
const VENTANA_MS = 60_000;

interface RespuestaLogin {
  autenticado: boolean;
  requiereClave?: boolean;
  nombres?: string;
  apellidos?: string;
  modulos?: string[];
}

const NO_AUTENTICADO: RespuestaLogin = { autenticado: false };

function responder(
  cuerpo: RespuestaLogin,
  estado = 200,
  cabeceras?: HeadersInit,
): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", ...cabeceras },
  });
}

/** Comparación en tiempo constante: evita filtrar la clave por temporización. */
function clavesCoinciden(enviada: string, esperada: string): boolean {
  const a = Buffer.from(enviada);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  // 1. Límite de intentos, antes de cualquier trabajo.
  const ip = ipDeSolicitud(request.headers);
  const cupo = consumirCupo(`login:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS);

  if (!cupo.permitido) {
    return responder(NO_AUTENTICADO, 429, {
      "Retry-After": String(cupo.reintentarEn),
    });
  }

  // 2. Cuerpo de la solicitud.
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder(NO_AUTENTICADO, 400);
  }

  if (!cuerpo || typeof cuerpo !== "object") {
    return responder(NO_AUTENTICADO, 400);
  }

  const { documento: documentoCrudo, clave } = cuerpo as {
    documento?: unknown;
    clave?: unknown;
  };

  if (typeof documentoCrudo !== "string") {
    return responder(NO_AUTENTICADO, 400);
  }

  const documento = normalizarCedula(documentoCrudo);
  if (validarCedula(documento)) {
    return responder(NO_AUTENTICADO, 400);
  }

  const claveEnviada = typeof clave === "string" ? clave : "";

  // 3. Consulta a la tabla Personas.
  let persona;
  try {
    persona = await consultarPersona(documento);
  } catch (causa) {
    console.error(
      "[login] fallo al consultar personas:",
      causa instanceof ErrorPersonas ? causa.message : causa,
    );
    return responder(NO_AUTENTICADO, 502);
  }

  if (!persona || !persona.activo) {
    return responder(NO_AUTENTICADO, 401);
  }

  // "seguimiento" y "admin" comparten el requisito de clave; `tieneModulo`
  // ya trata a "admin" como si tuviera cualquier módulo, así que basta con
  // preguntar por "seguimiento".
  const requiereClave = tieneModulo(persona.modulos, "seguimiento");

  if (requiereClave) {
    if (!claveEnviada) {
      return responder({ autenticado: false, requiereClave: true });
    }
    if (!persona.clave || !clavesCoinciden(claveEnviada, persona.clave)) {
      return responder(NO_AUTENTICADO, 401);
    }
  }

  // 4. Sesión. Nunca se devuelve la clave ni la fila cruda al navegador.
  await crearSesion({
    documento: persona.documento,
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    modulos: persona.modulos,
  });

  return responder({
    autenticado: true,
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    modulos: persona.modulos,
  });
}
