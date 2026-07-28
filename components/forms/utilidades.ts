import type { ErroresFormulario } from "@/lib/types";

/** Duración del resaltado de los campos que llegan de la consulta por documento. */
export const RESALTADO_MS = 900;

/** Quita los errores de los campos indicados, sin tocar los demás. */
export function sinErrores(
  previos: ErroresFormulario,
  ...campos: string[]
): ErroresFormulario {
  if (!campos.some((campo) => previos[campo])) return previos;
  const copia = { ...previos };
  for (const campo of campos) delete copia[campo];
  return copia;
}
