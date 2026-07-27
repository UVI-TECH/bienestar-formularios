import Link from "next/link";
import CodigoFormato from "@/components/ui/CodigoFormato";
import { FORMATOS_EN_ORDEN } from "@/lib/formatos";

export default function Indice() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="font-mono text-meta uppercase text-texto-tenue">Índice</p>
        <h1 className="mt-2 font-serif text-portada font-semibold text-texto">
          Formularios del área de salud
        </h1>
        <p className="mt-3 text-cuerpo text-texto-medio">
          Seleccione el formato que va a diligenciar. Cada registro se guarda al
          finalizar y el formulario queda listo para la siguiente persona.
        </p>
      </header>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FORMATOS_EN_ORDEN.map((formato, indice) => (
          <li key={formato.ruta}>
            <Link
              href={formato.ruta}
              className="group flex h-full flex-col rounded-tarjeta border border-borde bg-superficie p-6 shadow-tarjeta transition-[border-color,box-shadow] hover:border-inst-300 hover:shadow-elevada"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-meta text-texto-tenue transition-colors group-hover:text-inst-700">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className="text-inst-400 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-inst-700"
                >
                  →
                </span>
              </div>

              <h2 className="mt-4 font-serif text-subtitulo font-semibold text-texto">
                {formato.titulo}
              </h2>
              <p className="mt-2 flex-1 text-ayuda text-texto-medio">
                {formato.descripcion}
              </p>

              <CodigoFormato formato={formato} className="mt-5 self-start" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
