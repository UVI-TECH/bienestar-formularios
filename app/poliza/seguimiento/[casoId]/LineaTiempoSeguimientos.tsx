"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import CampoFecha from "@/components/forms/CampoFecha";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoTexto from "@/components/forms/CampoTexto";
import CampoTextareaConIA from "@/components/forms/CampoTextareaConIA";
import RejillaCampos from "@/components/forms/RejillaCampos";
import { sinErrores } from "@/components/forms/utilidades";
import Girador from "@/components/ui/Girador";
import InsigniaEstado from "@/components/ui/InsigniaEstado";
import { TIPOS_SEGUIMIENTO } from "@/lib/catalogos";
import { cn } from "@/lib/cn";
import { fechaHoy, fechaLegible } from "@/lib/fechas";
import { variantesListaContenedor, variantesListaItem } from "@/lib/motion";
import type { Seguimiento } from "@/lib/casos";
import type { ErroresFormulario } from "@/lib/types";
import { limpiarErrores } from "@/lib/validacion";

interface Props {
  casoId: string;
  estadoInicial: string;
  seguimientosIniciales: Seguimiento[];
  registradoPor: string;
}

interface DatosSeguimiento {
  fecha: string;
  tipo: string;
  descripcion: string;
  proximaAccion: string;
  fechaProximaAccion: string;
}

const DATOS_VACIOS: DatosSeguimiento = {
  fecha: "",
  tipo: "",
  descripcion: "",
  proximaAccion: "",
  fechaProximaAccion: "",
};

const MENSAJES_ENVIO: Record<number, string> = {
  400: "El seguimiento llegó incompleto al servidor. Revise los datos e intente de nuevo.",
  401: "Su sesión expiró. Vuelva a ingresar para continuar.",
  403: "Su usuario no tiene permiso para registrar seguimientos.",
  502: "No fue posible guardar el seguimiento. Intente de nuevo en un momento.",
};

const MENSAJE_GENERICO =
  "No fue posible guardar el seguimiento. Intente de nuevo en un momento.";

