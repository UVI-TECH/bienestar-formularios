import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { MODULOS, type ModuloId } from "./modulos";

/**
 * Sesión del control de acceso por persona.
 *
 * Vive en una cookie httpOnly firmada con HMAC-SHA256: no hay base de datos
 * de sesiones, así que la firma es lo único que impide que alguien edite la
 * cookie a mano (por ejemplo, para agregarse el módulo "admin") desde las
 * herramientas de desarrollador del navegador. `httpOnly` sólo bloquea el
 * acceso desde JavaScript de la página, no desde ahí.
 *
 * TODO(M365): esto es un puente mientras no hay login institucional. Cuando
 * se migre a M365/Entra ID, `crearSesion` se llama después de validar el
 * token de M365 en vez de la clave de la tabla Personas; el resto de la
 * aplicación (proxy, `obtenerSesion`, `tieneModulo`) no cambia.
 */
export interface Sesion {
  documento: string;
  nombres: string;
  apellidos: string;
  modulos: ModuloId[];
}

export const NOMBRE_COOKIE_SESION = "sesion";

/** Una jornada de trabajo: pasado esto, hay que volver a ingresar. */
const DURACION_SESION_S = 12 * 60 * 60;

function clave(): string {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) throw new Error("Falta configurar SESSION_SECRET.");
  return secreto;
}

function firmar(valor: string): string {
  return createHmac("sha256", clave()).update(valor).digest("base64url");
}

function esModuloIdArray(valor: unknown): valor is ModuloId[] {
  return (
    Array.isArray(valor) &&
    valor.every(
      (v) => typeof v === "string" && (MODULOS as readonly string[]).includes(v),
    )
  );
}

function esSesionValida(valor: unknown): valor is Sesion {
  if (!valor || typeof valor !== "object") return false;
  const s = valor as Record<string, unknown>;
  return (
    typeof s.documento === "string" &&
    typeof s.nombres === "string" &&
    typeof s.apellidos === "string" &&
    esModuloIdArray(s.modulos)
  );
}

/** Codifica la sesión en el valor de cookie: cuerpo en base64url + firma HMAC. */
export function codificarSesion(sesion: Sesion): string {
  const cuerpo = Buffer.from(JSON.stringify(sesion), "utf8").toString(
    "base64url",
  );
  return `${cuerpo}.${firmar(cuerpo)}`;
}

/**
 * Decodifica y verifica el valor de la cookie. No lanza: un valor ausente,
 * corrupto o con firma inválida (cookie editada a mano) da `null`.
 */
export function decodificarSesion(
  valor: string | undefined | null,
): Sesion | null {
  if (!valor) return null;

  const separador = valor.indexOf(".");
  if (separador === -1) return null;

  const cuerpo = valor.slice(0, separador);
  const firma = valor.slice(separador + 1);
  const esperada = firmar(cuerpo);

  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const datos: unknown = JSON.parse(
      Buffer.from(cuerpo, "base64url").toString("utf8"),
    );
    return esSesionValida(datos) ? datos : null;
  } catch {
    return null;
  }
}

export async function crearSesion(sesion: Sesion): Promise<void> {
  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE_SESION, codificarSesion(sesion), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const almacen = await cookies();
  return decodificarSesion(almacen.get(NOMBRE_COOKIE_SESION)?.value);
}

export async function borrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE_SESION);
}

function normalizarNombre(valor: string): string {
  return valor.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Nombre de la persona en sesión, si coincide con una opción del catálogo
 * (p. ej. `ENFERMERAS`). Sirve para preseleccionar "quién atiende/registra"
 * en vez de dejarlo vacío — ya no hace falta preguntarlo si quien registra
 * ya se identificó al ingresar. La comparación ignora mayúsculas y espacios
 * repetidos porque el catálogo va en mayúsculas y la tabla Personas no
 * necesariamente. Sin coincidencia, devuelve `""` y el campo queda como
 * siempre: por elegir.
 */
export function nombreDeSesionEnCatalogo(
  sesion: Sesion | null,
  catalogo: readonly string[],
): string {
  if (!sesion) return "";
  const nombreCompleto = normalizarNombre(`${sesion.nombres} ${sesion.apellidos}`);
  return (
    catalogo.find((opcion) => normalizarNombre(opcion) === nombreCompleto) ?? ""
  );
}
