"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Girador from "@/components/ui/Girador";
import IconoCheck from "@/components/ui/IconoCheck";
import {
  archivoABase64,
  COMPRESION_IMAGEN,
  construirNombreSoporte,
  esTipoAceptado,
  esTipoImagen,
  formatearTamano,
  LIMITE_PDF_BYTES,
} from "@/lib/archivos";
import { cn } from "@/lib/cn";
import { fechaHoraLegible, periodoActual } from "@/lib/fechas";
import { variantesListaContenedor, variantesListaItem } from "@/lib/motion";

interface Props {
  casoId: string;
  documento: string;
  nombres: string;
  apellidos: string;
}

type EstadoSoporte = "comprimiendo" | "subiendo" | "exito" | "error";

interface ItemSoporte {
  id: string;
  archivo: File;
  nombreOriginal: string;
  previewUrl?: string;
  estado: EstadoSoporte;
  tamanoFinal?: number;
  mensajeError?: string;
}

/** Un soporte ya subido, tal como lo devuelve `GET /api/seguimiento/soporte`. */
interface SoporteSubido {
  nombreArchivo: string;
  tipo: string;
  urlWeb: string;
  subidoPor: string;
  fecha: string;
}

const MENSAJE_ERROR_LISTA = "No fue posible cargar los soportes. Intente de nuevo en un momento.";

const MENSAJE_TIPO_INVALIDO = "Tipo de archivo no permitido. Solo imágenes o PDF.";
const MENSAJE_PDF_GRANDE =
  "El archivo supera el límite de 4 MB. Comprímelo o divídelo antes de subir.";

const MENSAJES_SUBIDA: Record<number, string> = {
  400: "El soporte no pudo procesarse. Intente de nuevo.",
  401: "Su sesión expiró. Vuelva a ingresar para continuar.",
  403: "Su usuario no tiene permiso para subir soportes.",
  429: "Se subieron demasiados archivos seguidos. Espere un momento e intente de nuevo.",
  502: "El servicio de soportes no está disponible en este momento.",
};

const MENSAJE_GENERICO = "No fue posible subir el soporte. Intente de nuevo.";

