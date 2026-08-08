import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Asistente de redacción para los campos de texto largo de los formularios
 * clínicos (motivo, procedimiento, atención inicial, diagnóstico presuntivo,
 * descripción de seguimiento, observaciones).
 *
 * Dos modos, misma disciplina en ambos: SIN alterar el contenido clínico —
 * no agrega información, no infiere síntomas ni diagnósticos, no cambia
 * cifras ni términos médicos.
 *   - "corregir":    sólo ortografía, gramática, puntuación. Cambios mínimos.
 *   - "profesional": reescribe a registro clínico (tercera persona, objetivo).
 *
 * Sólo se usa desde `/api/mejorar-texto`; nada de este módulo debe llegar al
 * navegador (la clave de Anthropic no es pública).
 */

const LATENCIA_SIMULADA_MS = 500;

/** Longitud máxima razonable de un campo de texto largo del formulario. */
export const LONGITUD_MAXIMA = 2000;

const MODELO = "claude-sonnet-5";
const MAXIMO_TOKENS_SALIDA = 1024;

export type ModoMejora = "corregir" | "profesional";

const INSTRUCCION_SISTEMA_CORREGIR = `Eres un corrector de textos clínicos en español de Colombia. Corrige ÚNICAMENTE ortografía, gramática, puntuación y redacción para que el texto sea claro y profesional.

REGLAS ESTRICTAS:
- No agregues información que no esté en el texto.
- No inventes ni infieras síntomas, diagnósticos ni datos.
- No cambies términos médicos ni cifras.
- No diagnostiques.
- No resaltes ni comentes nombres propios.
- Conserva el mismo significado y nivel de detalle.

Devuelve SOLO el texto corregido, sin comentarios, sin explicaciones, sin comillas.`;

const INSTRUCCION_SISTEMA_PROFESIONAL = `Eres un profesional de la salud que redacta registros clínicos en español de Colombia. Reescribe el texto en un registro clínico profesional: tercera persona, objetivo, terminología de salud apropiada, claro y conciso.

REGLAS ESTRICTAS (idénticas al modo de corrección):
- No agregues información que no esté en el texto.
- No inventes ni infieras síntomas, diagnósticos ni datos.
- No cambies términos médicos ni cifras.
- No diagnostiques.
- No resaltes ni comentes nombres propios.
- Conserva el mismo significado y nivel de detalle.
- NO alargues ni infles el texto con floritura innecesaria: un registro clínico debe ser conciso.

Devuelve SOLO el texto reescrito, sin comentarios, sin explicaciones, sin comillas.`;

function instruccionSistema(modo: ModoMejora): string {
  return modo === "profesional" ? INSTRUCCION_SISTEMA_PROFESIONAL : INSTRUCCION_SISTEMA_CORREGIR;
}

export function enModoSimulado(): boolean {
  return process.env.MEJORAR_TEXTO_MOCK === "true";
}

export class ErrorAsistenteRedaccion extends Error {}

/**
 * Respuesta simulada, para desarrollar o hacer pruebas sin gastar cupo de la
 * API. Ordena espacios y capitaliza la primera letra en los dos modos; en
 * "profesional" además cierra la oración con punto, para que se note la
 * diferencia entre modos sin depender de una clave real.
 */
export async function mejorarSimulado(
  texto: string,
  modo: ModoMejora = "corregir",
): Promise<string> {
  await new Promise((resolver) => setTimeout(resolver, LATENCIA_SIMULADA_MS));
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (!limpio) return limpio;

  const capitalizado = limpio[0].toUpperCase() + limpio.slice(1);
  if (modo === "profesional") {
    return /[.!?]$/.test(capitalizado) ? capitalizado : `${capitalizado}.`;
  }
  return capitalizado;
}

export async function mejorarTexto(
  texto: string,
  modo: ModoMejora = "corregir",
): Promise<string> {
  const claveApi = process.env.ANTHROPIC_API_KEY;
  if (!claveApi) {
    throw new ErrorAsistenteRedaccion("Falta configurar ANTHROPIC_API_KEY.");
  }

  const cliente = new Anthropic({ apiKey: claveApi });

  let respuesta: Anthropic.Message;
  try {
    respuesta = await cliente.messages.create({
      model: MODELO,
      max_tokens: MAXIMO_TOKENS_SALIDA,
      system: instruccionSistema(modo),
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      messages: [{ role: "user", content: texto }],
    });
  } catch (causa) {
    throw new ErrorAsistenteRedaccion(
      causa instanceof Error ? causa.message : "Fallo desconocido al llamar a Anthropic.",
    );
  }

  if (respuesta.stop_reason === "refusal") {
    throw new ErrorAsistenteRedaccion("El modelo rechazó procesar el texto.");
  }

  const bloqueTexto = respuesta.content.find(
    (bloque): bloque is Anthropic.TextBlock => bloque.type === "text",
  );

  if (!bloqueTexto || !bloqueTexto.text.trim()) {
    throw new ErrorAsistenteRedaccion("El modelo no devolvió texto.");
  }

  return bloqueTexto.text.trim();
}
