import Link from "next/link";
import BotonSalir from "./BotonSalir";
import { obtenerSesion } from "@/lib/sesion";

/**
 * Banda institucional presente en todas las pantallas. Estática por diseño:
 * la navegación entre páginas no se anima. Sólo cambia según haya o no
 * sesión: quien no ha ingresado no ve el botón "Salir" ni su nombre.
 */
export default async function EncabezadoInstitucional() {
  const sesion = await obtenerSesion();

  return (
    <header className="border-b border-inst-950/30 bg-inst-800 text-inst-100">
      <div className="trama-pauta">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link
            href="/"
            className="rounded-chip font-serif text-lg font-semibold tracking-tight text-white transition-colors hover:text-inst-200"
          >
            UNIAJC
          </Link>

          <span aria-hidden className="h-8 w-px bg-white/20" />

          <div className="leading-tight">
            <p className="text-etiqueta font-medium text-white">
              Bienestar Universitario
            </p>
            <p className="text-meta uppercase text-inst-300">Área de Salud</p>
          </div>

          {sesion ? (
            <div className="ml-auto flex items-center gap-4">
              <p className="hidden text-meta uppercase text-inst-300 sm:block">
                {sesion.nombres} {sesion.apellidos}
              </p>
              <BotonSalir />
            </div>
          ) : (
            <p className="ml-auto hidden text-meta uppercase text-inst-300 sm:block">
              Registro digital de formatos
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
