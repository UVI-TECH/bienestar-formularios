"use client";

import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor from "./CampoContenedor";

export interface OpcionCasilla {
  valor: string;
  etiqueta: string;
}

interface Props extends PropsCampoBase {
  valores: readonly string[];
  onChange: (valores: string[]) => void;
  opciones: readonly OpcionCasilla[];
}

/**
 * Grupo de casillas independientes (a diferencia de `CampoRadio`, admite
 * varias marcadas a la vez). Se usa para los módulos de una persona en el
 * panel de administración.
 */
export default function CampoCasillas({
  name,
  etiqueta,
  valores,
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

  function alternar(valor: string) {
    onChange(
      valores.includes(valor)
        ? valores.filter((v) => v !== valor)
        : [...valores, valor],
    );
  }

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
        role="group"
        aria-labelledby={`${name}-etiqueta`}
        aria-describedby={descripcion}
        className="flex flex-wrap gap-3"
      >
        {opciones.map((opcion) => (
          <label key={opcion.valor} className="opcion-casilla">
            <input
              type="checkbox"
              name={name}
              value={opcion.valor}
              checked={valores.includes(opcion.valor)}
              onChange={() => alternar(opcion.valor)}
              disabled={deshabilitado}
            />
            {opcion.etiqueta}
          </label>
        ))}
      </div>
    </CampoContenedor>
  );
}
