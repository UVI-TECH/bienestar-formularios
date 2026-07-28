/**
 * Índice de masa corporal y su clasificación.
 *
 * El valor es **informativo**: acompaña la toma de medidas, no diagnostica.
 * Por eso la clasificación se presenta como texto neutro, sin semáforos.
 */

/** Umbrales de la Organización Mundial de la Salud, en kg/m². */
export const CLASIFICACIONES_IMC = [
  { hasta: 18.5, etiqueta: "Bajo peso" },
  { hasta: 25, etiqueta: "Peso normal" },
  { hasta: 30, etiqueta: "Sobrepeso" },
  { hasta: Infinity, etiqueta: "Obesidad" },
] as const;

/**
 * IMC = peso (kg) / talla (m)². Devuelve `null` mientras falte un dato o los
 * valores no tengan sentido, para no mostrar una cifra a medio calcular.
 */
export function calcularImc(
  pesoKg: string | number,
  tallaCm: string | number,
): number | null {
  const peso = Number(pesoKg);
  const talla = Number(tallaCm);

  if (!Number.isFinite(peso) || !Number.isFinite(talla)) return null;
  if (peso <= 0 || talla <= 0) return null;

  const tallaMetros = talla / 100;
  const imc = peso / (tallaMetros * tallaMetros);

  if (!Number.isFinite(imc)) return null;

  return Math.round(imc * 10) / 10;
}

/** Clasificación de la OMS para un IMC. Cadena vacía si aún no hay valor. */
export function clasificarImc(imc: number | null): string {
  if (imc === null) return "";
  return (
    CLASIFICACIONES_IMC.find(({ hasta }) => imc < hasta)?.etiqueta ?? "Obesidad"
  );
}
