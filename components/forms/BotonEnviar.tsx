"use client";

import { AnimatePresence, motion } from "motion/react";
import Girador from "@/components/ui/Girador";
import IconoCheck from "@/components/ui/IconoCheck";
import { cn } from "@/lib/cn";
import { variantesEtiquetaBoton } from "@/lib/motion";
import type { EstadoEnvio } from "@/lib/types";

interface Props {
  estado: EstadoEnvio;
  etiqueta?: string;
  etiquetaEnviando?: string;
  etiquetaExito?: string;
  deshabilitado?: boolean;
}

/**
 * Botón de envío con estados: reposo → enviando → éxito.
 *
 * Los tres contenidos comparten una misma celda de rejilla y se funden entre
 * sí, con un texto invisible que fija el ancho: el botón nunca cambia de
 * tamaño ni desplaza la barra de acciones.
 */
export default function BotonEnviar({
  estado,
  etiqueta = "Guardar registro",
  etiquetaEnviando = "Registrando…",
  etiquetaExito = "Registrado",
  deshabilitado,
}: Props) {
  const enviando = estado === "enviando";
  const exito = estado === "exito";

  const contenido = enviando
    ? { clave: "enviando", icono: <Girador />, texto: etiquetaEnviando }
    : exito
      ? { clave: "exito", icono: <IconoCheck />, texto: etiquetaExito }
      : { clave: "reposo", icono: null, texto: etiqueta };

  const textoMasLargo = [etiqueta, etiquetaEnviando, etiquetaExito].reduce(
    (a, b) => (b.length > a.length ? b : a),
  );

  return (
    <button
      type="submit"
      disabled={deshabilitado || enviando || exito}
      // El nombre accesible se declara aparte: el texto visible está animado y
      // conviene que el lector de pantalla anuncie el cambio de estado.
      aria-label={contenido.texto}
      aria-live="polite"
      className={cn(
        "boton-primario",
        // Deshabilitado por estar ocupado, no por falta de permiso: el botón
        // conserva su color institucional y vira a verde al confirmar.
        enviando && "bg-inst-700 text-white",
        exito && "bg-exito-600 text-white",
      )}
    >
      <span className="grid items-center">
        <span
          aria-hidden
          className="invisible col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap"
        >
          <Girador />
          {textoMasLargo}
        </span>

        <AnimatePresence initial={false}>
          <motion.span
            key={contenido.clave}
            variants={variantesEtiquetaBoton}
            initial="entra"
            animate="visible"
            exit="sale"
            className="col-start-1 row-start-1 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {contenido.icono}
            {contenido.texto}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