export default function LineaTiempoSeguimientos({
  casoId,
  estadoInicial,
  seguimientosIniciales,
  registradoPor,
}: Props) {
  const router = useRouter();

  const [seguimientos, setSeguimientos] = useState(seguimientosIniciales);
  const [estado, setEstado] = useState(estadoInicial);
  const [datos, setDatos] = useState<DatosSeguimiento>(DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeErrorSeguimiento, setMensajeErrorSeguimiento] = useState("");

  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [mensajeErrorCierre, setMensajeErrorCierre] = useState("");

  const abierto = estado === "En seguimiento";
  const siguienteNumero =
    seguimientos.reduce((maximo, s) => Math.max(maximo, s.numeroSeguimiento), 0) + 1;

  function actualizar<C extends keyof DatosSeguimiento>(campo: C, valor: string) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previos) => sinErrores(previos, campo));
  }

  async function enviarSeguimiento(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    const encontrados = limpiarErrores({
      fecha: datos.fecha ? undefined : "Indique la fecha del seguimiento.",
      tipo: datos.tipo ? undefined : "Seleccione el tipo de seguimiento.",
      descripcion: datos.descripcion.trim()
        ? undefined
        : "Describa el seguimiento realizado.",
    });

    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    setEnviando(true);
    setMensajeErrorSeguimiento("");

    try {
      const respuesta = await fetch("/api/poliza/seguimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caso_id: casoId,
          numero_seguimiento: siguienteNumero,
          fecha: datos.fecha,
          tipo: datos.tipo,
          descripcion: datos.descripcion,
          proxima_accion: datos.proximaAccion,
          fecha_proxima_accion: datos.fechaProximaAccion,
        }),
      });

      if (!respuesta.ok) {
        throw new Error(MENSAJES_ENVIO[respuesta.status] ?? MENSAJE_GENERICO);
      }

      // El nuevo seguimiento se agrega en el cliente: ya se conocen todos sus
      // campos (incluido `registradoPor`, que es la persona en sesión), así
      // que no hace falta releer la lista completa para que aparezca animado.
      setSeguimientos((previos) => [
        {
          seguimientoId: `${casoId}-${siguienteNumero}`,
          casoId,
          numeroSeguimiento: siguienteNumero,
          fecha: datos.fecha,
          tipo: datos.tipo,
          descripcion: datos.descripcion.trim(),
          proximaAccion: datos.proximaAccion.trim(),
          fechaProximaAccion: datos.fechaProximaAccion,
          registradoPor,
        },
        ...previos,
      ]);
      setDatos({ ...DATOS_VACIOS, fecha: fechaHoy() });
      setErrores({});
    } catch (error) {
      setMensajeErrorSeguimiento(
        error instanceof Error ? error.message : MENSAJE_GENERICO,
      );
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCierre() {
    if (cerrando) return;
    setCerrando(true);
    setMensajeErrorCierre("");

    try {
      const respuesta = await fetch(`/api/poliza/casos/${casoId}/cerrar`, {
        method: "POST",
      });
      if (!respuesta.ok) {
        throw new Error(MENSAJES_ENVIO[respuesta.status] ?? MENSAJE_GENERICO);
      }
      setEstado("Cerrado");
      setConfirmandoCierre(false);
      router.refresh();
    } catch (error) {
      setMensajeErrorCierre(
        error instanceof Error ? error.message : "No fue posible cerrar el caso.",
      );
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-subtitulo font-semibold text-texto">
            Seguimientos
          </h2>

          {abierto ? (
            <AnimatePresence mode="wait" initial={false}>
              {confirmandoCierre ? (
                <motion.div
                  key="confirmar"
                  variants={variantesListaItem}
                  initial="oculto"
                  animate="visible"
                  exit="oculto"
                  className="flex flex-wrap items-center justify-end gap-2"
                >
                  {mensajeErrorCierre && (
                    <span role="alert" className="mr-2 text-ayuda text-error-700">
                      {mensajeErrorCierre}
                    </span>
                  )}
                  <span className="text-ayuda text-texto-medio">¿Cerrar este caso?</span>
                  <button
                    type="button"
                    onClick={confirmarCierre}
                    disabled={cerrando}
                    className="boton-primario px-4"
                  >
                    {cerrando && <Girador />}
                    Sí, cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmandoCierre(false);
                      setMensajeErrorCierre("");
                    }}
                    disabled={cerrando}
                    className="boton-secundario px-4"
                  >
                    Cancelar
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="abrir"
                  type="button"
                  variants={variantesListaItem}
                  initial="oculto"
                  animate="visible"
                  exit="oculto"
                  onClick={() => setConfirmandoCierre(true)}
                  className="boton-secundario px-4"
                >
                  Cerrar caso
                </motion.button>
              )}
            </AnimatePresence>
          ) : (
            <InsigniaEstado estado={estado} />
          )}
        </div>

        {seguimientos.length === 0 ? (
          <p className="mt-5 text-ayuda text-texto-tenue">
            Todavía no hay seguimientos registrados.
          </p>
        ) : (
          <motion.ol
            variants={variantesListaContenedor}
            initial="oculto"
            animate="visible"
            className="mt-5"
          >
            <AnimatePresence initial={false}>
              {seguimientos.map((seguimiento) => (
                <motion.li
                  key={seguimiento.seguimientoId}
                  layout
                  variants={variantesListaItem}
                  initial="oculto"
                  animate="visible"
                  exit="oculto"
                  className="relative border-l-2 border-borde py-0.5 pb-6 pl-6 last:border-transparent last:pb-0"
                >
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[7px] h-3 w-3 rounded-full border-2 border-inst-600 bg-superficie"
                  />
                  <p className="text-ayuda text-texto-tenue">
                    {fechaLegible(seguimiento.fecha)} · {seguimiento.tipo}
                  </p>
                  <p className="mt-1 text-cuerpo whitespace-pre-wrap text-texto">
                    {seguimiento.descripcion}
                  </p>
                  {seguimiento.proximaAccion && (
                    <p className="mt-1 text-ayuda text-inst-700">
                      Próxima acción: {seguimiento.proximaAccion}
                      {seguimiento.fechaProximaAccion &&
                        ` · ${fechaLegible(seguimiento.fechaProximaAccion)}`}
                    </p>
                  )}
                  <p className="mt-1 text-meta uppercase text-texto-tenue">
                    Registró: {seguimiento.registradoPor || "—"}
                  </p>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ol>
        )}
      </section>

      {abierto && (
        <section className="rounded-tarjeta border border-borde bg-superficie p-6 shadow-tarjeta sm:p-8">
          <h2 className="font-serif text-subtitulo font-semibold text-texto">
            Agregar seguimiento
          </h2>

          <form onSubmit={enviarSeguimiento} noValidate className="mt-5 space-y-4">
            <RejillaCampos>
              <CampoFecha
                name="fecha"
                etiqueta="Fecha"
                valor={datos.fecha}
                onChange={(v) => actualizar("fecha", v)}
                error={errores.fecha}
                requerido
              />
              <CampoSelect
                name="tipo"
                etiqueta="Tipo de seguimiento"
                valor={datos.tipo}
                onChange={(v) => actualizar("tipo", v)}
                opciones={TIPOS_SEGUIMIENTO}
                error={errores.tipo}
                requerido
              />
            </RejillaCampos>

            <CampoTextareaConIA
              name="descripcion"
              etiqueta="Descripción"
              valor={datos.descripcion}
              onChange={(v) => actualizar("descripcion", v)}
              filas={4}
              maxLength={1500}
              error={errores.descripcion}
              requerido
            />

            <RejillaCampos>
              <CampoTexto
                name="proximaAccion"
                etiqueta="Próxima acción"
                valor={datos.proximaAccion}
                onChange={(v) => actualizar("proximaAccion", v)}
                marcador="Ej.: control con ortopedia"
                maxLength={200}
                ayuda="Opcional."
              />
              <CampoFecha
                name="fechaProximaAccion"
                etiqueta="Fecha de la próxima acción"
                valor={datos.fechaProximaAccion}
                onChange={(v) => actualizar("fechaProximaAccion", v)}
                porDefectoHoy={false}
                ayuda="Opcional."
              />
            </RejillaCampos>

            <div className="flex flex-wrap items-center justify-end gap-4 pt-1">
              {mensajeErrorSeguimiento && (
                <p role="alert" className="mr-auto max-w-md text-ayuda text-error-700">
                  {mensajeErrorSeguimiento}
                </p>
              )}
              <button
                type="submit"
                disabled={enviando}
                className={cn("boton-primario", enviando && "bg-inst-700 text-white")}
              >
                {enviando && <Girador />}
                {enviando ? "Guardando…" : "Agregar seguimiento"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
