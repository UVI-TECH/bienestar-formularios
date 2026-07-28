"use client";

import FormularioAtencion from "@/components/forms/FormularioAtencion";
import { PROFESIONALES } from "@/lib/catalogos";
import { FORMATOS } from "@/lib/formatos";

export default function ConsultaMedica() {
  return (
    <FormularioAtencion
      formato={FORMATOS.consultaMedica}
      rutaEnvio="consulta-medica"
      quienAtiende={{
        name: "profesional",
        etiqueta: "Médico/profesional que atiende",
        opciones: PROFESIONALES,
      }}
    />
  );
}
