/**
 * Catálogos institucionales del área de salud de Bienestar Universitario.
 *
 * Fuente única de las listas desplegables de todos los formularios.
 * Los catálogos cerrados usan `as const` para derivar tipos literales;
 * los que aún deben poblarse se declaran como `readonly string[]`.
 */

export const SEDES = [
  "Sede Norte",
  "Sede Sur",
  "Sede Sameco",
  "Sede Estación 1",
  "Sede Estación 2",
  "Sede Estación 3",
  "Sede Estación 4",
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

/** Programas académicos de la UNIAJC. */
export const PROGRAMAS: readonly string[] = [
  "Administración de Empresas",
  "Contaduría Pública",
  "Mercadeo y Publicidad",
  "Tecnología. Contabilidad Sistematizada",
  "Tecnología. Gestión Empresarial",
  "Diseño Visual",
  "Comunicación Social",
  "Trabajo Social",
  "Ingeniería de Sistemas",
  "Ingeniería en Electrónica",
  "Ingeniería Industrial",
  "Tecnología. Sistemas de Información",
  "Tecnología. Electrónica Industrial",
  "Tecnología. Producción Industrial",
  "Administración en Salud",
  "Administración en Seguridad y Salud en el Trabajo",
  "Licenciatura en Educación Infantil",
  "Licenciatura en Ciencias del Deporte y la Educación Física",
];

/** Facultades académicas de la UNIAJC. */
export const FACULTADES = [
  "Facultad de Ingeniería",
  "Facultad de Ciencias Empresariales",
  "Facultad de Ciencias Sociales y Humanas",
  "Facultad de Educación a Distancia y Virtual",
  "CEFTEL (Centro de Formación Técnica Laboral)",
] as const;

/** Personal de enfermería del área de salud. */
export const ENFERMERAS: readonly string[] = [
  "CIELO ESPERANZA ESCOBAR MAYA",
  "DIANA LUCÍA GÓMEZ GÁLVEZ",
  "ANYELINE COLMENARES",
];

/** Destino al que se remite al estudiante tras un accidente. */
export const TIPOS_REMISION = [
  "Póliza estudiantil",
  "Área protegida",
  "EPS",
  "No requirió remisión",
] as const;

/** Cómo queda el caso al cerrar el registro de accidente. */
export const ESTADOS_CASO = ["Cerrado", "En seguimiento"] as const;

/** Naturaleza de una entrada de la línea de tiempo de seguimiento de un caso. */
export const TIPOS_SEGUIMIENTO = [
  "Evolución 12-24h",
  "Procedimiento quirúrgico",
  "Curación",
  "Retiro de sutura",
  "Retiro de material",
  "Incapacidad / plan ambulatorio",
  "Terapia / rehabilitación",
  "Control con especialista",
  "Contacto con familia",
  "Otro",
] as const;

/** PENDIENTE: cargar los médicos y demás profesionales que atienden consulta. */
export const PROFESIONALES: readonly string[] = [
  "CIELO ESPERANZA ESCOBAR MAYA",
];
