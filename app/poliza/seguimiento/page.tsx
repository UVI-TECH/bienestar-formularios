import type { Metadata } from "next";
import { ErrorCasos, leerCasos } from "@/lib/casos";
import ListaCasos from "./ListaCasos";

export const metadata: Metadata = {
  title: "Seguimiento de casos",
};

export default async function SeguimientoCasosPagina() {
  let casos: Awaited<ReturnType<typeof leerCasos>> = [];
  let error = "";

  try {
    casos = await leerCasos();
  } catch (causa) {
    console.error(
      "[poliza/seguimiento] fallo al leer los casos:",
      causa instanceof ErrorCasos ? causa.message : causa,
    );
    error = "No fue posible cargar los casos. Intente de nuevo en un momento.";
  }

  return <ListaCasos casos={casos} error={error} />;
}
