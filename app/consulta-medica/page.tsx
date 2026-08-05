import FormularioAtencion from "@/components/forms/FormularioAtencion";
import { PROFESIONALES } from "@/lib/catalogos";
import { FORMATOS } from "@/lib/formatos";
import { nombreDeSesionEnCatalogo, obtenerSesion } from "@/lib/sesion";

export default async function ConsultaMedica() {
  const sesion = await obtenerSesion();

  return (
    <FormularioAtencion
      formato={FORMATOS.consultaMedica}
      rutaEnvio="consulta-medica"
      quienAtiende={{
        name: "profesional",
        etiqueta: "Médico/profesional que atiende",
        opciones: PROFESIONALES,
      }}
      atiendePorDefecto={nombreDeSesionEnCatalogo(sesion, PROFESIONALES)}
    />
  );
}
