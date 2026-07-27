import type { Opcional, Programa, Semestre, TipoPersona } from "./types";

/**
 * Bloque de identificación compartido por los cuatro formularios: es lo que
 * `BloqueIdentificacion` administra y lo que la consulta por cédula rellena.
 */
export interface DatosIdentificacion {
  cedula: string;
  nombres: string;
  apellidos: string;
  tipoPersona: Opcional<TipoPersona>;
  programa: Programa;
  semestre: Opcional<Semestre>;
}

export const IDENTIFICACION_VACIA: DatosIdentificacion = {
  cedula: "",
  nombres: "",
  apellidos: "",
  tipoPersona: "",
  programa: "",
  semestre: "",
};

/** Los datos académicos sólo aplican a estudiantes. */
export function esEstudiante(datos: DatosIdentificacion): boolean {
  return datos.tipoPersona === "Estudiante";
}
