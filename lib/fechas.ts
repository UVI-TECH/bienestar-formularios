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

/**
 * Periodo semestral en curso, para clasificar los soportes de un caso:
 * enero–julio → `"{año}-1"`, agosto–diciembre → `"{año}-2"`. Se ancla a la
 * hora de Colombia por la misma razón que `fechaHoy`.
 */
export function periodoActual(referencia: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(referencia);

  const anio = partes.find((parte) => parte.type === "year")?.value ?? "";
  const mes = Number(partes.find((parte) => parte.type === "month")?.value ?? 0);
  return `${anio}-${mes <= 7 ? 1 : 2}`;
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

/**
 * `14:05` → `2:05 p. m.`. Para la pantalla de confirmación y para el detalle
 * de un caso de seguimiento.
 *
 * El valor no siempre viene de `<input type="time">`: en seguimiento de casos
 * puede venir de una fila de Excel ya existente, que no está garantizado que
 * respete el formato `HH:MM` (por ejemplo, si la celda quedó con una fecha en
 * vez de una hora). Por eso se valida la FORMA con una expresión regular antes
 * de tocar `Date` — comprobar `NaN` después de `Number(...)` no alcanza:
 * `hhmm.split(":")` de un valor sin `:` deja `minuto` en `undefined`, y
 * `Number.isNaN(undefined)` es `false`, así que un valor sin `:` se colaba y
 * producía una fecha inválida más abajo.
 */
export function horaLegible(hhmm: string): string {
  if (!hhmm) return "";
  const coincidencia = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!coincidencia) return hhmm;

  const hora = Number(coincidencia[1]);
  const minuto = Number(coincidencia[2]);
  if (hora > 23 || minuto > 59) return hhmm;

  const fecha = new Date();
  fecha.setHours(hora, minuto, 0, 0);
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
}

/**
 * `"2026-08-05T19:42:10.000Z"` → `"5 de agosto de 2026, 2:42 p. m."`, en hora
 * de Colombia. Para cuándo se subió un soporte (ver `lib/soportes.ts`).
 *
 * El valor puede llegar como texto ISO (lo usual si el flujo lo sella con
 * `utcNow()`) o, igual que en `lib/casos.ts`, como número de serie de Excel
 * si la columna de origen quedó formateada como Fecha/Hora — a diferencia de
 * fecha y hora por separado, un serial de Excel con las dos partes junta el
 * día (parte entera) y la hora (fracción) en un solo número, así que se
 * convierte de una vez en lugar de pedirle la hora a otro campo.
 */
export function fechaHoraLegible(valor: string): string {
  if (!valor) return "";

  const EPOCH_EXCEL_A_UNIX_DIAS = 25569;
  const MS_POR_DIA = 86_400_000;

  const fecha = /^\d+(\.\d+)?$/.test(valor)
    ? new Date((Number(valor) - EPOCH_EXCEL_A_UNIX_DIAS) * MS_POR_DIA)
    : new Date(valor);

  if (Number.isNaN(fecha.getTime())) return valor;

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
}
