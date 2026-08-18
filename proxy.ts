import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ModuloId } from "@/lib/modulos";
import { tieneModulo } from "@/lib/modulos";
import { decodificarSesion, NOMBRE_COOKIE_SESION } from "@/lib/sesion";

/**
 * Ruta protegida → módulo que exige.
 *
 * Las cuatro primeras son las rutas de captura (ver `lib/formatos.ts`).
 * `/poliza/seguimiento` es el módulo de seguimiento de casos: cubre tanto la
 * lista (`/poliza/seguimiento`) como el detalle de cada caso
 * (`/poliza/seguimiento/{casoId}`), por eso se compara con `startsWith` en vez
 * de con igualdad exacta como las demás.
 *
 * El `matcher` de más abajo debe listar las mismas rutas: Next exige que sea
 * un arreglo literal para poder analizarlo en tiempo de compilación, así que
 * no se puede derivar de este objeto.
 */
const RUTAS_PROTEGIDAS: Record<string, ModuloId> = {
  "/enfermeria": "enfermeria",
  "/consulta-medica": "consulta-medica",
  "/tamizaje": "tamizaje",
  "/poliza": "poliza",
  "/brigadas": "brigadas",
  "/actividades": "actividades",
};

const PREFIJO_SEGUIMIENTO = "/poliza/seguimiento";
const PREFIJO_ADMIN = "/admin";

/**
 * Protege las rutas de formulario, seguimiento y administración por módulo.
 * El índice ("/") resuelve su propia sesión y su redirección a `/ingreso`
 * (ver `app/page.tsx`); acá sólo se cubren las rutas de captura, seguimiento
 * y administración.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const modulo =
    pathname === PREFIJO_SEGUIMIENTO || pathname.startsWith(`${PREFIJO_SEGUIMIENTO}/`)
      ? "seguimiento"
      : pathname === PREFIJO_ADMIN || pathname.startsWith(`${PREFIJO_ADMIN}/`)
        ? "admin"
        : RUTAS_PROTEGIDAS[pathname];

  if (!modulo) return NextResponse.next();

  const sesion = decodificarSesion(
    request.cookies.get(NOMBRE_COOKIE_SESION)?.value,
  );

  if (!sesion || !tieneModulo(sesion.modulos, modulo)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/enfermeria",
    "/consulta-medica",
    "/tamizaje",
    "/poliza",
    "/brigadas",
    "/actividades",
    "/poliza/seguimiento",
    "/poliza/seguimiento/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
