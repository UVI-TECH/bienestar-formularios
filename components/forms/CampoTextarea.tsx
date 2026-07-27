"use client";

import { cn } from "@/lib/cn";
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
  soloLectura,
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
        readOnly={soloLectura}
        disabled={deshabilitado}
        required={requerido}
        className={cn(
          "control-base resize-y leading-relaxed",
          soloLectura && "control-solo-lectura",
        )}
      />
    </CampoContenedor>
  );
}
