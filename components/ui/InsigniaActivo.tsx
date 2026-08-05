import { cn } from "@/lib/cn";

/** Insignia de estado activo/inactivo de una persona, en el panel de administración. */
export default function InsigniaActivo({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-chip border px-2 py-1 text-meta font-medium uppercase",
        activo
          ? "border-exito-200 bg-exito-50 text-exito-700"
          : "border-error-200 bg-error-50 text-error-700",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          activo ? "bg-exito-600" : "bg-error-600",
        )}
      />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
