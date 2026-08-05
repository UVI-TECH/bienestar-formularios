import { ENFERMERAS } from "@/lib/catalogos";
import { nombreDeSesionEnCatalogo, obtenerSesion } from "@/lib/sesion";
import Tamizaje from "./Tamizaje";

export default async function TamizajePagina() {
  const sesion = await obtenerSesion();

  return (
    <Tamizaje auxiliarPorDefecto={nombreDeSesionEnCatalogo(sesion, ENFERMERAS)} />
  );
}
