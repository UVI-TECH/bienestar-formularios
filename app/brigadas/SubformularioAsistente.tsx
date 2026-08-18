"use client";

import { useRef, useState } from "react";
import BloqueIdentificacion from "@/components/forms/BloqueIdentificacion";
import CampoTextareaConIA from "@/components/forms/CampoTextareaConIA";
import { sinErrores } from "@/components/forms/utilidades";
import { esEstudiante, IDENTIFICACION_VACIA, type DatosIdentificacion } from "@/lib/identificacion";
import type { ErroresFormulario } from "@/lib/types";
import { limpiarErrores, validarCedula } from "@/lib/validacion";
import type { Asistente } from "./tipos";

interface Props {
  onAgregar: (asistente: Asistente) => void;
}

function crearId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Sub-formulario para sumar un asistente a la brigada. No envía nada por sí
 * mismo: valida, entrega el asistente a `onAgregar` y se limpia para el
 * siguiente.
 *
 * `clave` fuerza el remonte de `BloqueIdentificacion` al agregar: es la forma
 * más simple de reiniciar también su `useConsultaCedula` interno (bloqueo,
 * mensaje de la consulta), que este componente no controla directamente.
 */
export default function SubformularioAsistente({ onAgregar }: Props) {
  const [identificacion, setIdentificacion] = useState<DatosIdentificacion>(
    IDENTIFICACION_VACIA,
  );
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [clave, setClave] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

  function validar(): ErroresFormulario {
    const encontrados = limpiarErrores({
      cedula: validarCedula(identificacion.cedula),
      nombres: identificacion.nombres.trim() ? undefined : "Ingrese los nombres.",
      apellidos: identificacion.apellidos.trim()
        ? undefined
        : "Ingrese los apellidos.",
      tipoPersona: identificacion.tipoPersona
        ? undefined
        : "Seleccione el tipo de persona.",
      programa:
        esEstudiante(identificacion) && !identificacion.programa
          ? "Seleccione el programa académico."
          : undefined,
      semestre:
        esEstudiante(identificacion) && !identificacion.semestre
          ? "Seleccione el semestre."
          : undefined,
      motivoConsulta: motivoConsulta.trim()
        ? undefined
        : "Describa el motivo de consulta.",
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
      ...identificacion,
      motivoConsulta: motivoConsulta.trim(),
    });

    setIdentificacion(IDENTIFICACION_VACIA);
    setMotivoConsulta("");
    setErrores({});
    setClave((previa) => previa + 1);
  }

  return (
    <div
      ref={contenedorRef}
      className="space-y-4 rounded-tarjeta border border-borde bg-superficie-tenue p-5"
      onKeyDown={(evento) => {
        // Enter en un campo de una sola línea no debe enviar TODA la brigada:
        // sólo "Agregar a la lista" hace eso. El textarea del motivo queda
        // fuera porque ahí Enter es un salto de línea, no un envío.
        const objetivo = evento.target as HTMLElement;
        if (
          evento.key === "Enter" &&
          (objetivo.tagName === "INPUT" || objetivo.tagName === "SELECT")
        ) {
          evento.preventDefault();
        }
      }}
    >
      <BloqueIdentificacion
        key={clave}
        valor={identificacion}
        onChange={(datos) => {
          setIdentificacion(datos);
          setErrores((previos) =>
            sinErrores(
              previos,
              "cedula",
              "nombres",
              "apellidos",
              "tipoPersona",
              "programa",
              "semestre",
            ),
          );
        }}
        errores={errores}
      />

      <CampoTextareaConIA
        name="motivoConsulta"
        etiqueta="Motivo de consulta"
        valor={motivoConsulta}
        onChange={(v) => {
          setMotivoConsulta(v);
          setErrores((previos) => sinErrores(previos, "motivoConsulta"));
        }}
        filas={3}
        maxLength={1000}
        error={errores.motivoConsulta}
        requerido
      />

      <div className="flex justify-end">
        <button type="button" onClick={agregar} className="boton-primario">
          Agregar a la lista
        </button>
      </div>
    </div>
  );
}
