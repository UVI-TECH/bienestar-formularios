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

/* ---------------------------------------------------------------------------
   Medidas de tamizaje
   --------------------------------------------------------------------------- */

interface OpcionesRango {
  minimo: number;
  maximo: number;
  /** Cómo nombrar el dato en el mensaje, p. ej. "el peso en kilogramos". */
  campo: string;
  unidad?: string;
  /** Rechaza decimales. */
  entero?: boolean;
  /** Máximo de cifras decimales admitidas. */
  decimales?: number;
  /** El campo puede quedar vacío; si trae valor, igual debe cumplir el rango. */
  opcional?: boolean;
}

/** Valida un número dentro de un rango. Un valor vacío se considera ausente. */
export function validarRango(
  valor: string,
  { minimo, maximo, campo, unidad = "", entero, decimales, opcional }: OpcionesRango,
): string | undefined {
  if (!valor.trim()) return opcional ? undefined : `Ingrese ${campo}.`;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return `Ingrese ${campo} en números.`;
  if (entero && !Number.isInteger(numero)) {
    return `Ingrese ${campo} sin decimales.`;
  }
  if (decimales !== undefined) {
    const escritos = valor.split(".")[1]?.length ?? 0;
    if (escritos > decimales) {
      return decimales === 1
        ? "Use como máximo un decimal."
        : `Use como máximo ${decimales} decimales.`;
    }
  }
  if (numero < minimo || numero > maximo) {
    const sufijo = unidad ? ` ${unidad}` : "";
    return `El valor debe estar entre ${minimo}${sufijo} y ${maximo}${sufijo}.`;
  }
  return undefined;
}

/**
 * Máscara de tensión arterial: dígitos y una sola barra, hasta 3 cifras de
 * sistólica y 2 de diastólica.
 *
 * Si quien registra escribe la barra, se respeta dónde la puso, de modo que
 * `90/60` se captura tal cual. Si no la escribe, se inserta después del tercer
 * dígito, que es el caso corriente (`12080` → `120/80`). Una sistólica de dos
 * cifras escrita de corrido queda mal partida (`9060` → `906/0`), pero se ve
 * en pantalla y se corrige tecleando la barra; es preferible a descartar
 * dígitos en silencio.
 */
export function normalizarTension(valor: string): string {
  const limpio = valor.replace(/[^\d/]/g, "");
  const barra = limpio.indexOf("/");

  if (barra === -1) {
    const digitos = limpio.slice(0, 5);
    return digitos.length <= 3
      ? digitos
      : `${digitos.slice(0, 3)}/${digitos.slice(3)}`;
  }

  const sistolica = limpio.slice(0, barra).slice(0, 3);
  const diastolica = limpio.slice(barra + 1).replace(/\//g, "").slice(0, 2);
  return `${sistolica}/${diastolica}`;
}

export function validarTension(valor: string): string | undefined {
  if (!valor.trim()) return "Ingrese la tensión arterial.";
  return /^\d{2,3}\/\d{2}$/.test(valor)
    ? undefined
    : "Use el formato sistólica/diastólica, por ejemplo 120/80.";
}

/** Descarta las entradas `undefined` para obtener sólo los errores reales. */
export function limpiarErrores(
  candidatos: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(candidatos).filter(([, mensaje]) => Boolean(mensaje)),
  ) as Record<string, string>;
}
