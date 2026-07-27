/**
 * Catálogos institucionales del área de salud de Bienestar Universitario.
 *
 * Fuente única de las listas desplegables de todos los formularios.
 * Los catálogos cerrados usan `as const` para derivar tipos literales;
 * los que aún deben poblarse se declaran como `readonly string[]`.
 */

export const SEDES = [
  "Sede Principal",
  "Sede Sur",
  "Sede Estación",
] as const;

export const TIPOS_PERSONA = [
  "Estudiante",
  "Administrativo",
  "Docente",
  "Otro",
] as const;

export const SEXO = ["Femenino", "Masculino"] as const;

export const SEMESTRES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
] as const;

/** PENDIENTE: cargar los programas académicos de la UNIAJC. */
export const PROGRAMAS: readonly string[] = [];

/** PENDIENTE: cargar el personal de enfermería del área de salud. */
export const ENFERMERAS: readonly string[] = [];
