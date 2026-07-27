"use client";

import { cn } from "@/lib/cn";
import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor, { atributosControl } from "./CampoContenedor";

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  tipo?: "text" | "email" | "tel" | "number";
  /** Sugerencia dentro del control. Nunca reemplaza a la etiqueta. */
  marcador?: string;
  maxLength?: number;
  autoComplete?: string;
  /** Mayúsculas automáticas: útil para nombres, innecesario en correos. */
  autoCapitalize?: "none" | "words" | "sentences";
  inputMode?: "text" | "numeric" | "tel" | "email";
  onBlur?: () => void;
}

export default function CampoTexto({
  name,
  etiqueta,
  valor,
  onChange,
  tipo = "text",
  marcador,
  maxLength,
  autoComplete,
  autoCapitalize,
  inputMode,
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
      <input
        {...atributosControl(name, error, ayuda)}
        type={tipo}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        onBlur={onBlur}
        placeholder={marcador}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        inputMode={inputMode}
        readOnly={soloLectura}
        disabled={deshabilitado}
        required={requerido}
        className={cn("control-base", soloLectura && "control-solo-lectura")}
      />
    </CampoContenedor>
  );
}
