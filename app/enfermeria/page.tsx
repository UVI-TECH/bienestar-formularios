import FormularioAtencion from "@/components/forms/FormularioAtencion";
import { ENFERMERAS } from "@/lib/catalogos";
import { FORMATOS } from "@/lib/formatos";
import { nombreDeSesionEnCatalogo, obtenerSesion } from "@/lib/sesion";

export default async function AsistenciaEnfermeria() {
  const sesion = await obtenerSesion();

  return (
    <FormularioAtencion
      formato={FORMATOS.enfermeria}
      rutaEnvio="enfermeria"
      quienAtiende={{
        name: "enfermera",
        etiqueta: "Enfermera que atiende",
        opciones: ENFERMERAS,
      }}
      atiendePorDefecto={nombreDeSesionEnCatalogo(sesion, ENFERMERAS)}
    />
  );
}
