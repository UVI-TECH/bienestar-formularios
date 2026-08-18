/** Cliente de `POST /api/submit/brigada`, para usar desde el navegador. */

export interface AsistenteBrigadaEnvio {
  documento: string;
  nombres: string;
  apellidos: string;
  tipo_persona: string;
  semestre: string;
  programa: string;
  motivo_consulta: string;
}

export interface BrigadaEnvio {
  fecha: string;
  empresa: string;
  profesional: string;
  sede: string;
  asistentes: AsistenteBrigadaEnvio[];
}

export interface ResultadoEnvioBrigada {
  ok: boolean;
  /** Radicado de la brigada. Lo genera el servidor. */
  brigada_id?: string;
  /** Cuántos asistentes quedaron guardados. */
  asistentes?: number;
}

const MENSAJES: Record<number, string> = {
  400: "La brigada llegó incompleta al servidor. Revise el evento y los asistentes e intente de nuevo.",
  502: "No fue posible entregar la brigada. Intente de nuevo en un momento.",
};

const MENSAJE_RED =
  "No hay conexión con el servidor. Verifique la red e intente de nuevo.";

export async function enviarBrigada(
  brigada: BrigadaEnvio,
): Promise<ResultadoEnvioBrigada> {
  let respuesta: Response;

  try {
    respuesta = await fetch("/api/submit/brigada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brigada),
    });
  } catch {
    throw new Error(MENSAJE_RED);
  }

  if (!respuesta.ok) {
    throw new Error(MENSAJES[respuesta.status] ?? MENSAJE_RED);
  }

  try {
    return (await respuesta.json()) as ResultadoEnvioBrigada;
  } catch {
    return { ok: true };
  }
}
