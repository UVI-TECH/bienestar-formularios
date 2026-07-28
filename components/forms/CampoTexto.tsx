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
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  /** Sólo para `tipo="number"`: acota el teclado y las flechas del navegador. */
  min?: number;
  max?: number;
  step?: number;
  /** Unidad fija a la derecha del valor, p. ej. `kg`, `cm`, `mg/dL`. */
  sufijo?: string;
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
  min,
  max,
  step,
  sufijo,
  requerido,
  ayuda,
  error,
  deshabilitado,
  soloLectura,
  resaltado,
  className,
  onBlur,
}: Props) {
  const control = (
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
      min={min}
      max={max}
      step={step}
      readOnly={soloLectura}
      disabled={deshabilitado}
      required={requerido}
      className={cn(
        "control-base",
        sufijo && "pr-14",
        soloLectura && "control-solo-lectura",
        resaltado && "campo-resaltado",
      )}
    />
  );

  return (
    <CampoContenedor
      name={name}
      etiqueta={etiqueta}
      requerido={requerido}
      ayuda={ayuda}
      error={error}
      className={className}
    >
      {sufijo ? (
        <div className="relative">
          {control}
          {/* La unidad acompaña al valor pero no se captura: es rótulo, no dato. */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-ayuda text-texto-tenue"
          >
            {sufijo}
          </span>
        </div>
      ) : (
        control
      )}
    </CampoContenedor>
  );
}
