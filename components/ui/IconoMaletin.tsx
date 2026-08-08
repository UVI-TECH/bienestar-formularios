import { cn } from "@/lib/cn";

/** Maletín, para el modo "Tono profesional" del asistente de redacción. */
export default function IconoMaletin({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <rect
        x="1.5"
        y="5"
        width="13"
        height="8.5"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 5V3.75A1.25 1.25 0 0 1 6.75 2.5h2.5A1.25 1.25 0 0 1 10.5 3.75V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1.5 9h13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
