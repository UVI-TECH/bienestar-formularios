/** Cliente de `POST /api/submit/actividad`, para usar desde el navegador. */

export interface AsistenteActividadEnvio {
  nombres_apellidos: string;
  documento: string;
  cargo: string;
  dependencia: string;
  correo: string;
}

export interface ActividadEnvio {
  tema: string;
  facilitador: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  asistentes: AsistenteActividadEnvio[];
}

export interface ResultadoEnvioActividad {
  ok: boolean;
  /** Radicado de la actividad. Lo genera el servidor. */
  actividad_id?: string;
  /** Cuántos asistentes quedaron guardados. */
  asistentes?: number;
}

const MENSAJES: Record<number, string> = {
  400: "La actividad llegó incompleta al servidor. Revise el evento y los asistentes e intente de nuevo.",
  502: "No fue posible entregar la actividad. Intente de nuevo en un momento.",
};

const MENSAJE_RED =
  "No hay conexión con el servidor. Verifique la red e intente de nuevo.";

export async function enviarActividad(
  actividad: ActividadEnvio,
): Promise<ResultadoEnvioActividad> {
  let respuesta: Response;

  try {
    respuesta = await fetch("/api/submit/actividad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actividad),
    });
  } catch {
    throw new Error(MENSAJE_RED);
  }

  if (!respuesta.ok) {
    throw new Error(MENSAJES[respuesta.status] ?? MENSAJE_RED);
  }

  try {
    return (await respuesta.json()) as ResultadoEnvioActividad;
  } catch {
    return { ok: true };
  }
}
