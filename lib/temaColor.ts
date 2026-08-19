/**
 * Selector de color de marca (icono en el encabezado). El sistema entero se
 * apoya en un único matiz oklch, `--inst-hue` (`app/globals.css`); cambiarlo
 * reconstruye toda la rampa de color de la aplicación con el mismo contraste,
 * porque L y C quedan fijos por paso.
 *
 * `SCRIPT_COLOR_TEMA` se inyecta con `strategy="beforeInteractive"` desde
 * `app/layout.tsx` para aplicar el matiz guardado antes del primer pintado:
 * sin eso, la página se vería un instante con el color por defecto y luego
 * saltaría al elegido.
 */

export const LLAVE_COLOR_TEMA = "bienestar-color-tema";

export interface PresetColorTema {
  id: string;
  etiqueta: string;
  matiz: number;
}

/** Matices curados. La rampa fija L y C por paso, así que el contraste de
 *  texto no cambia sin importar cuál se elija. */
export const PRESETS_COLOR_TEMA: readonly PresetColorTema[] = [
  { id: "verde-azulado", etiqueta: "Verde azulado", matiz: 193 },
  { id: "azul", etiqueta: "Azul", matiz: 228 },
  { id: "indigo", etiqueta: "Índigo", matiz: 275 },
  { id: "esmeralda", etiqueta: "Esmeralda", matiz: 152 },
  { id: "ambar", etiqueta: "Ámbar", matiz: 75 },
  { id: "rosa", etiqueta: "Rosa", matiz: 350 },
];

export const MATIZ_PREDETERMINADO = PRESETS_COLOR_TEMA[0].matiz;

function matizValido(valor: number): boolean {
  return Number.isFinite(valor) && valor >= 0 && valor < 360;
}

/** Aplica un matiz al documento; ignora valores fuera de rango. */
export function aplicarColorTema(matiz: number) {
  if (!matizValido(matiz)) return;
  document.documentElement.style.setProperty("--inst-hue", String(matiz));
}

/** Lee el matiz guardado, o `null` si no hay ninguno (o no es válido). */
export function leerColorTemaGuardado(): number | null {
  try {
    const guardado = localStorage.getItem(LLAVE_COLOR_TEMA);
    if (guardado === null) return null;
    const matiz = Number(guardado);
    return matizValido(matiz) ? matiz : null;
  } catch {
    return null;
  }
}

/** Guarda el matiz elegido para que persista entre visitas. */
export function guardarColorTema(matiz: number) {
  try {
    localStorage.setItem(LLAVE_COLOR_TEMA, String(matiz));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota agotada): el matiz
    // sigue aplicado en esta sesión, sólo no persiste a la siguiente.
  }
}

/**
 * Script inline (ejecutado antes de la hidratación) que aplica el matiz
 * guardado al elemento raíz antes del primer pintado.
 */
export const SCRIPT_COLOR_TEMA = `
(function () {
  try {
    var guardado = localStorage.getItem(${JSON.stringify(LLAVE_COLOR_TEMA)});
    var matiz = guardado === null ? null : Number(guardado);
    if (matiz !== null && Number.isFinite(matiz) && matiz >= 0 && matiz < 360) {
      document.documentElement.style.setProperty("--inst-hue", String(matiz));
    }
  } catch (e) {}
})();
`;
