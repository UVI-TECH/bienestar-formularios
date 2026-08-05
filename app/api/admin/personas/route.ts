import { consumirCupo, ipDeSolicitud } from "@/lib/limitadorTasa";
import { MODULOS, tieneModulo } from "@/lib/modulos";
import {
  ErrorPersonas,
  crearPersona,
  listarPersonas,
  sinClave,
} from "@/lib/personas";
import { obtenerSesion } from "@/lib/sesion";
import { normalizarCedula, validarCedula } from "@/lib/validacion";

const MAXIMO_POR_VENTANA = 20;
const VENTANA_MS = 60_000;

function responder(cuerpo: unknown, estado = 200, cabeceras?: HeadersInit): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", ...cabeceras },
  });
}

/** Lista todas las personas, sin la columna `clave`: nunca llega al navegador. */
export async function GET(): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder({ ok: false }, 401);
  if (!tieneModulo(sesion.modulos, "admin")) return responder({ ok: false }, 403);

  try {
    const personas = await listarPersonas();
    return responder({ ok: true, personas: personas.map(sinClave) });
  } catch (causa) {
    console.error(
      "[admin/personas] fallo al listar personas:",
      causa instanceof ErrorPersonas ? causa.message : causa,
    );
    return responder({ ok: false }, 502);
  }
}

export async function POST(request: Request): Promise<Response> {
  const sesion = await obtenerSesion();
  if (!sesion) return responder({ ok: false }, 401);
  if (!tieneModulo(sesion.modulos, "admin")) return responder({ ok: false }, 403);

  const ip = ipDeSolicitud(request.headers);
  const cupo = consumirCupo(`admin-personas:${ip}`, MAXIMO_POR_VENTANA, VENTANA_MS);
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
    documento: documentoCrudo,
    nombres,
    apellidos,
    rol_etiqueta: rolEtiqueta,
    modulos: modulosCrudo,
    clave,
    activo,
  } = cuerpo as Record<string, unknown>;

  if (typeof documentoCrudo !== "string") return responder({ ok: false }, 400);
  const documento = normalizarCedula(documentoCrudo);
  if (validarCedula(documento)) {
    return responder({ ok: false, mensaje: "El documento no es válido." }, 400);
  }

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

  const clavePropuesta = typeof clave === "string" ? clave.trim() : "";
  const requiereClave = listaModulos.includes("seguimiento") || listaModulos.includes("admin");
  if (requiereClave && !clavePropuesta) {
    return responder(
      {
        ok: false,
        mensaje: "Esta persona necesita una clave para entrar a seguimiento o administración.",
      },
      400,
    );
  }

  try {
    const existentes = await listarPersonas();
    if (existentes.some((p) => p.documento === documento)) {
      return responder({ ok: false, mensaje: "Ya existe una persona con ese documento." }, 409);
    }

    await crearPersona({
      documento,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      rolEtiqueta: typeof rolEtiqueta === "string" ? rolEtiqueta.trim() : "",
      modulos: listaModulos,
      clave: clavePropuesta,
      activo: activo !== false,
    });

    return responder({ ok: true });
  } catch (causa) {
    console.error(
      "[admin/personas] fallo al crear persona:",
      causa instanceof ErrorPersonas ? causa.message : causa,
    );
    return responder({ ok: false }, 502);
  }
}
