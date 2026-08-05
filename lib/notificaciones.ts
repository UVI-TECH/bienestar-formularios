import "server-only";

import { listarPersonas } from "./personas";

/**
 * Notificación por correo a las personas responsables de seguimiento, cuando
 * una atención por accidente (póliza estudiantil) queda registrada con
 * estado "En seguimiento".
 *
 * Sólo se usa desde `app/api/submit/[formato]/route.ts`, como paso posterior
 * al registro del caso — nunca debe hacerlo fallar. Por eso esta función
 * lanza sus propios errores (`ErrorNotificacion`) en vez de tragárselos: es
 * responsabilidad de quien la llama decidir que un fallo aquí no es un fallo
 * del registro (ver el try/catch alrededor de la llamada en esa ruta).
 */

export class ErrorNotificacion extends Error {}

export interface DatosNotificacionSeguimiento {
  casoId: string;
  estudiante: string;
  sede: string;
  diagnosticoPresuntivo: string;
  urlCaso: string;
}

const TIEMPO_LIMITE_MS = 10_000;

/**
 * Correos, separados por `;`, de quienes deben enterarse de un caso nuevo en
 * seguimiento: personas activas, con módulo "seguimiento" o "admin" (que
 * implica todos los módulos, igual que en el resto de la app) y con correo.
 */
async function destinatariosSeguimiento(): Promise<string> {
  const personas = await listarPersonas();
  return personas
    .filter(
      (persona) =>
        persona.activo &&
        (persona.modulos.includes("seguimiento") || persona.modulos.includes("admin")) &&
        persona.correo,
    )
    .map((persona) => persona.correo)
    .join(";");
}

export async function notificarResponsablesSeguimiento(
  datos: DatosNotificacionSeguimiento,
): Promise<void> {
  const url = process.env.PA_URL_NOTIFICAR_SEGUIMIENTO;
  if (!url) throw new ErrorNotificacion("Falta configurar PA_URL_NOTIFICAR_SEGUIMIENTO.");

  const destinatarios = await destinatariosSeguimiento();
  if (!destinatarios) {
    console.info(
      `[notificaciones] caso ${datos.casoId}: nadie activo con módulo seguimiento/admin y correo; no se envía notificación.`,
    );
    return;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        caso_id: datos.casoId,
        estudiante: datos.estudiante,
        sede: datos.sede,
        diagnostico_presuntivo: datos.diagnosticoPresuntivo,
        url_caso: datos.urlCaso,
        destinatarios,
      }),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (causa) {
    throw new ErrorNotificacion(
      causa instanceof Error && causa.name === "TimeoutError"
        ? "El servicio de notificación no respondió a tiempo."
        : "No fue posible contactar el servicio de notificación.",
    );
  }

  if (!respuesta.ok) {
    throw new ErrorNotificacion(`El servicio de notificación respondió ${respuesta.status}.`);
  }
}
