"use client";

import { useEffect, useRef } from "react";
import { fechaHoy } from "@/lib/fechas";
import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor, { atributosControl } from "./CampoContenedor";

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  /** Fija hoy al montar, si el campo viene vacío. */
  porDefectoHoy?: boolean;
  min?: string;
  max?: string;
}

export default function CampoFecha({
  name,
  etiqueta,
  valor,
  onChange,
  porDefectoHoy = true,
  min,
  max,
  requerido,
  ayuda,
  error,
  deshabilitado,
  className,
}: Props) {
  // El valor por defecto se aplica en el cliente, no al construir el estado:
  // así la fecha es la del equipo de quien registra y no la del servidor.
  const yaAplicado = useRef(false);

  useEffect(() => {
    if (yaAplicado.current || !porDefectoHoy || valor) return;
    yaAplicado.current = true;
    onChange(fechaHoy());
  }, [porDefectoHoy, valor, onChange]);

  return (
    <CampoContenedor
      name={name}
      etiqueta={etiqueta}
      requerido={requerido}
      ayuda={ayuda}
      error={error}
      className={className}
    >
      <input
        {...atributosControl(name, error, ayuda)}
        type="date"
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        min={min}
        max={max}
        disabled={deshabilitado}
        required={requerido}
        className="control-base"
      />
    </CampoContenedor>
  );
}
