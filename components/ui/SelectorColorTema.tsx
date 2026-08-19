"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import IconoCheck from "@/components/ui/IconoCheck";
import IconoGota from "@/components/ui/IconoGota";
import { cn } from "@/lib/cn";
import { transicionRapida } from "@/lib/motion";
import {
  MATIZ_PREDETERMINADO,
  PRESETS_COLOR_TEMA,
  aplicarColorTema,
  guardarColorTema,
  leerColorTemaGuardado,
} from "@/lib/temaColor";

/**
 * Selector del color de marca de toda la aplicación. Cambia `--inst-hue`
 * (ver `app/globals.css`) y lo guarda en `localStorage` para que la próxima
 * visita abra ya con ese color — el script inline en `app/layout.tsx` es el
 * que lo aplica antes del primer pintado, esto sólo mantiene la UI del
 * selector y el estado en sincronía con lo que la persona elige.
 */
export default function SelectorColorTema() {
  const [abierto, setAbierto] = useState(false);
  // Inicialización perezosa: en el servidor `leerColorTemaGuardado` no
  // encuentra `localStorage` y cae en el valor por defecto sin lanzar; en el
  // cliente lee el matiz real antes del primer render, sin pasar por un
  // efecto para sincronizarlo.
  const [matiz, setMatiz] = useState(
    () => leerColorTemaGuardado() ?? MATIZ_PREDETERMINADO,
  );
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function alHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }

    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  function elegir(nuevoMatiz: number) {
    setMatiz(nuevoMatiz);
    aplicarColorTema(nuevoMatiz);
    guardarColorTema(nuevoMatiz);
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label="Color de la aplicación"
        title="Color de la aplicación"
        className="flex h-9 w-9 items-center justify-center rounded-chip text-inst-600 transition-colors hover:bg-superficie-tenue"
      >
        <IconoGota className="h-[18px] w-[18px]" />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            role="menu"
            aria-label="Elegir color de la aplicación"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={transicionRapida}
            className="absolute right-0 top-full z-20 mt-2 w-52 rounded-tarjeta border border-borde bg-superficie p-2 shadow-elevada"
          >
            <p className="px-2 pb-1.5 pt-1 text-meta uppercase text-texto-tenue">
              Color de la aplicación
            </p>
            <div className="flex flex-col gap-0.5">
              {PRESETS_COLOR_TEMA.map((preset) => {
                const seleccionado = preset.matiz === matiz;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={seleccionado}
                    onClick={() => elegir(preset.matiz)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-campo px-2 py-1.5 text-etiqueta transition-colors",
                      seleccionado
                        ? "bg-inst-50 font-medium text-inst-800"
                        : "text-texto-medio hover:bg-superficie-tenue",
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-4 w-4 shrink-0 rounded-full border border-black/5"
                      style={{
                        backgroundColor: `oklch(58% 0.13 ${preset.matiz})`,
                      }}
                    />
                    <span className="flex-1 text-left">{preset.etiqueta}</span>
                    {seleccionado && (
                      <IconoCheck className="h-3.5 w-3.5 shrink-0 text-inst-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
