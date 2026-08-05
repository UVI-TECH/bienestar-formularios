"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import InsigniaActivo from "@/components/ui/InsigniaActivo";
import { cn } from "@/lib/cn";
import { ETIQUETAS_MODULO } from "@/lib/modulos";
import { variantesListaContenedor, variantesListaItem, variantesPanel } from "@/lib/motion";
import type { PersonaPublica } from "@/lib/personas";
import FormularioPersona from "./FormularioPersona";

type Filtro = "Activos" | "Inactivos" | "Todos";
const FILTROS: readonly Filtro[] = ["Activos", "Inactivos", "Todos"];
type Vista = "lista" | "crear" | "editar";

/** Columnas de la tabla, en el orden en que se declara la rejilla de abajo. */
const COLUMNAS_REJILLA = "sm:grid-cols-[0.9fr_1.5fr_1.1fr_1.8fr_0.8fr_auto]";

interface Props {
  personasIniciales: PersonaPublica[];
  documentoPropio: string;
  error?: string;
}

export default function PanelPersonas({ personasIniciales, documentoPropio, error }: Props) {
  const [personas, setPersonas] = useState(personasIniciales);
  const [errorCarga, setErrorCarga] = useState(error ?? "");
  const [filtro, setFiltro] = useState<Filtro>("Activos");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<Vista>("lista");
  const [personaEditando, setPersonaEditando] = useState<PersonaPublica | null>(null);

  const filtrados = useMemo(() => {
    const consulta = busqueda.trim().toLowerCase();
    return personas.filter((persona) => {
      const coincideEstado =
        filtro === "Todos" || (filtro === "Activos" ? persona.activo : !persona.activo);
      const coincideBusqueda =
        !consulta ||
        persona.documento.toLowerCase().includes(consulta) ||
        `${persona.nombres} ${persona.apellidos}`.toLowerCase().includes(consulta);
      return coincideEstado && coincideBusqueda;
    });
  }, [personas, filtro, busqueda]);

  async function refrescar() {
    try {
      const respuesta = await fetch("/api/admin/personas", { cache: "no-store" });
      if (!respuesta.ok) return;
      const cuerpo = (await respuesta.json()) as { ok: boolean; personas?: PersonaPublica[] };
      if (cuerpo.ok && cuerpo.personas) {
        setPersonas(cuerpo.personas);
        setErrorCarga("");
      }
    } catch {
      // La tabla se queda con los datos que ya tenía; no es un error crítico.
    }
  }

  function abrirCrear() {
    setPersonaEditando(null);
    setVista("crear");
  }

  function abrirEditar(persona: PersonaPublica) {
    setPersonaEditando(persona);
    setVista("editar");
  }

  function cerrarFormulario() {
    setVista("lista");
    setPersonaEditando(null);
  }

  async function alGuardar() {
    cerrarFormulario();
    await refrescar();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-meta uppercase text-texto-tenue">Administración</p>
          <h1 className="mt-2 font-serif text-portada font-semibold text-texto">
            Personas y accesos
          </h1>
          <p className="mt-3 text-cuerpo text-texto-medio">
            Quién puede ingresar al sistema y qué módulos ve, sin editar el Excel
            a mano. Los cambios quedan disponibles de inmediato.
          </p>
        </div>

        {vista === "lista" && (
          <button type="button" onClick={abrirCrear} className="boton-primario">
            Agregar persona
          </button>
        )}
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {vista === "lista" ? (
          <motion.div
            key="lista"
            variants={variantesPanel}
            initial="entra"
            animate="visible"
            exit="sale"
          >
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
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar por documento o nombre"
                aria-label="Buscar por documento o nombre"
                className="control-base max-w-64"
              />
            </div>

            {errorCarga ? (
              <p className="mt-10 max-w-md text-cuerpo text-error-700">{errorCarga}</p>
            ) : filtrados.length === 0 ? (
              <p className="mt-10 text-cuerpo text-texto-medio">
                {personas.length === 0
                  ? "Todavía no hay personas registradas."
                  : "Nadie coincide con el filtro."}
              </p>
            ) : (
              <div
                role="table"
                aria-label="Personas del sistema"
                className="mt-8 overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta"
              >
                <div
                  role="row"
                  className={cn(
                    "hidden gap-4 border-b border-borde bg-superficie-tenue px-5 py-3 text-meta uppercase text-texto-tenue sm:grid",
                    COLUMNAS_REJILLA,
                  )}
                >
                  <span role="columnheader">Documento</span>
                  <span role="columnheader">Nombre</span>
                  <span role="columnheader">Rol</span>
                  <span role="columnheader">Módulos</span>
                  <span role="columnheader">Estado</span>
                  <span role="columnheader" className="sr-only">
                    Acción
                  </span>
                </div>

                <motion.div
                  variants={variantesListaContenedor}
                  initial="oculto"
                  animate="visible"
                >
                  {filtrados.map((persona) => (
                    <motion.div
                      key={persona.documento}
                      layout
                      variants={variantesListaItem}
                      initial="oculto"
                      animate="visible"
                      role="row"
                      className={cn(
                        "grid grid-cols-1 gap-1.5 border-b border-borde px-5 py-4 transition-colors last:border-b-0 hover:bg-superficie-tenue sm:items-center sm:gap-4 sm:py-3.5",
                        COLUMNAS_REJILLA,
                      )}
                    >
                      <span role="cell" className="font-mono text-ayuda text-inst-800">
                        {persona.documento}
                      </span>
                      <span role="cell" className="text-cuerpo text-texto">
                        {`${persona.nombres} ${persona.apellidos}`.trim() || "—"}
                      </span>
                      <span role="cell" className="text-ayuda text-texto-medio">
                        {persona.rolEtiqueta || "—"}
                      </span>
                      <span role="cell" className="flex flex-wrap gap-1.5">
                        {persona.modulos.length === 0 ? (
                          <span className="text-ayuda text-texto-tenue">—</span>
                        ) : (
                          persona.modulos.map((modulo) => (
                            <span
                              key={modulo}
                              className="inline-flex items-center rounded-chip border border-borde bg-superficie-tenue px-2 py-0.5 text-meta text-texto-medio"
                            >
                              {ETIQUETAS_MODULO[modulo]}
                            </span>
                          ))
                        )}
                      </span>
                      <span role="cell">
                        <InsigniaActivo activo={persona.activo} />
                      </span>
                      <span role="cell" className="sm:text-right">
                        <button
                          type="button"
                          onClick={() => abrirEditar(persona)}
                          className="rounded-chip text-ayuda font-medium text-inst-700 underline-offset-2 hover:underline"
                        >
                          Editar
                        </button>
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="formulario"
            variants={variantesPanel}
            initial="entra"
            animate="visible"
            exit="sale"
            className="mt-8"
          >
            <FormularioPersona
              persona={personaEditando}
              documentoPropio={documentoPropio}
              onGuardado={alGuardar}
              onCancelar={cerrarFormulario}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
