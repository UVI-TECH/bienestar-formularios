"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { variantesColapso } from "@/lib/motion";

interface Props {
  /** Condición que decide si el bloque debe estar presente. */
  visible: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Muestra u oculta campos dependientes con expansión de altura y fade.
 *
 * `overflow-hidden` durante la transición evita que el contenido se desborde,
 * y la altura anima hacia `auto`, de modo que lo que viene debajo se desplaza
 * de forma continua en vez de saltar. No anima en el primer render.
 */
export default function CampoCondicional({ visible, children, className }: Props) {
  const movimientoReducido = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="condicional"
          variants={variantesColapso}
          initial={movimientoReducido ? false : "oculto"}
          animate="visible"
          exit={movimientoReducido ? undefined : "oculto"}
          className="mt-0! overflow-hidden"
        >
          {/* La separación superior vive dentro del bloque animado: así crece y
              se cierra con él, en vez de dejar un hueco al desmontarse. */}
          <div className={cn("pt-3", className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
