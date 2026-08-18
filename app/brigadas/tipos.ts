import type { DatosIdentificacion } from "@/lib/identificacion";

/** Un asistente ya agregado a la lista de la brigada. */
export interface Asistente extends DatosIdentificacion {
  /** Sólo para la lista en pantalla (`key`, eliminar); no se envía al servidor. */
  id: string;
  motivoConsulta: string;
}
