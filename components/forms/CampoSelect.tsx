"use client";

import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor, { atributosControl } from "./CampoContenedor";

/** Una opción puede ser texto plano o un par valor/etiqueta. */
export type OpcionSelect = string | { valor: string; etiqueta: string };

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  opciones: readonly OpcionSelect[];
  /** Texto de la opción vacía. Siempre presente, nunca seleccionable a la fuerza. */
  textoVacio?: string;
  onBlur?: () => void;
}

function normalizar(opcion: OpcionSelect): { valor: string; etiqueta: string } {
  return typeof opcion === "string"
    ? { valor: opcion, etiqueta: opcion }
    : opcion;
}

export default function CampoSelect({
  name,
  etiqueta,
  valor,
  onChange,
  opciones,
  textoVacio = "Seleccione…",
  requerido,
  ayuda,
  error,
  deshabilitado,
  className,
  onBlur,
}: Props) {
  // Un catálogo aún sin poblar (PROGRAMAS, ENFERMERAS) se muestra deshabilitado
  // y lo dice, en vez de ofrecer un desplegable vacío.
  const sinOpciones = opciones.length === 0;

  return (
    <CampoContenedor
      name={name}
      etiqueta={etiqueta}
      requerido={requerido}
      ayuda={ayuda}
      error={error}
      className={className}
    >
      <div className="relative">
        <select
          {...atributosControl(name, error, ayuda)}
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          onBlur={onBlur}
          disabled={deshabilitado || sinOpciones}
          required={requerido}
          className="control-base pr-10"
        >
          <option value="">
            {sinOpciones ? "Catálogo sin configurar" : textoVacio}
          </option>
          {opciones.map((opcion) => {
            const { valor: v, etiqueta: e } = normalizar(opcion);
            return (
              <option key={v} value={v}>
                {e}
              </option>
            );
          })}
        </select>

        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutro-500"
        >
          <path
            d="M4 6.5 8 10.5 12 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </CampoContenedor>
  );
}
