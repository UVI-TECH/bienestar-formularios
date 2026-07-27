import type { Formato } from "./types";

export interface FormatoConRuta extends Formato {
  ruta: string;
}

/**
 * Catálogo de los formatos del área de salud y su ruta en la aplicación.
 *
 * PENDIENTE: sólo el código de Asistencia a Enfermería (BH-F-013 · V-1-2018)
 * está confirmado. Los otros tres son marcadores de posición; reemplácelos por
 * los códigos y versiones reales del sistema de gestión de calidad.
 */
export const FORMATOS = {
  enfermeria: {
    ruta: "/enfermeria",
    codigo: "BH-F-013",
    version: "V-1-2018",
    titulo: "Asistencia a Enfermería",
    descripcion:
      "Registro de la atención prestada en el servicio de enfermería y del motivo de consulta.",
  },
  consultaMedica: {
    ruta: "/consulta-medica",
    codigo: "BH-F-014",
    version: "V-1-2018",
    titulo: "Consulta Médica",
    descripcion:
      "Registro de la valoración médica general, diagnóstico y conducta indicada.",
  },
  tamizaje: {
    ruta: "/tamizaje",
    codigo: "BH-F-015",
    version: "V-1-2018",
    titulo: "Tamizaje",
    descripcion:
      "Toma de signos vitales y medidas antropométricas en jornadas de tamizaje.",
  },
  poliza: {
    ruta: "/poliza",
    codigo: "BH-F-016",
    version: "V-1-2018",
    titulo: "Accidente por Póliza Estudiantil",
    descripcion:
      "Reporte del accidente y de los datos requeridos para activar la póliza estudiantil.",
  },
} as const satisfies Record<string, FormatoConRuta>;

/** Orden en que se presentan los formatos en el índice. */
export const FORMATOS_EN_ORDEN: readonly FormatoConRuta[] = [
  FORMATOS.enfermeria,
  FORMATOS.consultaMedica,
  FORMATOS.tamizaje,
  FORMATOS.poliza,
];