function crearId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function SoportesCaso({ casoId, documento, nombres, apellidos }: Props) {
  const [items, setItems] = useState<ItemSoporte[]>([]);
  const [soportesSubidos, setSoportesSubidos] = useState<SoporteSubido[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState("");
  const inputAdjuntarRef = useRef<HTMLInputElement>(null);
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  const urlsCreadas = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      // El arreglo crece mientras el usuario adjunta soportes: hay que leer
      // `.current` en el momento del desmontaje, no copiarlo aquí (todavía vacío).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      urlsCreadas.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /**
   * `silencioso` se usa tras subir un soporte nuevo: refresca la lista para
   * que aparezca con su `urlWeb` real sin mostrar el estado de carga (que
   * haría parpadear la lista ya visible) ni un error si esa recarga falla
   * — el soporte ya quedó subido, sólo falta reflejarlo, y se verá en la
   * próxima carga de la página si esta recarga puntual no responde.
   */
  async function cargarSoportes(silencioso = false) {
    try {
      const respuesta = await fetch(
        `/api/seguimiento/soporte?caso_id=${encodeURIComponent(casoId)}`,
        { cache: "no-store" },
      );
      if (!respuesta.ok) throw new Error(MENSAJE_ERROR_LISTA);
      const cuerpo = (await respuesta.json()) as { ok: boolean; soportes?: SoporteSubido[] };
      if (!cuerpo.ok || !cuerpo.soportes) throw new Error(MENSAJE_ERROR_LISTA);
      setSoportesSubidos(cuerpo.soportes);
      setErrorLista("");
    } catch (error) {
      if (!silencioso) {
        setErrorLista(error instanceof Error ? error.message : MENSAJE_ERROR_LISTA);
      }
    } finally {
      if (!silencioso) setCargandoLista(false);
    }
  }

  useEffect(() => {
    (async () => {
      await cargarSoportes();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casoId]);

  function actualizarItem(id: string, cambios: Partial<ItemSoporte>) {
    setItems((previos) =>
      previos.map((item) => (item.id === id ? { ...item, ...cambios } : item)),
    );
  }

  async function subirItem(id: string, archivo: File) {
    const esImagen = archivo.type.startsWith("image/");

    try {
      let archivoFinal: File | Blob = archivo;

      if (esImagen) {
        actualizarItem(id, { estado: "comprimiendo" });
        const imageCompression = (await import("browser-image-compression")).default;
        archivoFinal = await imageCompression(archivo, COMPRESION_IMAGEN);
      }

      actualizarItem(id, { estado: "subiendo" });

      const contenidoBase64 = await archivoABase64(archivoFinal);
      const nombreArchivo = construirNombreSoporte(casoId, archivo.name);

      const respuesta = await fetch("/api/seguimiento/soporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caso_id: casoId,
          documento,
          nombres,
          apellidos,
          periodo: periodoActual(),
          nombre_archivo: nombreArchivo,
          contenido_base64: contenidoBase64,
        }),
      });

      if (!respuesta.ok) {
        throw new Error(MENSAJES_SUBIDA[respuesta.status] ?? MENSAJE_GENERICO);
      }

      actualizarItem(id, { estado: "exito", tamanoFinal: archivoFinal.size });
      // Refresca la lista de soportes ya subidos para que éste aparezca de
      // inmediato, con su enlace real a OneDrive — sin recargar la página.
      void cargarSoportes(true);
    } catch (error) {
      actualizarItem(id, {
        estado: "error",
        mensajeError: error instanceof Error ? error.message : MENSAJE_GENERICO,
      });
    }
  }

  function agregarArchivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return;

    for (const archivo of Array.from(lista)) {
      const id = crearId();
      const esImagen = archivo.type.startsWith("image/");
      const previewUrl = esImagen ? URL.createObjectURL(archivo) : undefined;
      if (previewUrl) urlsCreadas.current.push(previewUrl);

      if (!esTipoAceptado(archivo.type)) {
        setItems((previos) => [
          ...previos,
          {
            id,
            archivo,
            nombreOriginal: archivo.name,
            previewUrl,
            estado: "error",
            mensajeError: MENSAJE_TIPO_INVALIDO,
          },
        ]);
        continue;
      }

      if (!esImagen && archivo.size > LIMITE_PDF_BYTES) {
        setItems((previos) => [
          ...previos,
          {
            id,
            archivo,
            nombreOriginal: archivo.name,
            estado: "error",
            mensajeError: MENSAJE_PDF_GRANDE,
          },
        ]);
        continue;
      }

      setItems((previos) => [
        ...previos,
        {
          id,
          archivo,
          nombreOriginal: archivo.name,
          previewUrl,
          estado: esImagen ? "comprimiendo" : "subiendo",
        },
      ]);
      void subirItem(id, archivo);
    }
  }

  function reintentar(item: ItemSoporte) {
    actualizarItem(item.id, {
      estado: item.archivo.type.startsWith("image/") ? "comprimiendo" : "subiendo",
      mensajeError: undefined,
    });
    void subirItem(item.id, item.archivo);
  }

  return (
    <section className="mt-8 rounded-tarjeta border border-borde bg-superficie p-6 shadow-tarjeta sm:p-8">
      <div>
        <h2 className="font-display text-subtitulo font-semibold text-texto">Soportes</h2>
        <p className="mt-1 text-ayuda text-texto-medio">
          Incapacidades, fórmulas, historia clínica, radiografías y demás documentos de
          la reclamación ante la aseguradora.
        </p>
      </div>

      {cargandoLista ? (
        <p className="mt-5 flex items-center gap-2 text-ayuda text-texto-tenue">
          <Girador />
          Cargando soportes…
        </p>
      ) : errorLista ? (
        <p className="mt-5 text-ayuda text-error-700">{errorLista}</p>
      ) : soportesSubidos.length === 0 ? (
        <p className="mt-5 text-ayuda text-texto-tenue">Sin soportes cargados.</p>
      ) : (
        <motion.ul
          variants={variantesListaContenedor}
          initial="oculto"
          animate="visible"
          className="mt-5 space-y-2"
        >
          {soportesSubidos.map((soporte) => (
            <FilaSoporteSubido key={`${soporte.nombreArchivo}-${soporte.fecha}`} soporte={soporte} />
          ))}
        </motion.ul>
      )}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-borde pt-6">
        <label className="boton-secundario cursor-pointer">
          <IconoAdjuntar />
          Adjuntar archivo
          <input
            ref={inputAdjuntarRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="sr-only"
            onChange={(evento) => {
              agregarArchivos(evento.target.files);
              evento.target.value = "";
            }}
          />
        </label>

        {/* La cámara trasera sólo tiene sentido en un dispositivo móvil: en
            escritorio, `capture` se ignora y este botón duplicaría al de
            arriba, así que se oculta desde el punto de quiebre `sm`. */}
        <label className="boton-secundario cursor-pointer sm:hidden">
          <IconoCamara />
          Tomar foto
          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(evento) => {
              agregarArchivos(evento.target.files);
              evento.target.value = "";
            }}
          />
        </label>
      </div>

      <p className="mt-2 text-meta text-texto-tenue">
        Imágenes o PDF de hasta 4 MB. Las fotos se optimizan automáticamente antes de
        subir.
      </p>

      {items.length === 0 ? (
        <p className="mt-6 text-ayuda text-texto-tenue">
          Todavía no se han adjuntado soportes.
        </p>
      ) : (
        <motion.ul
          variants={variantesListaContenedor}
          initial="oculto"
          animate="visible"
          className="mt-6 space-y-2"
        >
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <FilaSoporte key={item.id} item={item} onReintentar={() => reintentar(item)} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </section>
  );
}

function FilaSoporteSubido({ soporte }: { soporte: SoporteSubido }) {
  return (
    <motion.li variants={variantesListaItem} initial="oculto" animate="visible">
      <a
        href={soporte.urlWeb}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-campo border border-borde bg-superficie-tenue px-4 py-3 transition-colors hover:border-inst-300 hover:bg-inst-50"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-chip border border-borde bg-superficie text-texto-tenue">
          {esTipoImagen(soporte.tipo) ? <IconoImagen /> : <IconoDocumento />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-ayuda font-medium text-texto">{soporte.nombreArchivo}</p>
          <p className="mt-0.5 truncate text-meta text-texto-tenue">
            {[soporte.subidoPor, fechaHoraLegible(soporte.fecha)].filter(Boolean).join(" · ")}
          </p>
        </div>

        <span aria-hidden className="shrink-0 text-inst-400">
          <IconoAbrir />
        </span>
      </a>
    </motion.li>
  );
}

function FilaSoporte({
  item,
  onReintentar,
}: {
  item: ItemSoporte;
  onReintentar: () => void;
}) {
  const enProceso = item.estado === "comprimiendo" || item.estado === "subiendo";

  return (
    <motion.li
      layout
      variants={variantesListaItem}
      initial="oculto"
      animate="visible"
      exit="oculto"
      className="flex items-center gap-3 rounded-campo border border-borde bg-superficie-tenue px-4 py-3"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-chip border border-borde bg-superficie">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (object URL), no un recurso remoto que Next deba optimizar.
          <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <IconoDocumento className="text-texto-tenue" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-ayuda font-medium text-texto">{item.nombreOriginal}</p>
        <p
          className={cn(
            "mt-0.5 text-meta",
            item.estado === "error" ? "text-error-700" : "text-texto-tenue",
          )}
        >
          {item.estado === "comprimiendo" && "Optimizando imagen…"}
          {item.estado === "subiendo" && "Subiendo…"}
          {item.estado === "exito" &&
            `Subido · ${formatearTamano(item.tamanoFinal ?? item.archivo.size)}`}
          {item.estado === "error" && item.mensajeError}
        </p>
      </div>

      <div className="shrink-0">
        {enProceso && <Girador className="text-texto-tenue" />}
        {item.estado === "exito" && (
          <IconoCheck className="h-5 w-5 text-exito-600" />
        )}
        {item.estado === "error" && (
          <button
            type="button"
            onClick={onReintentar}
            className="rounded-chip text-ayuda font-medium text-inst-700 underline-offset-2 hover:underline"
          >
            Reintentar
          </button>
        )}
      </div>
    </motion.li>
  );
}

function IconoAdjuntar({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M11.2 4.3 6 9.5a1.8 1.8 0 1 0 2.55 2.55L13.5 7a3.3 3.3 0 1 0-4.67-4.67L3.9 7.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoCamara({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M2 5.6A1.4 1.4 0 0 1 3.4 4.2h1.1l.6-1.1a1 1 0 0 1 .9-.6h4a1 1 0 0 1 .9.6l.6 1.1h1.1A1.4 1.4 0 0 1 14 5.6v5.8a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 11.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8.2" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconoDocumento({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-5 w-5", className)}>
      <path
        d="M4 1.7h5.2L12 4.5v9.8a.6.6 0 0 1-.6.6H4.6a.6.6 0 0 1-.6-.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M9.2 1.7v2.8H12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

function IconoImagen({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-5 w-5", className)}>
      <rect
        x="1.7"
        y="2.7"
        width="12.6"
        height="10.6"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="5.3" cy="6" r="1.1" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="m2.3 11.3 3.4-3.4 2.1 2.1 2.4-2.7 3.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoAbrir({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("h-4 w-4", className)}>
      <path
        d="M6.3 3.3h6.4v6.4M12.5 3.5 3.3 12.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
