import { cn } from "@/lib/cn";

/** Gota de color, para el selector de color de marca del encabezado. */
export default function IconoGota({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M8 1.5s4.5 5.2 4.5 8.2a4.5 4.5 0 1 1-9 0C3.5 6.7 8 1.5 8 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
