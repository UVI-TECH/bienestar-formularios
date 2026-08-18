"use client";

import { useRef, useState } from "react";
import CampoTexto from "@/components/forms/CampoTexto";
import RejillaCampos from "@/components/forms/RejillaCampos";
import { sinErrores } from "@/components/forms/utilidades";
import type { ErroresFormulario } from "@/lib/types";
import {
  limpiarErrores,
  normalizarCedula,
  validarCedula,
  validarCorreo,
} from "@/lib/validacion";
import type { Asistente } from "./tipos";

interface Props {
  onAgregar: (asistente: Asistente) => void;
}

const ASISTENTE_VACIO = {
  nombresApellidos: "",
  documento: "",
  cargo: "",
  dependencia: "",
  correo: "",
};

function crearId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Sub-formulario para sumar un asistente a la actividad. No envía nada por sí
 * mismo: valida, entrega el asistente a `onAgregar` y se limpia para el
 * siguiente. A diferencia del de brigadas, aquí no hay consulta a Smart
 * Campus ni asistente de IA: son campos de texto simples que se escriben
 * directo.
 */
export default function SubformularioAsistente({ onAgregar }: Props) {
  const [datos, setDatos] = useState(ASISTENTE_VACIO);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const contenedorRef = useRef<HTMLDivElement>(null);

  function actualizar<C extends keyof typeof ASISTENTE_VACIO>(
    campo: C,
    valor: string,
  ) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previos) => sinErrores(previos, campo));
  }

  function validar(): ErroresFormulario {
    const encontrados = limpiarErrores({
      nombresApellidos: datos.nombresApellidos.trim()
        ? undefined
        : "Ingrese los nombres y apellidos.",
      documento: validarCedula(datos.documento),
      correo: validarCorreo(datos.correo),
    });
    setErrores(encontrados);
    return encontrados;
  }

  function agregar() {
    const encontrados = validar();
    if (Object.keys(encontrados).length > 0) {
      requestAnimationFrame(() => {
        contenedorRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    onAgregar({
      id: crearId(),
      nombresApellidos: datos.nombresApellidos.trim(),
      documento: datos.documento,
      cargo: datos.cargo.trim(),
      dependencia: datos.dependencia.trim(),
      correo: datos.correo.trim(),
    });

    setDatos(ASISTENTE_VACIO);
    setErrores({});
  }

  return (
    <div
      ref={contenedorRef}
      className="space-y-4 rounded-tarjeta border border-borde bg-superficie-tenue p-5"
      onKeyDown={(evento) => {
        // Enter en un campo no debe enviar TODA la actividad: sólo "Agregar a
        // la lista" hace eso.
        const objetivo = evento.target as HTMLElement;
        if (
          evento.key === "Enter" &&
          (objetivo.tagName === "INPUT" || objetivo.tagName === "SELECT")
        ) {
          evento.preventDefault();
        }
      }}
    >
      <RejillaCampos>
        <CampoTexto
          name="nombresApellidos"
          etiqueta="Nombres y apellidos"
          valor={datos.nombresApellidos}
          onChange={(v) => actualizar("nombresApellidos", v)}
          autoCapitalize="words"
          maxLength={160}
          error={errores.nombresApellidos}
          className="sm:col-span-2"
          requerido
        />
        <CampoTexto
          name="documento"
          etiqueta="Documento"
          valor={datos.documento}
          onChange={(v) => actualizar("documento", normalizarCedula(v))}
          inputMode="numeric"
          ayuda="Entre 6 y 12 dígitos."
          error={errores.documento}
          requerido
        />
        <CampoTexto
          name="cargo"
          etiqueta="Cargo"
          valor={datos.cargo}
          onChange={(v) => actualizar("cargo", v)}
          maxLength={120}
        />
        <CampoTexto
          name="dependencia"
          etiqueta="Dependencia"
          valor={datos.dependencia}
          onChange={(v) => actualizar("dependencia", v)}
          maxLength={120}
        />
        <CampoTexto
          name="correo"
          etiqueta="Correo"
          tipo="email"
          valor={datos.correo}
          onChange={(v) => actualizar("correo", v)}
          autoComplete="off"
          maxLength={160}
          ayuda="Opcional."
          error={errores.correo}
        />
      </RejillaCampos>

      <div className="flex justify-end">
        <button type="button" onClick={agregar} className="boton-primario">
          Agregar a la lista
        </button>
      </div>
    </div>
  );
}
