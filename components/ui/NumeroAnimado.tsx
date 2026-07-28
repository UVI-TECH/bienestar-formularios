"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { DURACION, SALIDA } from "@/lib/motion";

interface Props {
  valor: number;
  decimales?: number;
  className?: string;
}

/**
 * Cifra que recorre el camino entre el valor anterior y el nuevo en lugar de
 * saltar. Se usa para el IMC, que cambia mientras se escriben peso y talla:
 * el recorrido deja ver que la cifra respondió a lo que se acaba de teclear.
 *
 * Bajo `prefers-reduced-motion` el valor se fija de una vez.
 */
export default function NumeroAnimado({
  valor,
  decimales = 1,
  className,
}: Props) {
  const movimientoReducido = useReducedMotion();
  const interno = useMotionValue(valor);
  const texto = useTransform(interno, (actual) => actual.toFixed(decimales));

  useEffect(() => {
    if (movimientoReducido) {
      interno.set(valor);
      return;
    }
    const control = animate(interno, valor, {
      duration: DURACION.media,
      ease: SALIDA,
    });
    return () => control.stop();
  }, [valor, interno, movimientoReducido]);

  return (
    <motion.span className={className} aria-hidden>
      {texto}
    </motion.span>
  );
}
