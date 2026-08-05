"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import InsigniaEstado from "@/components/ui/InsigniaEstado";
import { cn } from "@/lib/cn";
import { variantesListaContenedor, variantesListaItem } from "@/lib/motion";
import type { AtencionPoliza } from "@/lib/casos";

type Filtro = "En seguimiento" | "Cerrado" | "Todos";
const FILTROS: readonly Filtro[] = ["En seguimiento", "Cerrado", "Todos"];

/** Columnas de la tabla, en el orden en que se declara la rejilla de abajo. */
const COLUMNAS_REJILLA = "sm:grid-cols-[0.85fr_0.8fr_1.7fr_0.85fr_1.4fr_0.9fr]";

interface Props {
  casos: AtencionPoliza[];
  error?: string;
}

export default function ListaCasos({ casos, error }: Props) {
  const [filtro, setFiltro] = useState<Filtro>("En seguimiento");
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const consulta = busqueda.replace(/\D/g, "");
    return casos.filter((caso) => {
      const coincideEstado = filtro === "Todos" || caso.estado === filtro;
      const coincideBusqueda = !consulta || caso.cedula.includes(consulta);
      return coincideEstado && coincideBusqueda;
    });
  }, [casos, filtro, busqueda]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="max-w-2xl">
        <p className="font-mono text-meta uppercase text-texto-tenue">
          Póliza estudiantil
        </p>
        <h1 className="mt-2 font-serif text-portada font-semibold text-texto">
          Seguimiento de casos
        </h1>
        <p className="mt-3 text-cuerpo text-texto-medio">
          Casos de accidente por póliza estudiantil, abiertos o cerrados.
          Seleccione uno para ver su historia y registrar novedades.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div
          role="tablist"
          aria-label="Filtrar por estado"
          className="inline-flex gap-1 rounded-campo border border-borde-fuerte bg-superficie p-1"
        >
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filtro === f}
              onClick={() => setFiltro(f)}
              className={cn(
                "rounded-chip px-3.5 py-1.5 text-etiqueta font-medium transition-colors",
                filtro === f
                  ? "bg-inst-700 text-white"
                  : "text-texto-medio hover:bg-superficie-tenue",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          type="text"
          inputMode="numeric"
          value={busqueda}
          onChange={(evento) =>
            setBusqueda(evento.target.value.replace(/\D/g, "").slice(0, 12))
          }
          placeholder="Buscar por cédula"
          aria-label="Buscar por cédula"
          className="control-base max-w-56"
        />
      </div>

      {error ? (
        <p className="mt-10 max-w-md text-cuerpo text-error-700">{error}</p>
      ) : filtrados.length === 0 ? (
        <p className="mt-10 text-cuerpo text-texto-medio">
          {casos.length === 0
            ? "Todavía no hay casos registrados."
            : "Ningún caso coincide con el filtro."}
        </p>
      ) : (
        <div
          role="table"
          aria-label="Casos de póliza estudiantil"
          className="mt-8 overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta"
        >
          <div
            role="row"
            className={cn(
              "hidden gap-4 border-b border-borde bg-superficie-tenue px-5 py-3 text-meta uppercase text-texto-tenue sm:grid",
              COLUMNAS_REJILLA,
            )}
          >
            <span role="columnheader">Caso</span>
            <span role="columnheader">Fecha</span>
            <span role="columnheader">Estudiante</span>
            <span role="columnheader">Sede</span>
            <span role="columnheader">Diagnóstico</span>
            <span role="columnheader">Estado</span>
          </div>

          <motion.div
            variants={variantesListaContenedor}
            initial="oculto"
            animate="visible"
          >
            <AnimatePresence initial={false}>
              {filtrados.map((caso) => (
                <motion.div
                  key={caso.casoId}
                  layout
                  variants={variantesListaItem}
                  initial="oculto"
                  animate="visible"
                  exit="oculto"
                >
                  <Link
                    href={`/poliza/seguimiento/${caso.casoId}`}
                    role="row"
                    className={cn(
                      "grid grid-cols-1 gap-1.5 border-b border-borde px-5 py-4 transition-colors last:border-b-0 hover:bg-superficie-tenue sm:items-center sm:gap-4 sm:py-3.5",
                      COLUMNAS_REJILLA,
                    )}
                  >
                    <span role="cell" className="font-mono text-ayuda text-inst-800">
                      {caso.casoId}
                    </span>
                    <span role="cell" className="font-mono text-ayuda text-texto-medio">
                      {caso.fechaAccidente || "—"}
                    </span>
                    <span role="cell" className="text-cuerpo text-texto">
                      {`${caso.nombres} ${caso.apellidos}`.trim() || "—"}
                    </span>
                    <span role="cell" className="text-ayuda text-texto-medio">
                      {caso.sede || "—"}
                    </span>
                    <span role="cell" className="truncate text-ayuda text-texto-medio">
                      {caso.diagnosticoPresuntivo || "—"}
                    </span>
                    <span role="cell">
                      <InsigniaEstado estado={caso.estado} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}
