"use client";

import { useEffect, useRef } from "react";
import { horaAhora } from "@/lib/fechas";
import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor, { atributosControl } from "./CampoContenedor";

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  /** Fija la hora actual al montar, si el campo viene vacío. */
  porDefectoAhora?: boolean;
}

export default function CampoHora({
  name,
  etiqueta,
  valor,
  onChange,
  porDefectoAhora = true,
  requerido,
  ayuda,
  error,
  deshabilitado,
  className,
}: Props) {
  const yaAplicado = useRef(false);

  useEffect(() => {
    if (yaAplicado.current || !porDefectoAhora || valor) return;
    yaAplicado.current = true;
    onChange(horaAhora());
  }, [porDefectoAhora, valor, onChange]);

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
        type="time"
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        disabled={deshabilitado}
        required={requerido}
        className="control-base"
      />
    </CampoContenedor>
  );
}
