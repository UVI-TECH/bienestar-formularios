/**
 * Utilidades de archivo para la subida de soportes de un caso de póliza
 * (ver `app/poliza/seguimiento/[casoId]/SoportesCaso.tsx`). Corren en el
 * navegador: nombran el archivo, calculan su tamaño legible y lo convierten a
 * base64 antes de enviarlo a `/api/seguimiento/soporte`.
 */

/** Tipos que acepta la subida de soportes: fotos del documento o el PDF mismo. */
export function esTipoAceptado(tipo: string): boolean {
  return tipo.startsWith("image/") || tipo === "application/pdf";
}

/**
 * `true` cuando el `tipo` de un soporte ya subido (columna del flujo de
 * lectura, no siempre un MIME exacto) corresponde a una imagen — para elegir
 * el ícono en la lista de soportes cargados.
 */
export function esTipoImagen(tipo: string): boolean {
  const valor = tipo.toLowerCase();
  return valor.startsWith("image") || valor.includes("imagen");
}

/** Un PDF no se comprime: por encima de esto, se rechaza antes de subir. */
export const LIMITE_PDF_BYTES = 4 * 1024 * 1024;

/** Objetivo de compresión de imágenes (ver `comprimirImagen`). */
export const COMPRESION_IMAGEN = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1600,
  initialQuality: 0.8,
  useWebWorker: true,
} as const;

/**
 * `"Fórmula médica (2).pdf"` → `"formula-medica-2.pdf"`: sin tildes, espacios
 * ni paréntesis, para que el nombre viaje limpio en la carpeta de OneDrive.
 */
export function sanearNombreArchivo(nombreOriginal: string): string {
  const puntoFinal = nombreOriginal.lastIndexOf(".");
  const tieneExtension = puntoFinal > 0 && puntoFinal < nombreOriginal.length - 1;
  const base = tieneExtension ? nombreOriginal.slice(0, puntoFinal) : nombreOriginal;
  const extension = tieneExtension ? nombreOriginal.slice(puntoFinal + 1) : "";

  const baseSaneada =
    base
      .normalize("NFD")
      // Marcas diacríticas combinantes (U+0300–U+036F): lo que separa la
      // tilde de la letra tras normalizar en NFD.
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "soporte";

  const extensionSaneada = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  return extensionSaneada ? `${baseSaneada}.${extensionSaneada}` : baseSaneada;
}

/**
 * Nombre único del soporte: `{caso_id}_{timestamp}_{nombre-saneado}`, p. ej.
 * `AP-2026-4YTBSR_1730900000_incapacidad.pdf`. El timestamp evita que dos
 * soportes del mismo caso se sobrescriban en la carpeta de OneDrive.
 */
export function construirNombreSoporte(
  casoId: string,
  nombreOriginal: string,
  referencia: Date = new Date(),
): string {
  const timestamp = Math.floor(referencia.getTime() / 1000);
  return `${casoId}_${timestamp}_${sanearNombreArchivo(nombreOriginal)}`;
}

/** `1_536_000` → `"1.5 MB"`; por debajo de 1 MB, en KB sin decimales. */
export function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Un archivo (ya comprimido, si era imagen) a base64 SIN el prefijo `data:...;base64,`. */
export function archivoABase64(archivo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = lector.result;
      if (typeof resultado !== "string") {
        reject(new Error("No fue posible leer el archivo."));
        return;
      }
      const separador = resultado.indexOf(",");
      resolve(separador === -1 ? resultado : resultado.slice(separador + 1));
    };
    lector.onerror = () => reject(lector.error ?? new Error("No fue posible leer el archivo."));
    lector.readAsDataURL(archivo);
  });
}
