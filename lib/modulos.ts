/**
 * Módulos del control de acceso por persona.
 *
 * El "quién puede ver qué" se administra a mano en la tabla Personas de un
 * Excel externo (columna `modulos`, ids separados por coma); acá sólo se fija
 * el catálogo de ids válidos, para no aceptar basura de esa columna.
 */
export const MODULOS = [
  "enfermeria",
  "consulta-medica",
  "tamizaje",
  "poliza",
  "planificacion",
  "seguimiento",
  "admin",
] as const;

export type ModuloId = (typeof MODULOS)[number];

/** Nombre legible de cada módulo, para chips y listas en el panel de administración. */
export const ETIQUETAS_MODULO: Record<ModuloId, string> = {
  enfermeria: "Enfermería",
  "consulta-medica": "Consulta médica",
  tamizaje: "Tamizaje",
  poliza: "Póliza",
  planificacion: "Planificación",
  seguimiento: "Seguimiento",
  admin: "Administración",
};

export function esModuloId(valor: string): valor is ModuloId {
  return (MODULOS as readonly string[]).includes(valor);
}

/** "admin" ve todo: cualquier módulo que se le pida lo tiene por implicación. */
export function tieneModulo(
  modulos: readonly ModuloId[],
  requerido: ModuloId,
): boolean {
  return modulos.includes("admin") || modulos.includes(requerido);
}
