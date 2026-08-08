"use client";

import { useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Girador from "@/components/ui/Girador";
import IconoMaletin from "@/components/ui/IconoMaletin";
import IconoVarita from "@/components/ui/IconoVarita";
import { cn } from "@/lib/cn";
import { transicionRapida, variantesColapso, variantesEtiquetaBoton } from "@/lib/motion";
import type { PropsCampoBase } from "@/lib/types";
import CampoContenedor, { atributosControl } from "./CampoContenedor";
import { RESALTADO_MS } from "./utilidades";

interface Props extends PropsCampoBase {
  valor: string;
  onChange: (valor: string) => void;
  filas?: number;
  marcador?: string;
  maxLength?: number;
  onBlur?: () => void;
}

type EstadoAsistente = "reposo" | "mejorando" | "listo" | "error";
type Modo = "corregir" | "profesional";

const MENSAJE_ERROR_GENERICO = "No se pudo mejorar el texto, intente de nuevo.";

const MODOS: Array<{
  modo: Modo;
  etiqueta: string;
  etiquetaCargando: string;
  etiquetaSugerido: string;
  Icono: ComponentType<{ className?: string }>;
}> = [
  {
    modo: "corregir",
    etiqueta: "Corregir",
    etiquetaCargando: "Corrigiendo…",
    etiquetaSugerido: "corrección",
    Icono: IconoVarita,
  },
  {
    modo: "profesional",
    etiqueta: "Profesional",
    etiquetaCargando: "Redactando…",
    etiquetaSugerido: "tono profesional",
    Icono: IconoMaletin,
  },
];

/**
 * `CampoTextarea` con un asistente de redacción por IA, en dos modos:
 * "Corregir" (sólo ortografía y gramática) y "Profesional" (reescribe a
 * registro clínico en tercera persona). Nunca reemplaza el texto de golpe —
 * muestra una comparación y sólo aplica si la persona lo confirma.
 *
 * El texto original queda intacto en todo momento hasta pulsar "Aplicar
 * cambios"; si la llamada falla, lo escrito no se pierde.
 */
export default function CampoTextareaConIA({
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
  const [estado, setEstado] = useState<EstadoAsistente>("reposo");
  const [modoActivo, setModoActivo] = useState<Modo | null>(null);
  const [sugerencia, setSugerencia] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [resaltado, setResaltado] = useState(false);
  const temporizadorResaltado = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const movimientoReducido = useReducedMotion();

  const habilitado = !deshabilitado && !soloLectura && valor.trim().length > 0;
  const mejorando = estado === "mejorando";
  const mostrarBotones = estado !== "listo";

  async function mejorar(modo: Modo) {
    setEstado("mejorando");
    setModoActivo(modo);
    setMensajeError("");
    try {
      const respuesta = await fetch("/api/mejorar-texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: valor, modo }),
      });
      const cuerpo: { textoMejorado?: string; error?: string } | null = await respuesta
        .json()
        .catch(() => null);

      if (!respuesta.ok || !cuerpo?.textoMejorado) {
        throw new Error(cuerpo?.error || MENSAJE_ERROR_GENERICO);
      }

      setSugerencia(cuerpo.textoMejorado);
      setEstado("listo");
    } catch (causa) {
      setMensajeError(causa instanceof Error ? causa.message : MENSAJE_ERROR_GENERICO);
      setEstado("error");
    }
  }

  function aplicar() {
    onChange(sugerencia);
    cerrar();

    clearTimeout(temporizadorResaltado.current);
    setResaltado(true);
    temporizadorResaltado.current = setTimeout(() => setResaltado(false), RESALTADO_MS);
  }

  function cerrar() {
    setEstado("reposo");
    setModoActivo(null);
    setSugerencia("");
    setMensajeError("");
  }

  const infoModoSugerido = MODOS.find((m) => m.modo === modoActivo);

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
            "control-base resize-y pb-10 leading-relaxed",
            soloLectura && "control-solo-lectura",
            resaltado && "campo-resaltado",
          )}
        />

        {!soloLectura && (
          <AnimatePresence initial={false}>
            {mostrarBotones && (
              <motion.div
                key="botones-mejorar"
                initial={movimientoReducido ? false : { opacity: 0 }}
                animate={{ opacity: 1, transition: transicionRapida }}
                exit={movimientoReducido ? undefined : { opacity: 0, transition: transicionRapida }}
                className="absolute right-2 bottom-2 flex items-center gap-1.5"
              >
                {MODOS.map(({ modo, etiqueta: etiquetaModo, etiquetaCargando, Icono }) => (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => mejorar(modo)}
                    disabled={!habilitado || mejorando}
                    className="boton-secundario min-h-0! gap-1.5 px-2.5 py-1 text-ayuda"
                  >
                    <span className="grid items-center">
                      {/* Texto invisible que fija el ancho: el botón no cambia de tamaño al pasar a "…". */}
                      <span
                        aria-hidden
                        className="invisible col-start-1 row-start-1 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Girador className="h-3.5 w-3.5" />
                        {etiquetaCargando}
                      </span>
                      <AnimatePresence initial={false}>
                        <motion.span
                          key={mejorando && modoActivo === modo ? "cargando" : "reposo"}
                          variants={variantesEtiquetaBoton}
                          initial="entra"
                          animate="visible"
                          exit="sale"
                          className="col-start-1 row-start-1 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {mejorando && modoActivo === modo ? (
                            <Girador className="h-3.5 w-3.5" />
                          ) : (
                            <Icono className="h-3.5 w-3.5" />
                          )}
                          {mejorando && modoActivo === modo ? etiquetaCargando : etiquetaModo}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence initial={false}>
        {estado === "listo" && (
          <motion.div
            key="comparacion"
            variants={variantesColapso}
            initial={movimientoReducido ? false : "oculto"}
            animate="visible"
            exit={movimientoReducido ? undefined : "oculto"}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3 rounded-campo border border-borde bg-superficie-tenue p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-meta font-medium tracking-wide text-texto-tenue uppercase">
                    Original
                  </p>
                  <p className="text-ayuda whitespace-pre-wrap text-texto-medio">{valor}</p>
                </div>
                <div>
                  <p className="mb-1 text-meta font-medium tracking-wide text-texto-tenue uppercase">
                    Sugerido
                    {infoModoSugerido && ` · ${infoModoSugerido.etiquetaSugerido}`}
                  </p>
                  <p className="text-ayuda whitespace-pre-wrap text-texto">{sugerencia}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cerrar}
                  className="boton-secundario min-h-0! px-3 py-1.5 text-ayuda"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={aplicar}
                  className="boton-primario min-h-0! px-3 py-1.5 text-ayuda"
                >
                  Aplicar cambios
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {estado === "error" && mensajeError && (
        <p role="alert" className="text-ayuda mt-1 text-error-600">
          {mensajeError}
        </p>
      )}
    </CampoContenedor>
  );
}
