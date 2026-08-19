"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import BotonEnviar from "@/components/forms/BotonEnviar";
import CampoCasillas from "@/components/forms/CampoCasillas";
import CampoRadio from "@/components/forms/CampoRadio";
import CampoTexto from "@/components/forms/CampoTexto";
import RejillaCampos from "@/components/forms/RejillaCampos";
import SeccionFormulario from "@/components/forms/SeccionFormulario";
import { sinErrores } from "@/components/forms/utilidades";
import { ETIQUETAS_MODULO, MODULOS } from "@/lib/modulos";
import { variantesError } from "@/lib/motion";
import type { PersonaPublica } from "@/lib/personas";
import type { ErroresFormulario, EstadoEnvio } from "@/lib/types";
import { limpiarErrores, normalizarCedula, validarCedula } from "@/lib/validacion";

const OPCIONES_MODULOS = MODULOS.map((id) => ({
  valor: id as string,
  etiqueta: ETIQUETAS_MODULO[id],
}));

const MENSAJES: Record<number, string> = {
  400: "Revise los datos: hay campos incompletos o inválidos.",
  401: "Su sesión expiró. Vuelva a ingresar para continuar.",
  403: "Su usuario no tiene permiso para administrar personas.",
  404: "No se encontró esa persona.",
  409: "Ya existe una persona con ese documento.",
  429: "Se hicieron demasiados cambios seguidos. Espere un momento e intente de nuevo.",
  502: "El servicio de personas no está disponible en este momento.",
};

const MENSAJE_GENERICO = "No fue posible guardar la persona. Intente de nuevo en un momento.";

interface Props {
  /** `null` = crear una persona nueva; con valor = editar esa persona. */
  persona: PersonaPublica | null;
  documentoPropio: string;
  onGuardado: () => Promise<void> | void;
  onCancelar: () => void;
}

interface RespuestaApi {
  ok: boolean;
  mensaje?: string;
}

