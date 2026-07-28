"use client";

import { AnimatePresence, motion } from "motion/react";
import IconoCheck from "@/components/ui/IconoCheck";
import { variantesError } from "@/lib/motion";
import type { EstadoConsulta } from "./useConsultaCedula";

interface Props {
  estado: EstadoConsulta;
  mensaje: string;
  onEditarManualmente: () => void;
}

/**
 * Franja con el resultado de la consulta por documento. Entra con el mismo
 * fade corto que los errores de campo: informa sin robarle la atención a quien
 * está registrando.
 */
export default function AvisoConsulta({
  estado,
  mensaje,
  onEditarManualmente,
}: Props) {
  const visible = estado === "encontrado" || Boolean(mensaje);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key={estado}
          role="status"
          variants={variantesError}
          initial="oculto"
          animate="visible"
          exit="oculto"
          className={
            estado === "encontrado"
              ? "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-campo border border-exito-200 bg-exito-50 px-4 py-3"
              : "rounded-campo border border-aviso-200 bg-aviso-50 px-4 py-3"
          }
        >
          {estado === "encontrado" ? (
            <>
              <span className="flex items-center gap-2 text-ayuda text-exito-700">
                <IconoCheck />
                Datos traídos de Smart Campus. Los campos quedan bloqueados.
              </span>
              <button
                type="button"
                onClick={onEditarManualmente}
                className="rounded-chip text-ayuda font-medium text-inst-700 underline underline-offset-2 transition-colors hover:text-inst-800"
              >
                Editar manualmente
              </button>
            </>
          ) : (
            <span className="text-ayuda text-aviso-700">{mensaje}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
