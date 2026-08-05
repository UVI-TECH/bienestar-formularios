import { borrarSesion } from "@/lib/sesion";

/** POST /api/logout — borra la cookie de sesión. */
export async function POST(): Promise<Response> {
  await borrarSesion();
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
