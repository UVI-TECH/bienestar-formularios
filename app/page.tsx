import Link from "next/link";
import { redirect } from "next/navigation";
import CodigoFormato from "@/components/ui/CodigoFormato";
import IconoFlecha from "@/components/ui/IconoFlecha";
import { cn } from "@/lib/cn";
import { FORMATOS_EN_ORDEN } from "@/lib/formatos";
import { tieneModulo } from "@/lib/modulos";
import { obtenerSesion } from "@/lib/sesion";

interface EnlaceAuxiliar {
  href: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
}

export default async function Indice() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/ingreso");

  const formatos = FORMATOS_EN_ORDEN.filter((formato) =>
    tieneModulo(sesion.modulos, formato.modulo),
  );

  const enlacesAuxiliares: EnlaceAuxiliar[] = [
    tieneModulo(sesion.modulos, "seguimiento") && {
      href: "/poliza/seguimiento",
      etiqueta: "Póliza estudiantil",
      titulo: "Seguimiento de casos",
      descripcion: "Casos abiertos y cerrados, con su historia de seguimiento.",
    },
    tieneModulo(sesion.modulos, "admin") && {
      href: "/admin/personas",
      etiqueta: "Administración",
      titulo: "Personas y accesos",
      descripcion: "Quién ingresa al sistema y qué módulos tiene asignados.",
    },
  ].filter((enlace): enlace is EnlaceAuxiliar => Boolean(enlace));

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="max-w-2xl">
        <p className="inline-flex items-center rounded-chip bg-inst-50 px-3 py-1 font-mono text-meta uppercase text-inst-700">
          Índice
        </p>
        <h1 className="mt-3 font-display text-portada font-extrabold text-texto">
          Formularios del área de salud
        </h1>
        <p className="mt-3 text-cuerpo text-texto-medio">
          {sesion.nombres}, seleccione el formato que va a diligenciar. Cada
          registro se guarda al finalizar y el formulario queda listo para la
          siguiente persona.
        </p>
      </header>

      {formatos.length === 0 ? (
        <p className="mt-10 max-w-md text-cuerpo text-texto-medio">
          Su usuario todavía no tiene módulos de captura asignados. Si cree que
          esto es un error, comuníquese con Bienestar Universitario.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formatos.map((formato, indice) => (
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
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip bg-superficie-tenue text-inst-500 transition-[transform,background-color,color] group-hover:translate-x-0.5 group-hover:bg-inst-100 group-hover:text-inst-700"
                  >
                    <IconoFlecha className="h-3.5 w-3.5" />
                  </span>
                </div>

                <h2 className="mt-4 font-display text-subtitulo font-semibold text-texto">
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
      )}

      {enlacesAuxiliares.length > 0 && (
        <div className="mt-10 border-t border-borde pt-8">
          <div
            className={cn(
              "grid grid-cols-1 gap-4",
              enlacesAuxiliares.length > 1 && "sm:grid-cols-2",
            )}
          >
            {enlacesAuxiliares.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="group flex items-center justify-between gap-4 rounded-tarjeta border border-dashed border-borde-fuerte bg-superficie px-6 py-5 transition-[border-color,background-color] hover:border-inst-300 hover:bg-superficie-tenue"
              >
                <div>
                  <p className="font-mono text-meta uppercase text-texto-tenue">
                    {enlace.etiqueta}
                  </p>
                  <p className="mt-1 font-display text-subtitulo font-semibold text-texto">
                    {enlace.titulo}
                  </p>
                  <p className="mt-1 text-ayuda text-texto-medio">
                    {enlace.descripcion}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip bg-superficie text-inst-500 transition-[transform,background-color,color] group-hover:translate-x-0.5 group-hover:bg-inst-100 group-hover:text-inst-700"
                >
                  <IconoFlecha className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
