"use client";

import { useState } from "react";
import Girador from "@/components/ui/Girador";
import { CEDULA_MAX, cedulaConsultable, normalizarCedula } from "@/lib/validacion";
import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor, { atributosControl } from "./CampoContenedor";

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  /**
   * Consulta la persona por documento. Conectará con `/api/lookup`.
   * Si devuelve una promesa, el botón muestra el estado "Buscando…" hasta
   * que se resuelva.
   */
  onBuscar?: (cedula: string) => void | Promise<void>;
  /** Permite controlar el estado de búsqueda desde el formulario. */
  buscando?: boolean;
  onBlur?: () => void;
}

export default function CampoCedula({
  name,
  etiqueta,
  valor,
  onChange,
  onBuscar,
  buscando,
  requerido,
  ayuda,
  error,
  deshabilitado,
  className,
  onBlur,
}: Props) {
  const [buscandoInterno, setBuscandoInterno] = useState(false);
  const ocupado = buscando ?? buscandoInterno;
  const puedeBuscar = Boolean(onBuscar) && cedulaConsultable(valor);

  async function buscar() {
    if (!onBuscar || !puedeBuscar || ocupado) return;
    const resultado = onBuscar(valor);
    if (!(resultado instanceof Promise)) return;
    setBuscandoInterno(true);
    try {
      await resultado;
    } finally {
      setBuscandoInterno(false);
    }
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
      <div className="flex gap-2">
        <input
          {...atributosControl(name, error, ayuda)}
          type="text"
          value={valor}
          onChange={(evento) => onChange(normalizarCedula(evento.target.value))}
          onBlur={onBlur}
          onKeyDown={(evento) => {
            // Enter consulta el documento; no envía el formulario a medio llenar.
            if (evento.key === "Enter" && onBuscar) {
              evento.preventDefault();
              void buscar();
            }
          }}
          inputMode="numeric"
          autoComplete="off"
          maxLength={CEDULA_MAX}
          disabled={deshabilitado || ocupado}
          required={requerido}
          className="control-base"
        />

        {/* Ancho fijo: el cambio a "Buscando…" no debe mover el campo. */}
        {onBuscar && (
          <button
            type="button"
            onClick={() => void buscar()}
            disabled={deshabilitado || ocupado || !puedeBuscar}
            className="boton-secundario w-32 shrink-0 px-4"
          >
            {ocupado ? (
              <>
                <Girador />
                Buscando…
              </>
            ) : (
              "Buscar"
            )}
          </button>
        )}
      </div>
    </CampoContenedor>
  );
}
