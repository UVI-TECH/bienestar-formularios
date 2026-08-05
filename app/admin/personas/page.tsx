import type { Metadata } from "next";
import { ErrorPersonas, listarPersonas, sinClave } from "@/lib/personas";
import { obtenerSesion } from "@/lib/sesion";
import PanelPersonas from "./PanelPersonas";

export const metadata: Metadata = {
  title: "Personas y accesos",
};

export default async function AdminPersonasPagina() {
  const sesion = await obtenerSesion();

  let personas: Awaited<ReturnType<typeof listarPersonas>> = [];
  let error = "";

  try {
    personas = await listarPersonas();
  } catch (causa) {
    console.error(
      "[admin/personas] fallo al leer las personas:",
      causa instanceof ErrorPersonas ? causa.message : causa,
    );
    error = "No fue posible cargar las personas. Intente de nuevo en un momento.";
  }

  return (
    <PanelPersonas
      personasIniciales={personas.map(sinClave)}
      documentoPropio={sesion?.documento ?? ""}
      error={error}
    />
  );
}
