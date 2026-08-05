import { ENFERMERAS } from "@/lib/catalogos";
import { nombreDeSesionEnCatalogo, obtenerSesion } from "@/lib/sesion";
import AtencionPorAccidente from "./AtencionPorAccidente";

export default async function PolizaPagina() {
  const sesion = await obtenerSesion();

  return (
    <AtencionPorAccidente
      enfermeraPorDefecto={nombreDeSesionEnCatalogo(sesion, ENFERMERAS)}
    />
  );
}
