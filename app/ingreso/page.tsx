import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import FormularioIngreso from "./FormularioIngreso";

export const metadata: Metadata = {
  title: "Ingreso",
};

export default async function Ingreso() {
  // Quien ya tiene sesión no necesita volver a pasar por aquí.
  const sesion = await obtenerSesion();
  if (sesion) redirect("/");

  return <FormularioIngreso />;
}
