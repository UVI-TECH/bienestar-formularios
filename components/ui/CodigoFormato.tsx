import { cn } from "@/lib/cn";
import type { Formato } from "@/lib/types";

interface Props {
  formato: Formato;
  className?: string;
}

/**
 * Sello documental del formato, con el mismo tratamiento en el índice y en el
 * encabezado del formulario.
 *
 * Un formato codificado se muestra como `BH-F-013 · V-1-2018`: mono, versalitas
 * y borde continuo, como un sello de documento. Uno que aún no tiene código se
 * muestra con su texto provisional en borde punteado y sin versalitas: es una
 * nota, no un código, y conviene que se lea como tal.
 */
export default function CodigoFormato({ formato, className }: Props) {
  const codificado = Boolean(formato.codigo && formato.version);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-chip border px-2 py-1 text-texto-tenue",
        codificado
          ? "border-borde font-mono text-meta uppercase"
          : "border-dashed border-neutro-300 text-ayuda",
        className,
      )}
    >
      {codificado ? (
        <>
          {formato.codigo}
          <span aria-hidden className="text-neutro-300">
            ·
          </span>
          {formato.version}
        </>
      ) : (
        formato.sello
      )}
    </span>
  );
}
