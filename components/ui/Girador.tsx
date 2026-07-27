import { cn } from "@/lib/cn";

/**
 * Indicador de proceso en curso. Es estado, no adorno: acompaña siempre a un
 * texto que dice qué está pasando. Bajo `prefers-reduced-motion` gira despacio
 * (ver `app/globals.css`) en lugar de congelarse.
 */
export default function Girador({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn("girador h-4 w-4 animate-spin", className)}
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M8 1.5A6.5 6.5 0 0 1 14.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
