import { PROFESIONALES } from "@/lib/catalogos";
import { nombreDeSesionEnCatalogo, obtenerSesion } from "@/lib/sesion";
import PlanificacionFamiliar from "./PlanificacionFamiliar";

export default async function PlanificacionFamiliarPagina() {
  const sesion = await obtenerSesion();

  return (
    <PlanificacionFamiliar
      profesionalPorDefecto={nombreDeSesionEnCatalogo(sesion, PROFESIONALES)}
    />
  );
}
