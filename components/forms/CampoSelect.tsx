"use client";

import { cn } from "@/lib/cn";
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
  soloLectura,
  resaltado,
  className,
  onBlur,
}: Props) {
  // Un valor que viene de otro sistema (Smart Campus) puede no estar en el
  // catálogo local. Se agrega como opción para no perderlo en silencio.
  const enCatalogo = opciones.some((o) => normalizar(o).valor === valor);
  const disponibles: readonly OpcionSelect[] =
    valor && !enCatalogo ? [...opciones, valor] : opciones;

  // Un catálogo aún sin poblar (PROGRAMAS, ENFERMERAS) se muestra deshabilitado
  // y lo dice, en vez de ofrecer un desplegable vacío.
  const sinOpciones = disponibles.length === 0;

  // El `select` no admite `readonly`. Cuando el campo está bloqueado se muestra
  // el valor en un control de sólo lectura: ya no es una lista para elegir,
  // es un dato para leer, y así conserva el foco y se puede copiar.
  if (soloLectura) {
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
          type="text"
          value={valor}
          readOnly
          className={cn(
            "control-base control-solo-lectura",
            resaltado && "campo-resaltado",
          )}
        />
      </CampoContenedor>
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
    >
      <div className="relative">
        <select
          {...atributosControl(name, error, ayuda)}
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          onBlur={onBlur}
          disabled={deshabilitado || sinOpciones}
          required={requerido}
          className={cn("control-base pr-10", resaltado && "campo-resaltado")}
        >
          <option value="">
            {sinOpciones ? "Catálogo sin configurar" : textoVacio}
          </option>
          {disponibles.map((opcion) => {
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
