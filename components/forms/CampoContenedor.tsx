"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { variantesError } from "@/lib/motion";
import type { PropsCampoBase } from "@/lib/types";

interface Props extends Omit<PropsCampoBase, "deshabilitado"> {
  children: ReactNode;
  /** Si el control no es un elemento etiquetable (p. ej. un grupo), usar `false`. */
  asociarEtiqueta?: boolean;
}

/**
 * Andamiaje común a todos los campos: etiqueta siempre visible, control y
 * franja de mensaje. La ayuda es estática; sólo el error se anima, con un
 * fade corto, para que el ojo lo note sin que la página salte.
 */
export default function CampoContenedor({
  name,
  etiqueta,
  requerido,
  ayuda,
  error,
  className,
  children,
  asociarEtiqueta = true,
}: Props) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={asociarEtiqueta ? name : undefined}
        className="text-etiqueta font-medium text-texto-medio"
      >
        {etiqueta}
        {requerido && (
          <span className="ml-1 text-error-600" title="Campo obligatorio">
            *
          </span>
        )}
      </label>

      {children}

      <div className="franja-mensaje">
        <AnimatePresence initial={false}>
          {error ? (
            <motion.p
              key="error"
              id={`${name}-error`}
              role="alert"
              variants={variantesError}
              initial="oculto"
              animate="visible"
              exit="oculto"
              className="text-ayuda text-error-600"
            >
              {error}
            </motion.p>
          ) : (
            ayuda && (
              <p
                key="ayuda"
                id={`${name}-ayuda`}
                className="text-ayuda text-texto-tenue"
              >
                {ayuda}
              </p>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Atributos de accesibilidad para el control interno de un campo.
 * Devuelve `aria-invalid` y `aria-describedby` coherentes con el mensaje
 * que `CampoContenedor` esté mostrando.
 */
export function atributosControl(
  name: string,
  error?: string,
  ayuda?: string,
): {
  id: string;
  name: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
} {
  const descripcion = error
    ? `${name}-error`
    : ayuda
      ? `${name}-ayuda`
      : undefined;

  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": descripcion,
  };
}
