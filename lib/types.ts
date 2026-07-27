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
  nombreCompleto: string;
  tipoPersona: Opcional<TipoPersona>;
  programa: Programa;
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

/** Encabezado documental de cada formulario, p. ej. `BH-F-013 · V-1-2018`. */
export interface Formato {
  codigo: string;
  version: string;
  titulo: string;
  descripcion?: string;
}

/* ---------------------------------------------------------------------------
   Envío y validación
   --------------------------------------------------------------------------- */

export type EstadoEnvio = "inactivo" | "enviando" | "exito" | "error";

/** Errores por campo: la clave es el `name` del campo. */
export type ErroresFormulario = Record<string, string>;

/* ---------------------------------------------------------------------------
   Consulta de persona por cédula (/api/lookup)
   --------------------------------------------------------------------------- */

export interface RespuestaConsultaCedula {
  encontrado: boolean;
  persona?: Partial<DatosPersona>;
  mensaje?: string;
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
  /** Clases para el contenedor del campo (útil para el ancho en la rejilla). */
  className?: string;
}
