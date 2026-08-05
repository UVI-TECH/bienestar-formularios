import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorCasos, leerCasos, leerSeguimientos } from "@/lib/casos";
import { obtenerSesion } from "@/lib/sesion";
import CabeceraAtencion from "./CabeceraAtencion";
import LineaTiempoSeguimientos from "./LineaTiempoSeguimientos";
import SoportesCaso from "./SoportesCaso";

export const metadata: Metadata = {
  title: "Detalle del caso",
};

interface Props {
  params: Promise<{ casoId: string }>;
}

export default async function DetalleCasoPagina({ params }: Props) {
  const { casoId } = await params;
  const sesion = await obtenerSesion();

  let casos: Awaited<ReturnType<typeof leerCasos>> = [];
  try {
    casos = await leerCasos();
  } catch (causa) {
    console.error(
      "[poliza/seguimiento] fallo al leer los casos:",
      causa instanceof ErrorCasos ? causa.message : causa,
    );
  }

  const atencion = casos.find((caso) => caso.casoId === casoId);
  if (!atencion) notFound();

  let seguimientos: Awaited<ReturnType<typeof leerSeguimientos>> = [];
  let errorSeguimientos = "";
  try {
    seguimientos = await leerSeguimientos(casoId);
  } catch (causa) {
    console.error(
      "[poliza/seguimiento] fallo al leer los seguimientos:",
      causa instanceof ErrorCasos ? causa.message : causa,
    );
    errorSeguimientos =
      "No fue posible cargar los seguimientos. Intente de nuevo en un momento.";
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/poliza/seguimiento"
        className="mb-5 inline-flex items-center gap-1.5 rounded-chip text-ayuda text-texto-medio transition-colors hover:text-inst-700"
      >
        <span aria-hidden>←</span>
        Volver a los casos
      </Link>

      <CabeceraAtencion atencion={atencion} />

      <SoportesCaso
        casoId={casoId}
        documento={atencion.cedula}
        nombres={atencion.nombres}
        apellidos={atencion.apellidos}
      />

      {errorSeguimientos ? (
        <p className="mt-8 text-cuerpo text-error-700">{errorSeguimientos}</p>
      ) : (
        <LineaTiempoSeguimientos
          casoId={casoId}
          estadoInicial={atencion.estado}
          seguimientosIniciales={seguimientos}
          registradoPor={sesion ? `${sesion.nombres} ${sesion.apellidos}`.trim() : ""}
        />
      )}
    </div>
  );
}
