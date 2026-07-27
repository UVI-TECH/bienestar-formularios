"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CheckAnimado from "@/components/ui/CheckAnimado";
import CodigoFormato from "@/components/ui/CodigoFormato";
import { variantesError, variantesPanel } from "@/lib/motion";
import type { ErroresFormulario, EstadoEnvio, Formato } from "@/lib/types";
import BotonEnviar from "./BotonEnviar";

/** Pausa entre el visto del botón y la pantalla de confirmación. */
const ESPERA_CONFIRMACION_MS = 450;

const MENSAJE_ERROR_GENERICO =
  "No fue posible guardar el registro. Verifique los datos e intente de nuevo.";

interface Props {
  formato: Formato;
  /**
   * Revisa el formulario antes de enviarlo. Devuelve los errores por campo
   * (vacío si todo está bien); si hay alguno no se envía nada y el foco salta
   * al primer campo marcado. Se ejecuta antes de mostrar el estado "enviando",
   * para que un formulario incompleto no simule que se está guardando.
   */
  validar?: () => ErroresFormulario;
  /**
   * Envía el registro. Debe lanzar un `Error` si falla; su mensaje se muestra
   * en la barra de acciones.
   */
  onEnviar: () => Promise<void>;
  /** Limpia el estado del formulario al pulsar "Registrar otro". */
  onReiniciar?: () => void;
  children: ReactNode;
  /** Datos del registro guardado que conviene mostrar en la confirmación. */
  resumenExito?: ReactNode;
  mensajeExito?: string;
  etiquetaEnviar?: string;
}

/**
 * Envoltura de todos los formularios del área de salud: encabezado con el
 * código del formato, cuerpo, barra de acciones con el botón de envío y
 * pantalla de confirmación.
 *
 * El estado del envío vive aquí; cada formulario sólo aporta sus campos y la
 * función que persiste los datos.
 */
export default function FormularioBase({
  formato,
  validar,
  onEnviar,
  onReiniciar,
  children,
  resumenExito,
  mensajeExito = "El registro quedó guardado correctamente.",
  etiquetaEnviar,
}: Props) {
  const [estado, setEstado] = useState<EstadoEnvio>("inactivo");
  const [mensajeError, setMensajeError] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  const formularioRef = useRef<HTMLFormElement>(null);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movimientoReducido = useReducedMotion();

  useEffect(() => {
    return () => {
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    };
  }, []);

  const manejarEnvio = useCallback(
    async (evento: React.FormEvent<HTMLFormElement>) => {
      evento.preventDefault();
      if (estado === "enviando" || estado === "exito") return;

      if (validar) {
        const errores = validar();
        if (Object.keys(errores).length > 0) {
          setEstado("error");
          setMensajeError(
            "Revise los campos marcados: faltan datos obligatorios.",
          );
          // El foco salta al primer campo con error, que puede estar fuera de
          // la pantalla en un formulario largo.
          requestAnimationFrame(() => {
            formularioRef.current
              ?.querySelector<HTMLElement>('[aria-invalid="true"]')
              ?.focus();
          });
          return;
        }
      }

      setEstado("enviando");
      setMensajeError("");

      try {
        await onEnviar();
        setEstado("exito");
        // El visto alcanza a leerse en el botón antes de que el panel lo releve.
        temporizadorRef.current = setTimeout(
          () => setConfirmado(true),
          movimientoReducido ? 0 : ESPERA_CONFIRMACION_MS,
        );
      } catch (error) {
        setMensajeError(
          error instanceof Error && error.message
            ? error.message
            : MENSAJE_ERROR_GENERICO,
        );
        setEstado("error");
      }
    },
    [estado, validar, onEnviar, movimientoReducido],
  );

  function registrarOtro() {
    setConfirmado(false);
    setEstado("inactivo");
    setMensajeError("");
    onReiniciar?.();
    // El foco vuelve al primer campo: se sigue registrando sin tocar el mouse.
    requestAnimationFrame(() => {
      formularioRef.current
        ?.querySelector<HTMLElement>("input, select, textarea")
        ?.focus();
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 rounded-chip text-ayuda text-texto-medio transition-colors hover:text-inst-700"
      >
        <span aria-hidden>←</span>
        Volver al índice
      </Link>

      <section className="overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta">
        <header className="border-b border-borde px-6 py-6 sm:px-8">
          <CodigoFormato formato={formato} />
          <h1 className="mt-3 font-serif text-titulo font-semibold text-texto">
            {formato.titulo}
          </h1>
          {formato.descripcion && (
            <p className="mt-1.5 max-w-prose text-cuerpo text-texto-medio">
              {formato.descripcion}
            </p>
          )}
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {confirmado ? (
            <motion.div
              key="confirmacion"
              variants={variantesPanel}
              initial="entra"
              animate="visible"
              exit="sale"
            >
              <PanelConfirmacion
                mensaje={mensajeExito}
                resumen={resumenExito}
                onRegistrarOtro={registrarOtro}
              />
            </motion.div>
          ) : (
            <motion.form
              key="formulario"
              ref={formularioRef}
              onSubmit={manejarEnvio}
              onInput={() => {
                // En cuanto se empieza a corregir, el aviso de la barra deja
                // de ser cierto. Los errores por campo los limpia cada campo.
                if (estado === "error") {
                  setEstado("inactivo");
                  setMensajeError("");
                }
              }}
              noValidate
              variants={variantesPanel}
              initial="entra"
              animate="visible"
              exit="sale"
            >
              <div className="space-y-8 px-6 py-7 sm:px-8">{children}</div>

              <div className="flex flex-wrap items-center justify-end gap-4 border-t border-borde bg-superficie-tenue px-6 py-5 sm:px-8">
                <AnimatePresence initial={false}>
                  {estado === "error" && mensajeError && (
                    <motion.p
                      key="error-envio"
                      role="alert"
                      variants={variantesError}
                      initial="oculto"
                      animate="visible"
                      exit="oculto"
                      className="mr-auto max-w-md text-ayuda text-error-700"
                    >
                      {mensajeError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <BotonEnviar estado={estado} etiqueta={etiquetaEnviar} />
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function PanelConfirmacion({
  mensaje,
  resumen,
  onRegistrarOtro,
}: {
  mensaje: string;
  resumen?: ReactNode;
  onRegistrarOtro: () => void;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center px-6 py-14 text-center sm:px-8"
    >
      <CheckAnimado />

      <h2 className="mt-5 font-serif text-titulo font-semibold text-texto">
        Registro guardado
      </h2>
      <p className="mt-1.5 max-w-md text-cuerpo text-texto-medio">{mensaje}</p>

      {resumen && (
        <div className="mt-6 w-full max-w-md rounded-campo border border-borde bg-superficie-tenue px-5 py-4 text-left">
          {resumen}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRegistrarOtro}
          className="boton-primario"
        >
          Registrar otro
        </button>
        <Link href="/" className="boton-secundario">
          Volver al índice
        </Link>
      </div>
    </div>
  );
}
