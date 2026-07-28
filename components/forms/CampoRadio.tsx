"use client";

import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor from "./CampoContenedor";
import type { OpcionSelect } from "./CampoSelect";

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  opciones: readonly OpcionSelect[];
}

function normalizar(opcion: OpcionSelect): { valor: string; etiqueta: string } {
  return typeof opcion === "string"
    ? { valor: opcion, etiqueta: opcion }
    : opcion;
}

/**
 * Grupo de opciones excluyentes. Frente a un select, deja las alternativas a
 * la vista y se responde de un toque: para decisiones de dos o tres opciones
 * en tablet, es menos fricción que abrir un desplegable.
 */
export default function CampoRadio({
  name,
  etiqueta,
  valor,
  onChange,
  opciones,
  requerido,
  ayuda,
  error,
  deshabilitado,
  className,
}: Props) {
  const descripcion = error
    ? `${name}-error`
    : ayuda
      ? `${name}-ayuda`
      : undefined;

  return (
    <CampoContenedor
      name={name}
      etiqueta={etiqueta}
      requerido={requerido}
      ayuda={ayuda}
      error={error}
      className={className}
      asociarEtiqueta={false}
    >
      <div
        role="radiogroup"
        aria-labelledby={`${name}-etiqueta`}
        aria-describedby={descripcion}
        aria-invalid={error ? true : undefined}
        className="flex flex-wrap gap-3"
      >
        {opciones.map((opcion) => {
          const { valor: v, etiqueta: e } = normalizar(opcion);
          return (
            <label key={v} className="opcion-radio">
              <input
                type="radio"
                name={name}
                value={v}
                checked={valor === v}
                onChange={() => onChange(v)}
                disabled={deshabilitado}
              />
              {e}
            </label>
          );
        })}
      </div>
    </CampoContenedor>
  );
}
