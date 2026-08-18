"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { variantesListaContenedor, variantesListaItem } from "@/lib/motion";
import type { Asistente } from "./tipos";

interface Props {
  asistentes: Asistente[];
  onEliminar: (id: string) => void;
}

/**
 * Lista de asistentes ya agregados a la brigada, con opción de eliminar cada
 * uno antes de guardar. Cada fila entra animada; bajo `prefers-reduced-motion`
 * aparece y desaparece sin desplazamiento.
 */
export default function ListaAsistentes({ asistentes, onEliminar }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-etiqueta font-medium text-texto-medio">
          Asistentes agregados
        </p>
        <span
          className="rounded-chip border border-borde bg-superficie-tenue px-2 py-0.5 font-mono text-meta text-texto-tenue"
          aria-live="polite"
        >
          {asistentes.length}
        </span>
      </div>

      {asistentes.length === 0 ? (
        <p className="mt-3 text-ayuda text-texto-tenue">
          Todavía no hay asistentes agregados. Complete el formulario de
          arriba y pulse «Agregar a la lista»: se necesita al menos uno para
          poder guardar la brigada.
        </p>
      ) : (
        <motion.ul
          variants={variantesListaContenedor}
          initial="oculto"
          animate="visible"
          className="mt-3 space-y-2"
        >
          <AnimatePresence initial={false}>
            {asistentes.map((asistente) => (
              <FilaAsistente
                key={asistente.id}
                asistente={asistente}
                onEliminar={() => onEliminar(asistente.id)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

function FilaAsistente({
  asistente,
  onEliminar,
}: {
  asistente: Asistente;
  onEliminar: () => void;
}) {
  const movimientoReducido = useReducedMotion();

  const detalleAcademico =
    asistente.tipoPersona === "Estudiante"
      ? [asistente.programa, asistente.semestre && `Semestre ${asistente.semestre}`]
          .filter(Boolean)
          .join(" · ")
      : "";

  return (
    <motion.li
      layout
      variants={variantesListaItem}
      initial={movimientoReducido ? false : "oculto"}
      animate="visible"
      exit={movimientoReducido ? undefined : "oculto"}
      className="flex items-start gap-3 rounded-campo border border-borde bg-superficie px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-ayuda font-medium text-texto">
            {`${asistente.nombres} ${asistente.apellidos}`.trim()}
          </p>
          {asistente.tipoPersona && (
            <span className="inline-flex items-center rounded-chip border border-borde bg-superficie-tenue px-2 py-0.5 text-meta text-texto-medio">
              {asistente.tipoPersona}
            </span>
          )}
        </div>
        <p className="mt-0.5 font-mono text-meta text-texto-tenue">
          {[asistente.cedula, detalleAcademico].filter(Boolean).join(" · ")}
        </p>
        {asistente.motivoConsulta && (
          <p className="mt-1 truncate text-ayuda text-texto-medio">
            {asistente.motivoConsulta}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onEliminar}
        aria-label={`Eliminar a ${asistente.nombres} ${asistente.apellidos} de la lista`}
        className="shrink-0 rounded-chip p-1.5 text-texto-tenue transition-colors hover:bg-error-50 hover:text-error-700"
      >
        <IconoEquis />
      </button>
    </motion.li>
  );
}

function IconoEquis({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
