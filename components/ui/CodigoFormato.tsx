import { cn } from "@/lib/cn";

interface Props {
  codigo: string;
  version: string;
  className?: string;
}

/**
 * Sello documental del formato institucional, p. ej. `BH-F-013 · V-1-2018`.
 * Mismo tratamiento en el índice y en el encabezado de cada formulario.
 */
export default function CodigoFormato({ codigo, version, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-chip border border-borde px-2 py-1 font-mono text-meta uppercase text-texto-tenue",
        className,
      )}
    >
      {codigo}
      <span aria-hidden className="text-neutro-300">
        ·
      </span>
      {version}
    </span>
  );
}
