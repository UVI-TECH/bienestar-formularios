import {
  camposDelServidor,
  esFormatoEnviable,
  sanearRegistro,
  variableDeFlujo,
} from "@/lib/envio";

/**
 * POST /api/submit/[formato]
 *
 * Recibe un registro ya diligenciado y lo entrega al flujo de Power Automate
 * que lo agrega como fila en Excel.
 *
 * Formatos aceptados: enfermeria | consulta-medica | tamizaje | poliza.
 *
 * El cuerpo llega con claves planas en snake_case (fecha, hora, sede,
 * tipo_persona, cedula, nombres, apellidos, programa, semestre, dependencia,
 * motivo, procedimiento, enfermera). El servidor agrega `registrado_en`.
 *
 * La URL del flujo NUNCA sale de aquí: vive en `PA_URL_<FORMATO>` y ni su
 * valor ni su existencia se reflejan en la respuesta.
 *
 *   200  registro entregado
 *   400  cuerpo ilegible o sin campos utilizables
 *   404  formato desconocido
 *   502  el flujo falló, no respondió o no está configurado
 */

const TIEMPO_LIMITE_MS = 15_000;
const LATENCIA_SIMULADA_MS = 500;

function responder(
  ok: boolean,
  estado = 200,
  extra?: Record<string, string>,
): Response {
  return Response.json(
    { ok, ...extra },
    { status: estado, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  contexto: { params: Promise<{ formato: string }> },
): Promise<Response> {
  const { formato } = await contexto.params;

  if (!esFormatoEnviable(formato)) return responder(false, 404);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder(false, 400);
  }

  const registro = sanearRegistro(cuerpo);
  if (Object.keys(registro).length === 0) return responder(false, 400);

  // El servidor agrega la marca de tiempo y, en póliza, el radicado del caso.
  // Se devuelven al cliente para que la confirmación pueda mostrarlos.
  const generados = camposDelServidor(formato);
  const fila = { ...registro, ...generados };
  const devueltos = generados.caso_id ? { caso_id: generados.caso_id } : undefined;

  // Modo simulado: nada sale a la red, el registro queda en la consola.
  if (process.env.SUBMIT_MOCK === "true") {
    console.log(`[submit:${formato}] (simulado)`, JSON.stringify(fila, null, 2));
    await new Promise((resolver) => setTimeout(resolver, LATENCIA_SIMULADA_MS));
    return responder(true, 200, devueltos);
  }

  const variable = variableDeFlujo(formato);
  const url = process.env[variable];

  if (!url) {
    console.error(`[submit:${formato}] falta la variable ${variable}.`);
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
      // El cuerpo del flujo puede traer la URL o detalles internos: no se
      // reenvía, sólo se registra en el servidor.
      console.error(
        `[submit:${formato}] Power Automate respondió ${respuesta.status}.`,
      );
      return responder(false, 502);
    }

    return responder(true, 200, devueltos);
  } catch (causa) {
    console.error(
      `[submit:${formato}] no fue posible entregar el registro:`,
      causa instanceof Error ? causa.message : causa,
    );
    return responder(false, 502);
  }
}
