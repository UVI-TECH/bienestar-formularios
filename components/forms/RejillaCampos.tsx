import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  children: ReactNode;
  /** Columnas en pantallas medianas en adelante. En móvil siempre es una. */
  columnas?: 2 | 3;
  className?: string;
}

/**
 * Rejilla estándar de campos. Los campos individuales controlan su ancho con
 * `className="sm:col-span-2"` cuando necesitan ocupar la fila completa.
 */
export default function RejillaCampos({
  children,
  columnas = 2,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-5 gap-y-3",
        columnas === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
