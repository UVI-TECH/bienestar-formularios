import type { Transition, Variants } from "motion/react";

/**
 * Tokens de movimiento para JavaScript (Motion).
 *
 * Espejo de los tokens `--dur-*` / `--ease-salida` de `app/globals.css`.
 * Si cambia una duración allá, cámbiela aquí. El movimiento es una herramienta
 * de trabajo: orienta, no decora. Nada supera los 250 ms.
 */

/** Duraciones en segundos (Motion trabaja en segundos, el CSS en milisegundos). */
export const DURACION = {
  rapida: 0.15,
  base: 0.2,
  media: 0.25,
} as const;

/** Curva de salida única del sistema: `cubic-bezier(0.22, 0.61, 0.36, 1)`. */
export const SALIDA = [0.22, 0.61, 0.36, 1] as const;

export const transicionRapida: Transition = {
  duration: DURACION.rapida,
  ease: SALIDA,
};

export const transicionBase: Transition = {
  duration: DURACION.base,
  ease: SALIDA,
};

export const transicionMedia: Transition = {
  duration: DURACION.media,
  ease: SALIDA,
};

/**
 * Entrada/salida de un campo condicional: la altura se expande y el contenido
 * aparece. El fade sale antes de que colapse la altura para que no se vea
 * el contenido "aplastándose".
 */
export const variantesColapso: Variants = {
  oculto: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: DURACION.base, ease: SALIDA },
      opacity: { duration: DURACION.rapida, ease: SALIDA },
    },
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: DURACION.media, ease: SALIDA },
      opacity: { duration: DURACION.base, ease: SALIDA, delay: 0.05 },
    },
  },
};

/** Mensaje de error bajo un campo: fade corto, sin sacudidas. */
export const variantesError: Variants = {
  oculto: { opacity: 0, y: -2, transition: transicionRapida },
  visible: { opacity: 1, y: 0, transition: transicionRapida },
};

/** Cambio de contenido dentro del botón de envío (etiqueta → spinner → check). */
export const variantesEtiquetaBoton: Variants = {
  entra: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transicionRapida },
  sale: { opacity: 0, y: -6, transition: transicionRapida },
};

/** Relevo entre el formulario y la pantalla de confirmación. */
export const variantesPanel: Variants = {
  entra: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transicionMedia },
  sale: { opacity: 0, y: -6, transition: transicionRapida },
};
