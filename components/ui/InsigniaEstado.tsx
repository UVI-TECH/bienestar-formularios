import { cn } from "@/lib/cn";

/**
 * Insignia del estado de un caso de seguimiento. Sólo dos estados son
 * posibles hoy (`ESTADOS_CASO`), pero se trata cualquier otro valor como
 * "cerrado" por seguridad: es preferible un caso resuelto mal etiquetado
 * que uno cerrado que se siga mostrando como pendiente.
 */
export default function InsigniaEstado({ estado }: { estado: string }) {
  const enSeguimiento = estado === "En seguimiento";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-chip border px-2 py-1 text-meta font-medium uppercase",
        enSeguimiento
          ? "border-aviso-200 bg-aviso-50 text-aviso-700"
          : "border-exito-200 bg-exito-50 text-exito-700",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          enSeguimiento ? "bg-aviso-700" : "bg-exito-600",
        )}
      />
      {estado || "—"}
    </span>
  );
}
