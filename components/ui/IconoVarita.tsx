import { cn } from "@/lib/cn";

/** Destello, para el botón del asistente de redacción ("Mejorar redacción"). */
export default function IconoVarita({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M8 1.5c.3 2.1 1 3.5 1.9 4.6 1.1.9 2.5 1.6 4.6 1.9-2.1.3-3.5 1-4.6 1.9-.9 1.1-1.6 2.5-1.9 4.6-.3-2.1-1-3.5-1.9-4.6C5 8.9 3.6 8.2 1.5 7.9c2.1-.3 3.5-1 4.6-1.9C7 4.9 7.7 3.5 8 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
