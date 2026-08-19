"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import BotonEnviar from "@/components/forms/BotonEnviar";
import CampoCondicional from "@/components/forms/CampoCondicional";
import CampoTexto from "@/components/forms/CampoTexto";
import { variantesError } from "@/lib/motion";
import type { EstadoEnvio } from "@/lib/types";
import { normalizarCedula, validarCedula } from "@/lib/validacion";

/** Pausa entre el visto del botón y la redirección al índice. */
const ESPERA_REDIRECCION_MS = 450;

const MENSAJE_GENERICO =
  "No fue posible ingresar. Verifique los datos e intente de nuevo.";

const MENSAJES: Record<number, string> = {
  401: "Documento o clave incorrectos, o el usuario está inactivo.",
  429: "Se hicieron demasiados intentos seguidos. Espere un momento e intente de nuevo.",
  502: "El servicio de personas no está disponible en este momento.",
};

const MENSAJE_RED =
  "No hay conexión con el servidor. Verifique la red e intente de nuevo.";

interface RespuestaLogin {
  autenticado: boolean;
  requiereClave?: boolean;
}

export default function FormularioIngreso() {
  const router = useRouter();
  const movimientoReducido = useReducedMotion();

  const [documento, setDocumento] = useState("");
  const [clave, setClave] = useState("");
  const [pideClave, setPideClave] = useState(false);
  const [errorDocumento, setErrorDocumento] = useState("");
  const [errorClave, setErrorClave] = useState("");
  const [estado, setEstado] = useState<EstadoEnvio>("inactivo");
  const [mensajeError, setMensajeError] = useState("");

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const enviar = useCallback(
    async (evento: React.FormEvent<HTMLFormElement>) => {
      evento.preventDefault();
      if (estado === "enviando" || estado === "exito") return;

      const errorDoc = validarCedula(documento);
      if (errorDoc) {
        setErrorDocumento(errorDoc);
        return;
      }
      setErrorDocumento("");

      if (pideClave && !clave) {
        setErrorClave("Ingrese la clave.");
        return;
      }
      setErrorClave("");

      setEstado("enviando");
      setMensajeError("");

      let respuesta: Response;
      try {
        respuesta = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            pideClave ? { documento, clave } : { documento },
          ),
        });
      } catch {
        setEstado("error");
        setMensajeError(MENSAJE_RED);
        return;
      }

      let cuerpo: RespuestaLogin;
      try {
        cuerpo = (await respuesta.json()) as RespuestaLogin;
      } catch {
        cuerpo = { autenticado: false };
      }

      if (cuerpo.autenticado) {
        setEstado("exito");
        temporizador.current = setTimeout(
          () => {
            router.push("/");
            router.refresh();
          },
          movimientoReducido ? 0 : ESPERA_REDIRECCION_MS,
        );
        return;
      }

      if (cuerpo.requiereClave) {
        setPideClave(true);
        setEstado("inactivo");
        return;
      }

      setEstado("error");
      setMensajeError(MENSAJES[respuesta.status] ?? MENSAJE_GENERICO);
    },
    [documento, clave, pideClave, estado, router, movimientoReducido],
  );

  function cambiarDocumento() {
    setPideClave(false);
    setClave("");
    setErrorClave("");
    setEstado("inactivo");
    setMensajeError("");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-6 py-16 sm:py-24">
      <div className="rounded-tarjeta border border-borde bg-superficie p-8 shadow-tarjeta">
        <p className="font-mono text-meta uppercase text-texto-tenue">
          Ingreso
        </p>
        <h1 className="mt-2 font-display text-titulo font-semibold text-texto">
          Bienestar Universitario
        </h1>
        <p className="mt-1.5 text-cuerpo text-texto-medio">
          Ingrese su número de documento para continuar.
        </p>

        <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
          <CampoTexto
            name="documento"
            etiqueta="Documento de identidad"
            valor={documento}
            onChange={(v) => {
              setDocumento(normalizarCedula(v));
              setErrorDocumento("");
            }}
            inputMode="numeric"
            autoComplete="off"
            error={errorDocumento}
            deshabilitado={pideClave}
            requerido
          />

          <CampoCondicional visible={pideClave}>
            <CampoTexto
              name="clave"
              etiqueta="Clave"
              tipo="password"
              valor={clave}
              onChange={(v) => {
                setClave(v);
                setErrorClave("");
              }}
              autoComplete="current-password"
              error={errorClave}
              requerido
            />
          </CampoCondicional>

          <div className="franja-mensaje">
            <AnimatePresence initial={false}>
              {estado === "error" && mensajeError && (
                <motion.p
                  key="error-ingreso"
                  role="alert"
                  variants={variantesError}
                  initial="oculto"
                  animate="visible"
                  exit="oculto"
                  className="text-ayuda text-error-700"
                >
                  {mensajeError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-4">
            {pideClave ? (
              <button
                type="button"
                onClick={cambiarDocumento}
                className="rounded-chip text-ayuda text-texto-tenue underline underline-offset-2 transition-colors hover:text-texto-medio"
              >
                Cambiar documento
              </button>
            ) : (
              <span />
            )}

            <BotonEnviar
              estado={estado}
              etiqueta={pideClave ? "Ingresar" : "Continuar"}
              etiquetaEnviando="Verificando…"
              etiquetaExito="Ingresó"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
