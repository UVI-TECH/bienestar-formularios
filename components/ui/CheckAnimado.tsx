"use client";

import { motion, useReducedMotion } from "motion/react";
import { SALIDA } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Visto que se dibuja una sola vez al confirmar el registro: primero cierra
 * el círculo, luego traza el trazo. Es el único momento del sistema con
 * movimiento propiamente expresivo, y dura menos de medio segundo.
 */
export default function CheckAnimado({ className }: { className?: string }) {
  const movimientoReducido = useReducedMotion();
  const dibujado = { pathLength: 1, opacity: 1 };

  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={cn("h-12 w-12 text-exito-600", className)}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.45"
        initial={movimientoReducido ? dibujado : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.45 }}
        transition={{ duration: 0.4, ease: SALIDA }}
      />
      <motion.path
        d="M15 24.5 21.5 31 33 18.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={movimientoReducido ? dibujado : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease: SALIDA, delay: 0.18 }}
      />
    </svg>
  );
}
