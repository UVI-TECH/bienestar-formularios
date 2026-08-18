import type { ModuloId } from "./modulos";
import type { Formato } from "./types";

export interface FormatoConRuta extends Formato {
  ruta: string;
  /** Módulo del control de acceso que exige la ruta (ver `lib/modulos.ts`). */
  modulo: ModuloId;
}

/**
 * Catálogo de los formatos del área de salud y su ruta en la aplicación.
 *
 * Los códigos provienen del sistema de gestión de calidad (Isolución).
 * Accidente por Póliza Estudiantil es un instrumento nuevo y todavía no tiene
 * código: lleva `sello` en su lugar. Cuando Calidad se lo asigne, reemplace el
 * `sello` por `codigo` y `version` aquí; el resto de la aplicación se adapta.
 */
export const FORMATOS = {
  enfermeria: {
    ruta: "/enfermeria",
    modulo: "enfermeria",
    codigo: "BH-F-013",
    version: "V-1-2018",
    titulo: "Asistencia a Enfermería",
    descripcion:
      "Registro de la atención prestada en el servicio de enfermería y del motivo de consulta.",
  },
  consultaMedica: {
    ruta: "/consulta-medica",
    modulo: "consulta-medica",
    codigo: "BH-F-020",
    version: "V-1-2018",
    titulo: "Consulta Médica",
    descripcion:
      "Registro de la valoración médica general, diagnóstico y conducta indicada.",
  },
  tamizaje: {
    ruta: "/tamizaje",
    modulo: "tamizaje",
    codigo: "BH-F-016",
    version: "V-1-2018",
    titulo: "Tamizaje",
    descripcion:
      "Toma de signos vitales y medidas antropométricas en jornadas de tamizaje.",
  },
  poliza: {
    ruta: "/poliza",
    modulo: "poliza",
    sello: "Formato en definición · Bienestar Universitario",
    titulo: "Accidente por Póliza Estudiantil",
    descripcion:
      "Reporte del accidente y de los datos requeridos para activar la póliza estudiantil.",
  },
  brigadas: {
    ruta: "/brigadas",
    modulo: "brigadas",
    codigo: "BH-F-014",
    version: "V-1-2018",
    titulo: "Asistencia a Brigada de Salud",
    descripcion:
      "Registro de una brigada de salud y de las personas atendidas durante la jornada.",
  },
} as const satisfies Record<string, FormatoConRuta>;

/** Orden en que se presentan los formatos en el índice. */
export const FORMATOS_EN_ORDEN: readonly FormatoConRuta[] = [
  FORMATOS.enfermeria,
  FORMATOS.consultaMedica,
  FORMATOS.tamizaje,
  FORMATOS.poliza,
  FORMATOS.brigadas,
];
