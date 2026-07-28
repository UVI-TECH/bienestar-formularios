"use client";

import FormularioAtencion from "@/components/forms/FormularioAtencion";
import { ENFERMERAS } from "@/lib/catalogos";
import { FORMATOS } from "@/lib/formatos";

export default function AsistenciaEnfermeria() {
  return (
    <FormularioAtencion
      formato={FORMATOS.enfermeria}
      rutaEnvio="enfermeria"
      quienAtiende={{
        name: "enfermera",
        etiqueta: "Enfermera que atiende",
        opciones: ENFERMERAS,
      }}
    />
  );
}
