import { obtenerSesion } from "@/lib/sesion";
import FormularioActividad from "./FormularioActividad";

export default async function ActividadInstitucional() {
  const sesion = await obtenerSesion();

  return (
    <FormularioActividad
      facilitadorPorDefecto={
        sesion ? `${sesion.nombres} ${sesion.apellidos}`.trim() : ""
      }
    />
  );
}
