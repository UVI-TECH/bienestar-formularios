/**
 * Reglas de validación compartidas. Cada función devuelve el mensaje de error
 * en español o `undefined` si el valor es válido, para poder componerlas:
 *
 *   const errores = limpiarErrores({
 *     cedula: validarCedula(datos.cedula),
 *     sede: requerido(datos.sede, "la sede"),
 *   })
 */

export const CEDULA_MIN = 6;
export const CEDULA_MAX = 12;

/** Deja sólo dígitos y recorta al máximo permitido. Para usar en `onChange`. */
export function normalizarCedula(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, CEDULA_MAX);
}

export function validarCedula(valor: string): string | undefined {
  if (!valor) return "Ingrese el número de documento.";
  if (!/^\d+$/.test(valor)) return "El documento sólo admite números.";
  if (valor.length < CEDULA_MIN || valor.length > CEDULA_MAX) {
    return `El documento debe tener entre ${CEDULA_MIN} y ${CEDULA_MAX} dígitos.`;
  }
  return undefined;
}

/** `true` cuando la cédula está completa; habilita el botón "Buscar". */
export function cedulaConsultable(valor: string): boolean {
  return validarCedula(valor) === undefined;
}

export function requerido(valor: string, campo: string): string | undefined {
  return valor.trim() ? undefined : `Seleccione o ingrese ${campo}.`;
}

export function validarCorreo(valor: string): string | undefined {
  if (!valor) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)
    ? undefined
    : "Ingrese un correo electrónico válido.";
}

export function validarTelefono(valor: string): string | undefined {
  if (!valor) return undefined;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 10
    ? undefined
    : "Ingrese un teléfono de 7 a 10 dígitos.";
}

export function validarEdad(valor: string): string | undefined {
  if (!valor) return undefined;
  const edad = Number(valor);
  return Number.isInteger(edad) && edad >= 0 && edad <= 120
    ? undefined
    : "Ingrese una edad válida.";
}

/** Descarta las entradas `undefined` para obtener sólo los errores reales. */
export function limpiarErrores(
  candidatos: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(candidatos).filter(([, mensaje]) => Boolean(mensaje)),
  ) as Record<string, string>;
}
