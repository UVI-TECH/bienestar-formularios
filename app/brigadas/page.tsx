import { PROFESIONALES } from "@/lib/catalogos";
import { nombreDeSesionEnCatalogo, obtenerSesion } from "@/lib/sesion";
import FormularioBrigada from "./FormularioBrigada";

export default async function BrigadaSalud() {
  const sesion = await obtenerSesion();

  return (
    <FormularioBrigada
      profesionalPorDefecto={nombreDeSesionEnCatalogo(sesion, PROFESIONALES)}
    />
  );
}
