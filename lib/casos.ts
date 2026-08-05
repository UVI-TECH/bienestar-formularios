import "server-only";

import { marcaDeTiempo } from "./envio";

/**
 * Cliente de seguimiento de casos de accidente por póliza estudiantil, vía
 * Power Automate. Sólo se usa desde `/poliza/seguimiento` y sus rutas de API.
 *
 * Igual que `lib/personas.ts`, la forma exacta de la respuesta de los flujos
 * no está confirmada contra el flujo real: se admiten las mismas envolturas
 * plausibles (`{ value: [...] }`, `{ valor: [...] }` o el arreglo directo).
 *
 * Los campos de `AtencionPoliza` son los mismos que escribe
 * `app/poliza/AtencionPorAccidente.tsx` al enviar el registro (ver
 * `enviarRegistro("poliza", …)`), más `caso_id` y `registrado_en`, que agrega
 * el servidor en `lib/envio.ts`.
 */

export class ErrorCasos extends Error {}

function limpiar(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * Fecha/hora en Excel Online — normalización de un defecto conocido.
 *
 * Aunque se escribe texto (`"2026-08-03"`, `"14:05"`), si la columna de la
 * tabla está formateada como Fecha/Hora, Excel lo guarda como valor numérico
 * real; y el conector, al leerlo de vuelta, a veces devuelve ese número de
 * serie crudo en vez de texto formateado (p. ej. `46237` o
 * `0.679166666666667`). Un valor así nunca tiene `-` ni `:`, así que la forma
 * es suficiente para distinguirlo de un `"AAAA-MM-DD"` u `"HH:MM"` normales,
 * que se dejan intactos.
 *
 * El epoch de Excel es el 30 de diciembre de 1899; `25569` son los días hasta
 * el epoch de Unix (1 de enero de 1970), y ya incluye el ajuste por el error
 * de año bisiesto de 1900 que arrastra Excel — es la constante estándar que
 * usan librerías como SheetJS para esta conversión.
 */
const EPOCH_EXCEL_A_UNIX_DIAS = 25569;
const MS_POR_DIA = 86_400_000;

function esNumeroSerieExcel(valor: string): boolean {
  return /^\d+(\.\d+)?$/.test(valor);
}

/** `"46237"` → `"2026-08-03"`. Deja cualquier otro valor (vacío, ya en `AAAA-MM-DD`) sin tocar. */
function normalizarFechaExcel(valor: string): string {
  if (!esNumeroSerieExcel(valor)) return valor;

  const serieDia = Math.floor(Number(valor));
  const fecha = new Date((serieDia - EPOCH_EXCEL_A_UNIX_DIAS) * MS_POR_DIA);
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** `"0.679166666666667"` → `"16:18"`. Deja cualquier otro valor (vacío, ya en `HH:MM`) sin tocar. */
function normalizarHoraExcel(valor: string): string {
  if (!esNumeroSerieExcel(valor)) return valor;

  const numero = Number(valor);
  const fraccionDelDia = numero - Math.floor(numero);
  const minutosDelDia = Math.round(fraccionDelDia * 24 * 60);
  const horas = String(Math.floor(minutosDelDia / 60) % 24).padStart(2, "0");
  const minutos = String(minutosDelDia % 60).padStart(2, "0");
  return `${horas}:${minutos}`;
}

function limpiarFecha(valor: unknown): string {
  return normalizarFechaExcel(limpiar(valor));
}

function limpiarHora(valor: unknown): string {
  return normalizarHoraExcel(limpiar(valor));
}

function extraerFilas(carga: unknown): unknown[] {
  if (Array.isArray(carga)) return carga;
  if (carga && typeof carga === "object") {
    const sobre = carga as { value?: unknown; valor?: unknown };
    if (Array.isArray(sobre.value)) return sobre.value;
    if (Array.isArray(sobre.valor)) return sobre.valor;
  }
  return [];
}

const TIEMPO_LIMITE_MS = 8_000;

/** POST genérico contra un flujo de Power Automate. Devuelve el cuerpo ya parseado (o `undefined` si no trae uno). */
async function llamarFlujo(url: string, cuerpo: unknown): Promise<unknown> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (causa) {
    throw new ErrorCasos(
      causa instanceof Error && causa.name === "TimeoutError"
        ? "El servicio de casos no respondió a tiempo."
        : "No fue posible contactar el servicio de casos.",
    );
  }

  if (!respuesta.ok) {
    throw new ErrorCasos(`El servicio de casos respondió ${respuesta.status}.`);
  }

  try {
    return await respuesta.json();
  } catch {
    // Algunos flujos de escritura no devuelven cuerpo; no es un error.
    return undefined;
  }
}

/* ---------------------------------------------------------------------------
   Atenciones (AtencionesPoliza) — registro inicial, inmutable
   --------------------------------------------------------------------------- */

interface FilaAtencion {
  caso_id?: unknown;
  fecha_accidente?: unknown;
  hora_accidente?: unknown;
  sede?: unknown;
  lugar_accidente?: unknown;
  hora_ingreso?: unknown;
  cedula?: unknown;
  nombres?: unknown;
  apellidos?: unknown;
  sexo?: unknown;
  programa?: unknown;
  facultad?: unknown;
  semestre?: unknown;
  telefono_estudiante?: unknown;
  telefono_familiar?: unknown;
  enfermera?: unknown;
  atencion_inicial?: unknown;
  area_protegida?: unknown;
  hora_llamada?: unknown;
  medico_area_protegida?: unknown;
  ambulancia?: unknown;
  tipo_remision?: unknown;
  centro_medico?: unknown;
  diagnostico_presuntivo?: unknown;
  hora_egreso?: unknown;
  acompanante?: unknown;
  observaciones?: unknown;
  estado?: unknown;
  registrado_en?: unknown;
}

export interface AtencionPoliza {
  casoId: string;
  fechaAccidente: string;
  horaAccidente: string;
  sede: string;
  lugarAccidente: string;
  horaIngreso: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  sexo: string;
  programa: string;
  facultad: string;
  semestre: string;
  telefonoEstudiante: string;
  telefonoFamiliar: string;
  enfermera: string;
  atencionInicial: string;
  areaProtegida: string;
  horaLlamada: string;
  medicoAreaProtegida: string;
  ambulancia: string;
  tipoRemision: string;
  centroMedico: string;
  diagnosticoPresuntivo: string;
  horaEgreso: string;
  acompanante: string;
  observaciones: string;
  estado: string;
  registradoEn: string;
}

function mapearAtencion(fila: unknown): AtencionPoliza | undefined {
  if (!fila || typeof fila !== "object") return undefined;
  const f = fila as FilaAtencion;

  const casoId = limpiar(f.caso_id);
  if (!casoId) return undefined;

  return {
    casoId,
    fechaAccidente: limpiarFecha(f.fecha_accidente),
    horaAccidente: limpiarHora(f.hora_accidente),
    sede: limpiar(f.sede),
    lugarAccidente: limpiar(f.lugar_accidente),
    horaIngreso: limpiarHora(f.hora_ingreso),
    cedula: limpiar(f.cedula),
    nombres: limpiar(f.nombres),
    apellidos: limpiar(f.apellidos),
    sexo: limpiar(f.sexo),
    programa: limpiar(f.programa),
    facultad: limpiar(f.facultad),
    semestre: limpiar(f.semestre),
    telefonoEstudiante: limpiar(f.telefono_estudiante),
    telefonoFamiliar: limpiar(f.telefono_familiar),
    enfermera: limpiar(f.enfermera),
    atencionInicial: limpiar(f.atencion_inicial),
    areaProtegida: limpiar(f.area_protegida),
    horaLlamada: limpiarHora(f.hora_llamada),
    medicoAreaProtegida: limpiar(f.medico_area_protegida),
    ambulancia: limpiar(f.ambulancia),
    tipoRemision: limpiar(f.tipo_remision),
    centroMedico: limpiar(f.centro_medico),
    diagnosticoPresuntivo: limpiar(f.diagnostico_presuntivo),
    horaEgreso: limpiarHora(f.hora_egreso),
    acompanante: limpiar(f.acompanante),
    observaciones: limpiar(f.observaciones),
    estado: limpiar(f.estado),
    registradoEn: limpiar(f.registrado_en),
  };
}

/** Todas las filas de AtencionesPoliza. No hay filtro en el flujo: se filtra en la aplicación. */
export async function leerCasos(): Promise<AtencionPoliza[]> {
  const url = process.env.PA_URL_LEER_CASOS;
  if (!url) throw new ErrorCasos("Falta configurar PA_URL_LEER_CASOS.");

  const carga = await llamarFlujo(url, {});
  return extraerFilas(carga)
    .map(mapearAtencion)
    .filter((atencion): atencion is AtencionPoliza => Boolean(atencion));
}

/* ---------------------------------------------------------------------------
   Seguimientos — línea de tiempo de un caso
   --------------------------------------------------------------------------- */

interface FilaSeguimiento {
  seguimiento_id?: unknown;
  caso_id?: unknown;
  numero_seguimiento?: unknown;
  fecha?: unknown;
  tipo?: unknown;
  descripcion?: unknown;
  proxima_accion?: unknown;
  fecha_proxima_accion?: unknown;
  registrado_por?: unknown;
}

export interface Seguimiento {
  seguimientoId: string;
  casoId: string;
  numeroSeguimiento: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  proximaAccion: string;
  fechaProximaAccion: string;
  registradoPor: string;
}

function mapearSeguimiento(fila: unknown): Seguimiento | undefined {
  if (!fila || typeof fila !== "object") return undefined;
  const f = fila as FilaSeguimiento;

  const seguimientoId = limpiar(f.seguimiento_id);
  if (!seguimientoId) return undefined;

  const numero = Number(f.numero_seguimiento);

  return {
    seguimientoId,
    casoId: limpiar(f.caso_id),
    numeroSeguimiento: Number.isFinite(numero) ? numero : 0,
    fecha: limpiarFecha(f.fecha),
    tipo: limpiar(f.tipo),
    descripcion: limpiar(f.descripcion),
    proximaAccion: limpiar(f.proxima_accion),
    fechaProximaAccion: limpiarFecha(f.fecha_proxima_accion),
    registradoPor: limpiar(f.registrado_por),
  };
}

/** Seguimientos de un caso, del más reciente al más antiguo. */
export async function leerSeguimientos(casoId: string): Promise<Seguimiento[]> {
  const url = process.env.PA_URL_LEER_SEGUIMIENTOS;
  if (!url) throw new ErrorCasos("Falta configurar PA_URL_LEER_SEGUIMIENTOS.");

  const carga = await llamarFlujo(url, { caso_id: casoId });
  return extraerFilas(carga)
    .map(mapearSeguimiento)
    .filter((seguimiento): seguimiento is Seguimiento => Boolean(seguimiento))
    .sort((a, b) => b.numeroSeguimiento - a.numeroSeguimiento);
}

/* ---------------------------------------------------------------------------
   Escritura
   --------------------------------------------------------------------------- */

export interface NuevoSeguimiento {
  casoId: string;
  numeroSeguimiento: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  /** Van como `""` cuando no se llenan (ver `lib/envio.ts`). */
  proximaAccion: string;
  fechaProximaAccion: string;
  registradoPor: string;
}

/**
 * `seguimiento_id` se construye aquí, no llega del cliente: es determinístico
 * a partir del caso y el número. `registrado_en` también lo pone el servidor
 * (igual que en `lib/envio.ts` para los otros formatos): el reloj del cliente
 * no es fiable, y el esquema del trigger de Power Automate lo exige.
 */
export async function agregarSeguimiento(datos: NuevoSeguimiento): Promise<void> {
  const url = process.env.PA_URL_SEGUIMIENTO;
  if (!url) throw new ErrorCasos("Falta configurar PA_URL_SEGUIMIENTO.");

  await llamarFlujo(url, {
    seguimiento_id: `${datos.casoId}-${datos.numeroSeguimiento}`,
    caso_id: datos.casoId,
    numero_seguimiento: datos.numeroSeguimiento,
    fecha: datos.fecha,
    tipo: datos.tipo,
    descripcion: datos.descripcion,
    proxima_accion: datos.proximaAccion,
    fecha_proxima_accion: datos.fechaProximaAccion,
    registrado_por: datos.registradoPor,
    registrado_en: marcaDeTiempo(),
  });
}

/** Actualiza `estado = "Cerrado"` en AtencionesPoliza. */
export async function cerrarCaso(casoId: string): Promise<void> {
  const url = process.env.PA_URL_CERRAR_CASO;
  if (!url) throw new ErrorCasos("Falta configurar PA_URL_CERRAR_CASO.");

  await llamarFlujo(url, { caso_id: casoId });
}