export default function FormularioPersona({
  persona,
  documentoPropio,
  onGuardado,
  onCancelar,
}: Props) {
  const modoEdicion = persona !== null;
  const editandoAUnoMismo = modoEdicion && persona.documento === documentoPropio;

  const [documento, setDocumento] = useState(persona?.documento ?? "");
  const [nombres, setNombres] = useState(persona?.nombres ?? "");
  const [apellidos, setApellidos] = useState(persona?.apellidos ?? "");
  const [rolEtiqueta, setRolEtiqueta] = useState(persona?.rolEtiqueta ?? "");
  const [modulos, setModulos] = useState<string[]>(persona?.modulos ?? []);
  const [clave, setClave] = useState("");
  const [activo, setActivo] = useState(persona?.activo ?? true);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [estado, setEstado] = useState<EstadoEnvio>("inactivo");
  const [mensajeError, setMensajeError] = useState("");

  const requiereClave = modulos.includes("seguimiento") || modulos.includes("admin");

  function actualizarModulos(nuevos: string[]) {
    setModulos(nuevos);
    setErrores((previos) => sinErrores(previos, "clave"));
  }

  const validar = useCallback((): ErroresFormulario => {
    return limpiarErrores({
      documento: modoEdicion ? undefined : validarCedula(documento),
      nombres: nombres.trim() ? undefined : "Ingrese los nombres.",
      apellidos: apellidos.trim() ? undefined : "Ingrese los apellidos.",
      clave:
        !modoEdicion && requiereClave && !clave.trim()
          ? "Esta persona necesita una clave para entrar a seguimiento o administración."
          : undefined,
    });
  }, [modoEdicion, documento, nombres, apellidos, requiereClave, clave]);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (estado === "enviando" || estado === "exito") return;

    const encontrados = validar();
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }
    setErrores({});
    setEstado("enviando");
    setMensajeError("");

    const ruta = modoEdicion ? `/api/admin/personas/${persona.documento}` : "/api/admin/personas";
    const cuerpo = modoEdicion
      ? {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          rol_etiqueta: rolEtiqueta.trim(),
          modulos,
          clave: clave.trim(),
          activo,
        }
      : {
          documento,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          rol_etiqueta: rolEtiqueta.trim(),
          modulos,
          clave: clave.trim(),
          activo,
        };

    try {
      const respuesta = await fetch(ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });

      if (!respuesta.ok) {
        let mensaje = MENSAJES[respuesta.status] ?? MENSAJE_GENERICO;
        try {
          const detalle = (await respuesta.json()) as RespuestaApi;
          if (detalle.mensaje) mensaje = detalle.mensaje;
        } catch {
          // Sin cuerpo legible: se conserva el mensaje genérico del estado.
        }
        throw new Error(mensaje);
      }

      setEstado("exito");
      await onGuardado();
    } catch (error) {
      setEstado("error");
      setMensajeError(error instanceof Error ? error.message : MENSAJE_GENERICO);
    }
  }

  return (
    <section className="overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta">
      <header className="border-b border-borde px-6 py-6 sm:px-8">
        <h2 className="font-display text-titulo font-semibold text-texto">
          {modoEdicion ? "Editar persona" : "Agregar persona"}
        </h2>
        {modoEdicion && (
          <p className="mt-1.5 text-cuerpo text-texto-medio">
            {persona.nombres} {persona.apellidos} · {persona.documento}
          </p>
        )}
      </header>

      <form onSubmit={enviar} noValidate className="px-6 py-7 sm:px-8">
        <div className="space-y-8">
          <SeccionFormulario titulo="Identificación">
            <RejillaCampos>
              <CampoTexto
                name="documento"
                etiqueta="Documento"
                valor={documento}
                onChange={(v) => {
                  setDocumento(normalizarCedula(v));
                  setErrores((previos) => sinErrores(previos, "documento"));
                }}
                inputMode="numeric"
                autoComplete="off"
                error={errores.documento}
                soloLectura={modoEdicion}
                ayuda={
                  modoEdicion
                    ? "Es la llave de la persona: si hay un error en el documento, desactívela y cree una nueva."
                    : "Entre 6 y 12 dígitos."
                }
                requerido={!modoEdicion}
              />
              <CampoTexto
                name="rolEtiqueta"
                etiqueta="Rol"
                valor={rolEtiqueta}
                onChange={setRolEtiqueta}
                marcador="Ej.: Enfermera jefe"
                ayuda="Texto informativo, no afecta los permisos."
              />
              <CampoTexto
                name="nombres"
                etiqueta="Nombres"
                valor={nombres}
                onChange={(v) => {
                  setNombres(v);
                  setErrores((previos) => sinErrores(previos, "nombres"));
                }}
                autoCapitalize="words"
                error={errores.nombres}
                requerido
              />
              <CampoTexto
                name="apellidos"
                etiqueta="Apellidos"
                valor={apellidos}
                onChange={(v) => {
                  setApellidos(v);
                  setErrores((previos) => sinErrores(previos, "apellidos"));
                }}
                autoCapitalize="words"
                error={errores.apellidos}
                requerido
              />
            </RejillaCampos>
          </SeccionFormulario>

          <SeccionFormulario
            titulo="Acceso"
            descripcion="Qué puede ver y hacer esta persona en el sistema."
          >
            <CampoCasillas
              name="modulos"
              etiqueta="Módulos"
              valores={modulos}
              onChange={actualizarModulos}
              opciones={OPCIONES_MODULOS}
              ayuda={
                editandoAUnoMismo
                  ? "No puedes quitarte el módulo de administración a ti mismo."
                  : "Marque los módulos a los que esta persona debe tener acceso."
              }
            />

            <CampoTexto
              name="clave"
              etiqueta="Clave"
              tipo="password"
              valor={clave}
              onChange={(v) => {
                setClave(v);
                setErrores((previos) => sinErrores(previos, "clave"));
              }}
              autoComplete="new-password"
              error={errores.clave}
              ayuda={
                modoEdicion
                  ? "Deje en blanco para conservar la clave actual. Escriba una nueva solo si desea cambiarla."
                  : requiereClave
                    ? "Obligatoria: esta persona tendrá acceso a seguimiento o administración."
                    : "Opcional: sólo si esta persona necesita ingresar con clave."
              }
              requerido={!modoEdicion && requiereClave}
            />

            <CampoRadio
              name="activo"
              etiqueta="Estado"
              valor={activo ? "Sí" : "No"}
              onChange={(v) => setActivo(v === "Sí")}
              opciones={["Sí", "No"]}
              deshabilitado={editandoAUnoMismo}
              ayuda={editandoAUnoMismo ? "No puedes desactivarte a ti mismo." : undefined}
            />
          </SeccionFormulario>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-borde pt-6">
          <AnimatePresence initial={false}>
            {estado === "error" && mensajeError && (
              <motion.p
                key="error-guardar"
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

          <button type="button" onClick={onCancelar} className="boton-secundario">
            Cancelar
          </button>
          <BotonEnviar
            estado={estado}
            etiqueta={modoEdicion ? "Guardar cambios" : "Crear persona"}
            etiquetaEnviando="Guardando…"
            etiquetaExito="Guardado"
          />
        </div>
      </form>
    </section>
  );
}
