"use client";

import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor, { atributosControl } from "./CampoContenedor";

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  filas?: number;
  marcador?: string;
  maxLength?: number;
  onBlur?: () => void;
}

export default function CampoTextarea({
  name,
  etiqueta,
  valor,
  onChange,
  filas = 4,
  marcador,
  maxLength,
  requerido,
  ayuda,
  error,
  deshabilitado,
  className,
  onBlur,
}: Props) {
  return (
    <CampoContenedor
      name={name}
      etiqueta={etiqueta}
      requerido={requerido}
      ayuda={ayuda}
      error={error}
      className={className}
    >
      <textarea
        {...atributosControl(name, error, ayuda)}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        onBlur={onBlur}
        rows={filas}
        placeholder={marcador}
        maxLength={maxLength}
        disabled={deshabilitado}
        required={requerido}
        className="control-base resize-y leading-relaxed"
      />
    </CampoContenedor>
  );
}
