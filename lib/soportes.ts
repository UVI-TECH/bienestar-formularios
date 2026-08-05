import "server-only";

/**
 * Subida y lectura de soportes de un caso de póliza estudiantil
 * (incapacidades, fórmulas, historia clínica, radiografías…), vía Power
 * Automate. Sólo se usa desde `app/api/seguimiento/soporte/route.ts`.
 *
 * Para subir, el archivo ya llega comprimido y en base64 desde el navegador
 * (ver `lib/archivos.ts`); acá sólo se reenvía al flujo. Para leer, la forma
 * exacta de la respuesta no está confirmada contra el flujo real — igual que
 * en `lib/casos.ts` y `lib/personas.ts`, se admiten las mismas envolturas
 * plausibles (`{ value: [...] }`, `{ valor: [...] }` o el arreglo directo).
 */

export class ErrorSoportes extends Error {}

export interface NuevoSoporte {
  casoId: string;
  documento: string;
  nombres: string;
  apellidos: string;
  periodo: string;
  nombreArchivo: string;
  contenidoBase64: string;
  /** Quien sube el soporte (la sesión), no el estudiante del caso. */
  subidoPor: string;
}

/**
 * El flujo escribe el archivo en OneDrive; con la carpeta del caso por crear
 * y un contenido en base64 de hasta unos pocos MB, 8 s (el límite del resto
 * de flujos) se queda corto.
 */
const TIEMPO_LIMITE_MS = 25_000;

export async function subirSoporte(datos: NuevoSoporte): Promise<void> {
  const url = process.env.PA_URL_SUBIR_SOPORTE;
  if (!url) throw new ErrorSoportes("Falta configurar PA_URL_SUBIR_SOPORTE.");

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        caso_id: datos.casoId,
        documento: datos.documento,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        periodo: datos.periodo,
        nombre_archivo: datos.nombreArchivo,
        contenido_base64: datos.contenidoBase64,
        subido_por: datos.subidoPor,
      }),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
      cache: "no-store",
    });
  } catch (causa) {
    throw new ErrorSoportes(
      causa instanceof Error && causa.name === "TimeoutError"
        ? "El servicio de soportes no respondió a tiempo."
        : "No fue posible contactar el servicio de soportes.",
    );
  }

  if (!respuesta.ok) {
    // El cuerpo de la respuesta (si el flujo lo manda) trae el motivo real del
    // rechazo — típicamente un error de validación del esquema del disparador
    // HTTP de Power Automate — y sólo se ve en el log del servidor, nunca
    // llega al navegador (la ruta de API sólo devuelve 502 genérico).
    const detalle = await respuesta.text().catch(() => "");
    throw new ErrorSoportes(
      `El servicio de soportes respondió ${respuesta.status}.${detalle ? ` Detalle: ${detalle.slice(0, 500)}` : ""}`,
    );
  }
}

/* ---------------------------------------------------------------------------
   Lectura — soportes ya subidos de un caso
   --------------------------------------------------------------------------- */

interface FilaSoporte {
  caso_id?: unknown;
  nombre_archivo?: unknown;
  tipo?: unknown;
  url_web?: unknown;
  subido_por?: unknown;
  fecha?: unknown;
}

export interface Soporte {
  casoId: string;
  nombreArchivo: string;
  tipo: string;
  urlWeb: string;
  subidoPor: string;
  fecha: string;
}

function limpiar(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function extraerFilas(carga: unknown): unknown[] {
  if (Array.isArray(carga)) return carga;
  if (carga && typeof carga === "object") {
    const sobre = carga as { value?: unknown; valor?: unknown };
    if (Array.isArray(sobre.value)) return sobre.value;
    if (Array.isArray(sobre.valor)) return sobre.valor;
  }
  return [];
}

function mapearSoporte(fila: unknown): Soporte | undefined {
  if (!fila || typeof fila !== "object") return undefined;
  const f = fila as FilaSoporte;

  const nombreArchivo = limpiar(f.nombre_archivo);
  const urlWeb = limpiar(f.url_web);
  if (!nombreArchivo || !urlWeb) return undefined;

  return {
    casoId: limpiar(f.caso_id),
    nombreArchivo,
    tipo: limpiar(f.tipo),
    urlWeb,
    subidoPor: limpiar(f.subido_por),
    fecha: limpiar(f.fecha),
  };
}

/**
 * Es una lectura, no una escritura: mismo tiempo límite que el resto de
 * flujos de sólo lectura del proyecto (`lib/casos.ts`, `lib/personas.ts`).
 */
const TIEMPO_LIMITE_LECTURA_MS = 8_000;

/** Soportes ya subidos de un caso, tal como los devuelve el flujo (sin orden garantizado). */
export async function leerSoportes(casoId: string): Promise<Soporte[]> {
  const url = process.env.PA_URL_LEER_SOPORTES;
  if (!url) throw new ErrorSoportes("Falta configurar PA_URL_LEER_SOPORTES.");

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ caso_id: casoId }),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_LECTURA_MS),
      cache: "no-store",
    });
  } catch (causa) {
    throw new ErrorSoportes(
      causa instanceof Error && causa.name === "TimeoutError"
        ? "El servicio de soportes no respondió a tiempo."
        : "No fue posible contactar el servicio de soportes.",
    );
  }

  if (!respuesta.ok) {
    throw new ErrorSoportes(`El servicio de soportes respondió ${respuesta.status}.`);
  }

  let carga: unknown;
  try {
    carga = await respuesta.json();
  } catch {
    throw new ErrorSoportes("El servicio de soportes devolvió una respuesta ilegible.");
  }

  return extraerFilas(carga)
    .map(mapearSoporte)
    .filter((soporte): soporte is Soporte => Boolean(soporte));
}
