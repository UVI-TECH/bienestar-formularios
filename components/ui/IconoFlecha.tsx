import { cn } from "@/lib/cn";

/** Flecha "ir a", para enlaces de tarjeta en índices y listados. */
export default function IconoFlecha({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M3.5 8h9M8.25 4l4.25 4-4.25 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
