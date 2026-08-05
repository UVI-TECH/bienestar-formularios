import type { SEDES, SEMESTRES, SEXO, TIPOS_PERSONA } from "./catalogos";

/* ---------------------------------------------------------------------------
   Tipos derivados de los catálogos
   --------------------------------------------------------------------------- */

export type Sede = (typeof SEDES)[number];
export type TipoPersona = (typeof TIPOS_PERSONA)[number];
export type Sexo = (typeof SEXO)[number];
export type Semestre = (typeof SEMESTRES)[number];

/** Programas y enfermeras aún no están tipados como literales: los catálogos
 *  se poblarán después y por ahora son listas abiertas de texto. */
export type Programa = string;
export type Enfermera = string;

/**
 * Un select siempre ofrece "Seleccione…", así que su valor puede estar vacío.
 * `Opcional<T>` modela exactamente eso sin recurrir a `null`.
 */
export type Opcional<T extends string> = T | "";

/* ---------------------------------------------------------------------------
   Bloques de datos comunes a los formularios
   --------------------------------------------------------------------------- */

/** Identificación de la persona atendida, común a los cuatro formularios. */
export interface DatosPersona {
  cedula: string;
  /** Nombres y apellidos van separados porque así los entrega Smart Campus. */
  nombres: string;
  apellidos: string;
  tipoPersona: Opcional<TipoPersona>;
  programa: Programa;
  facultad: string;
  semestre: Opcional<Semestre>;
  sexo: Opcional<Sexo>;
  /** Se guarda como texto para no arrastrar `NaN` desde el input. */
  edad: string;
  telefono: string;
  correo: string;
}

/** Metadatos de atención presentes en todo registro. */
export interface DatosAtencion {
  /** Formato ISO `AAAA-MM-DD` (el que produce `<input type="date">`). */
  fecha: string;
  /** Formato 24 horas `HH:MM` (el que produce `<input type="time">`). */
  hora: string;
  sede: Opcional<Sede>;
}

/** Base que extienden los registros concretos de cada formulario. */
export interface RegistroBase extends DatosAtencion {
  persona: DatosPersona;
  observaciones: string;
}

/* ---------------------------------------------------------------------------
   Identificación del formato institucional
   --------------------------------------------------------------------------- */

/**
 * Encabezado documental de cada formulario.
 *
 * Los formatos ya codificados en Isolución llevan `codigo` y `version`
 * (p. ej. `BH-F-013 · V-1-2018`). Un instrumento nuevo, mientras Calidad no le
 * asigne código, se identifica con `sello`: un texto libre que ocupa su lugar.
 */
export interface Formato {
  titulo: string;
  descripcion?: string;
  codigo?: string;
  version?: string;
  /** Sólo cuando el formato aún no tiene código asignado. */
  sello?: string;
}

/* ---------------------------------------------------------------------------
   Envío y validación
   --------------------------------------------------------------------------- */

export type EstadoEnvio = "inactivo" | "enviando" | "exito" | "error";

/** Errores por campo: la clave es el `name` del campo. */
export type ErroresFormulario = Record<string, string>;

/* ---------------------------------------------------------------------------
   Consulta de persona por cédula (POST /api/lookup)
   --------------------------------------------------------------------------- */

export interface CuerpoConsultaCedula {
  cedula: string;
  tipoPersona?: string;
}

/**
 * Forma exacta y única de la respuesta de `/api/lookup`.
 *
 * El route handler nunca reenvía la respuesta cruda de Smart Campus: la mapea
 * a estos campos y descarta todo lo demás. Los errores (cédula inválida, límite
 * de consultas, fallo del servicio externo) viajan en el código HTTP, no en el
 * cuerpo, para que esta forma no cambie nunca.
 */
export interface RespuestaConsultaCedula {
  encontrado: boolean;
  nombres?: string;
  apellidos?: string;
  programa?: string;
  facultad?: string;
  semestre?: string;
}

/* ---------------------------------------------------------------------------
   Props compartidas por los campos de formulario
   --------------------------------------------------------------------------- */

export interface PropsCampoBase {
  /** Se usa como `id` del control y como clave en `ErroresFormulario`. */
  name: string;
  etiqueta: string;
  requerido?: boolean;
  /** Texto de apoyo bajo el campo; se oculta mientras haya error. */
  ayuda?: string;
  error?: string;
  deshabilitado?: boolean;
  /**
   * El campo tiene un valor traído de otro sistema y no debe editarse todavía.
   * A diferencia de `deshabilitado`, conserva el contraste del texto y el foco:
   * el dato se lee y se copia, sólo no se cambia.
   */
  soloLectura?: boolean;
  /**
   * El campo acaba de rellenarse solo (consulta por documento). Dispara un
   * anillo breve que se desvanece, para que se note qué cambió sin buscarlo.
   */
  resaltado?: boolean;
  /** Clases para el contenedor del campo (útil para el ancho en la rejilla). */
  className?: string;
}
