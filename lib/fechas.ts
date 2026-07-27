/**
 * Utilidades de fecha y hora ancladas a la zona horaria de Colombia, para que
 * los valores por defecto no dependan del reloj del servidor.
 */

const ZONA = "America/Bogota";

/** Fecha actual en formato `AAAA-MM-DD` (el que espera `<input type="date">`). */
export function fechaHoy(referencia: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referencia);
}

/** Hora actual en formato `HH:MM` de 24 horas (el que espera `<input type="time">`). */
export function horaAhora(referencia: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(referencia);
}

/** `2026-07-27` → `27 de julio de 2026`. Para la pantalla de confirmación. */
export function fechaLegible(iso: string): string {
  if (!iso) return "";
  const [anio, mes, dia] = iso.split("-").map(Number);
  if (!anio || !mes || !dia) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia));
}

/** `14:05` → `2:05 p. m.`. Para la pantalla de confirmación. */
export function horaLegible(hhmm: string): string {
  if (!hhmm) return "";
  const [hora, minuto] = hhmm.split(":").map(Number);
  if (Number.isNaN(hora) || Number.isNaN(minuto)) return hhmm;
  const fecha = new Date();
  fecha.setHours(hora, minuto, 0, 0);
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
}
