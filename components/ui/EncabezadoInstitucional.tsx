import Link from "next/link";
import BotonSalir from "./BotonSalir";
import SelectorColorTema from "./SelectorColorTema";
import { obtenerSesion } from "@/lib/sesion";

/**
 * Banda superior presente en todas las pantallas. Estática por diseño: la
 * navegación entre páginas no se anima. Sólo cambia según haya o no sesión:
 * quien no ha ingresado no ve el botón "Salir" ni su nombre.
 */
export default async function EncabezadoInstitucional() {
  const sesion = await obtenerSesion();

  return (
    <header className="border-b border-borde bg-superficie">
      <div className="mx-auto flex max-w-5xl items-center gap-3.5 px-6 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-3.5 rounded-chip transition-opacity hover:opacity-80"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-campo font-display text-sm font-extrabold text-white"
            style={{
              background:
                "linear-gradient(155deg, var(--color-inst-500), var(--color-inst-700))",
            }}
          >
            UJ
          </span>
          <span className="leading-tight">
            <span className="block font-display text-etiqueta font-bold text-texto">
              Bienestar Universitario
            </span>
            <span className="block text-meta uppercase text-texto-tenue">
              UNIAJC · Área de Salud
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          {sesion ? (
            <>
              <p className="hidden pr-2 text-meta uppercase text-texto-tenue sm:block">
                {sesion.nombres} {sesion.apellidos}
              </p>
              <SelectorColorTema />
              <BotonSalir />
            </>
          ) : (
            <>
              <p className="hidden rounded-chip bg-superficie-tenue px-3 py-1.5 text-meta uppercase text-texto-tenue sm:block">
                Registro digital de formatos
              </p>
              <SelectorColorTema />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
