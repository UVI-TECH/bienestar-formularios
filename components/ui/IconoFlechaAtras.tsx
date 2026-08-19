import { cn } from "@/lib/cn";

/**
 * Chevron "volver", para botones de regreso al índice o a un listado.
 * Deliberadamente sin línea (a diferencia de `IconoFlecha`, que sí la lleva):
 * volver es un gesto más discreto que "ir a".
 */
export default function IconoFlechaAtras({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M10 3.5 5 8l5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
