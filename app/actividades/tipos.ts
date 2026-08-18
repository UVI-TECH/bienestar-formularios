/** Un asistente ya agregado a la lista de la actividad. */
export interface Asistente {
  /** Sólo para la lista en pantalla (`key`, eliminar); no se envía al servidor. */
  id: string;
  nombresApellidos: string;
  documento: string;
  cargo: string;
  dependencia: string;
  correo: string;
}
