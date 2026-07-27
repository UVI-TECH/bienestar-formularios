import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Agrupa campos afines bajo un título. `fieldset`/`legend` para que los
 * lectores de pantalla anuncien a qué bloque pertenece cada campo.
 */
export default function SeccionFormulario({
  titulo,
  descripcion,
  children,
  className,
}: Props) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-4 w-full border-b border-borde pb-2">
        <span className="block font-serif text-seccion font-semibold text-texto">
          {titulo}
        </span>
        {descripcion && (
          <span className="mt-0.5 block text-ayuda text-texto-tenue">
            {descripcion}
          </span>
        )}
      </legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}
