import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  /**
   * Marca de paso (`A`, `B`, `1`…). En formularios largos convierte las
   * secciones en tramos reconocibles, sin partirlos en páginas: quien registra
   * sigue recorriendo un solo documento y puede volver atrás con la vista.
   */
  paso?: string;
  /** Encierra la sección en un panel, para lo que cierra o decide el registro. */
  destacado?: boolean;
  className?: string;
}

export default function SeccionFormulario({
  titulo,
  descripcion,
  children,
  paso,
  destacado,
  className,
}: Props) {
  return (
    <fieldset
      className={cn(
        "min-w-0",
        destacado &&
          "rounded-tarjeta border border-inst-200 bg-inst-50/60 px-5 py-5 sm:px-6",
        className,
      )}
    >
      {/* `float-left w-full` saca al legend de su posición nativa sobre el
          borde del fieldset; sin eso, el encabezado se monta sobre el marco
          del panel destacado. El contenido lo despeja con `clear-both`. */}
      <legend className="float-left mb-5 w-full border-b border-borde pb-3">
        <span className="flex items-baseline gap-3">
          {paso && (
            <span
              aria-hidden
              className="flex h-6 w-6 shrink-0 items-center justify-center self-center rounded-chip border border-inst-300 bg-superficie font-mono text-meta text-inst-700"
            >
              {paso}
            </span>
          )}
          <span className="font-display text-subtitulo font-semibold text-texto">
            {/* El paso también se anuncia, para que no dependa del recuadro. */}
            {paso && <span className="sr-only">Paso {paso}. </span>}
            {titulo}
          </span>
        </span>
        {descripcion && (
          <span className="mt-1 block text-ayuda text-texto-tenue">
            {descripcion}
          </span>
        )}
      </legend>

      <div className="clear-both space-y-3">{children}</div>
    </fieldset>
  );
}
