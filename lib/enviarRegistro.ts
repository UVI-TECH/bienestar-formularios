/** Cliente de `POST /api/submit/[formato]`, para usar desde el navegador. */

const MENSAJES: Record<number, string> = {
  400: "El registro llegó incompleto al servidor. Revise los datos e intente de nuevo.",
  404: "El formato no está habilitado para envío.",
  502: "No fue posible entregar el registro. Intente de nuevo en un momento.",
};

const MENSAJE_RED =
  "No hay conexión con el servidor. Verifique la red e intente de nuevo.";

/**
 * Entrega el registro. Lanza un `Error` con un mensaje presentable si falla,
 * que es lo que `FormularioBase` espera para mostrarlo en la barra de acciones.
 */
export async function enviarRegistro(
  formato: string,
  registro: Record<string, string>,
): Promise<void> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`/api/submit/${formato}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registro),
    });
  } catch {
    throw new Error(MENSAJE_RED);
  }

  if (!respuesta.ok) {
    throw new Error(MENSAJES[respuesta.status] ?? MENSAJE_RED);
  }
}
