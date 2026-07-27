/**
 * Limitador de tasa por ventana fija, en memoria del proceso.
 *
 * TODO(producción): migrar a Upstash Redis (`@upstash/ratelimit` +
 * `@upstash/redis`). Este contador vive en la memoria de una sola instancia,
 * así que:
 *   - se reinicia en cada despliegue y en cada arranque en frío;
 *   - en un despliegue con varias instancias o en funciones serverless, cada
 *     una lleva su propia cuenta, y el límite real acaba siendo N veces el
 *     configurado.
 * Sirve para desarrollo y para un despliegue de una sola instancia; no es una
 * defensa seria contra abuso.
 */

interface Ventana {
  conteo: number;
  expiraEn: number;
}

const ventanas = new Map<string, Ventana>();

/** Evita que el mapa crezca sin límite si aparecen muchas IP distintas. */
const MAXIMO_CLAVES = 10_000;

function purgarVencidas(ahora: number): void {
  for (const [clave, ventana] of ventanas) {
    if (ventana.expiraEn <= ahora) ventanas.delete(clave);
  }
}

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  /** Segundos que faltan para que la ventana se reinicie. */
  reintentarEn: number;
}

export function consumirCupo(
  clave: string,
  maximo: number,
  ventanaMs: number,
): ResultadoLimite {
  const ahora = Date.now();

  if (ventanas.size > MAXIMO_CLAVES) purgarVencidas(ahora);

  const actual = ventanas.get(clave);

  if (!actual || actual.expiraEn <= ahora) {
    ventanas.set(clave, { conteo: 1, expiraEn: ahora + ventanaMs });
    return { permitido: true, restantes: maximo - 1, reintentarEn: 0 };
  }

  const reintentarEn = Math.ceil((actual.expiraEn - ahora) / 1000);

  if (actual.conteo >= maximo) {
    return { permitido: false, restantes: 0, reintentarEn };
  }

  actual.conteo += 1;
  return { permitido: true, restantes: maximo - actual.conteo, reintentarEn };
}

/**
 * IP de origen a partir de las cabeceras del proxy.
 * Se toma la primera entrada de `x-forwarded-for`, que es la del cliente.
 */
export function ipDeSolicitud(cabeceras: Headers): string {
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) {
    const primera = reenviada.split(",")[0]?.trim();
    if (primera) return primera;
  }
  return cabeceras.get("x-real-ip")?.trim() || "desconocida";
}
