"use client";

import { useCallback, useMemo, useState } from "react";
import CampoFecha from "@/components/forms/CampoFecha";
import CampoHora from "@/components/forms/CampoHora";
import CampoTexto from "@/components/forms/CampoTexto";
import FormularioBase from "@/components/forms/FormularioBase";
import RejillaCampos from "@/components/forms/RejillaCampos";
import ResumenRegistro from "@/components/forms/ResumenRegistro";
import SeccionFormulario from "@/components/forms/SeccionFormulario";
import { sinErrores } from "@/components/forms/utilidades";
import { enviarActividad } from "@/lib/enviarActividad";
import { fechaLegible, horaLegible } from "@/lib/fechas";
import { FORMATOS } from "@/lib/formatos";
import type { ErroresFormulario } from "@/lib/types";
import { limpiarErrores } from "@/lib/validacion";
import ListaAsistentes from "./ListaAsistentes";
import SubformularioAsistente from "./SubformularioAsistente";
import type { Asistente } from "./tipos";

/**
 * Listado de Asistencia a Actividades Institucionales (BH-F-033).
 *
 * Mismo molde "evento + lista" que Asistencia a Brigada de Salud
 * (`/brigadas`): los datos de la actividad se capturan una sola vez arriba,
 * los asistentes se van agregando a una lista, y todo se envía junto al
 * pulsar "Guardar actividad". No es un registro clínico: sin consulta a
 * Smart Campus y sin asistente de IA.
 */

interface DatosEvento {
  tema: string;
  facilitador: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
}

const EVENTO_VACIO: DatosEvento = {
  tema: "",
  facilitador: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  lugar: "",
};

interface ResumenActividad {
  evento: DatosEvento;
  totalAsistentes: number;
}

interface Props {
  /**
   * Facilitador preseleccionado, con el nombre de la persona en sesión. Sigue
   * siendo un campo de texto normal, por si registra alguien distinto de
   * quien dicta la actividad.
   */
  facilitadorPorDefecto?: string;
}

export default function FormularioActividad({
  facilitadorPorDefecto = "",
}: Props) {
  const eventoInicial = useMemo(
    () => ({ ...EVENTO_VACIO, facilitador: facilitadorPorDefecto }),
    [facilitadorPorDefecto],
  );
  const [evento, setEvento] = useState<DatosEvento>(eventoInicial);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [resumen, setResumen] = useState<ResumenActividad | null>(null);
  const [actividadId, setActividadId] = useState("");

  function actualizarEvento<C extends keyof DatosEvento>(
    campo: C,
    valor: DatosEvento[C],
  ) {
    setEvento((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previos) => sinErrores(previos, campo));
  }

  function agregarAsistente(asistente: Asistente) {
    setAsistentes((previos) => [...previos, asistente]);
  }

  function eliminarAsistente(id: string) {
    setAsistentes((previos) => previos.filter((asistente) => asistente.id !== id));
  }

  // El botón se deshabilita con esta regla antes de intentar enviar: no tiene
  // sentido dejar que alguien pulse "Guardar actividad" sin asistentes.
  const puedeGuardar =
    evento.tema.trim() !== "" &&
    evento.facilitador.trim() !== "" &&
    evento.fecha.trim() !== "" &&
    asistentes.length > 0;

  const validar = useCallback((): ErroresFormulario => {
    const encontrados = limpiarErrores({
      tema: evento.tema.trim() ? undefined : "Ingrese el tema de la actividad.",
      facilitador: evento.facilitador.trim()
        ? undefined
        : "Ingrese el facilitador.",
      fecha: evento.fecha ? undefined : "Indique la fecha de la actividad.",
    });
    setErrores(encontrados);
    return encontrados;
  }, [evento]);

  const enviar = useCallback(async () => {
    const resultado = await enviarActividad({
      tema: evento.tema.trim(),
      facilitador: evento.facilitador.trim(),
      fecha: evento.fecha,
      hora_inicio: evento.horaInicio,
      hora_fin: evento.horaFin,
      lugar: evento.lugar.trim(),
      asistentes: asistentes.map((asistente) => ({
        nombres_apellidos: asistente.nombresApellidos,
        documento: asistente.documento,
        cargo: asistente.cargo,
        dependencia: asistente.dependencia,
        correo: asistente.correo,
      })),
    });

    setActividadId(resultado.actividad_id ?? "");
    setResumen({
      evento,
      totalAsistentes: resultado.asistentes ?? asistentes.length,
    });
  }, [evento, asistentes]);

  function reiniciar() {
    setEvento(eventoInicial);
    setErrores({});
    setAsistentes([]);
    setResumen(null);
    setActividadId("");
  }

  return (
    <FormularioBase
      formato={FORMATOS.actividades}
      espaciado="amplio"
      validar={validar}
      onEnviar={enviar}
      onReiniciar={reiniciar}
      enviarDeshabilitado={!puedeGuardar}
      etiquetaEnviar="Guardar actividad"
      mensajeExito="La actividad quedó registrada con todos sus asistentes."
      resumenExito={
        resumen && (
          <div className="space-y-4">
            {actividadId && (
              <div className="rounded-campo border border-inst-200 bg-inst-50 px-4 py-3 text-center">
                <p className="font-mono text-meta uppercase text-texto-tenue">
                  Radicado de la actividad
                </p>
                <p className="mt-1 font-mono text-titulo font-medium text-inst-800">
                  {actividadId}
                </p>
              </div>
            )}
            <ResumenRegistro
              filas={[
                ["Tema", resumen.evento.tema],
                ["Facilitador", resumen.evento.facilitador],
                ["Fecha", fechaLegible(resumen.evento.fecha)],
                [
                  "Horario",
                  [horaLegible(resumen.evento.horaInicio), horaLegible(resumen.evento.horaFin)]
                    .filter(Boolean)
                    .join(" – "),
                ],
                ["Lugar", resumen.evento.lugar],
                ["Asistentes registrados", String(resumen.totalAsistentes)],
              ]}
            />
          </div>
        )
      }
    >
      <SeccionFormulario
        paso="A"
        titulo="Datos de la actividad"
        descripcion="Se registran una sola vez para todo el evento."
      >
        <RejillaCampos columnas={3}>
          <CampoTexto
            name="tema"
            etiqueta="Tema"
            valor={evento.tema}
            onChange={(v) => actualizarEvento("tema", v)}
            marcador="Ej.: Inducción institucional"
            maxLength={200}
            error={errores.tema}
            className="sm:col-span-2 lg:col-span-1"
            requerido
          />
          <CampoTexto
            name="facilitador"
            etiqueta="Facilitador"
            valor={evento.facilitador}
            onChange={(v) => actualizarEvento("facilitador", v)}
            autoCapitalize="words"
            maxLength={120}
            error={errores.facilitador}
            requerido
          />
          <CampoFecha
            name="fecha"
            etiqueta="Fecha"
            valor={evento.fecha}
            onChange={(v) => actualizarEvento("fecha", v)}
            error={errores.fecha}
            requerido
          />
          <CampoHora
            name="horaInicio"
            etiqueta="Hora de inicio"
            valor={evento.horaInicio}
            onChange={(v) => actualizarEvento("horaInicio", v)}
            porDefectoAhora={false}
          />
          <CampoHora
            name="horaFin"
            etiqueta="Hora de finalización"
            valor={evento.horaFin}
            onChange={(v) => actualizarEvento("horaFin", v)}
            porDefectoAhora={false}
          />
          <CampoTexto
            name="lugar"
            etiqueta="Lugar"
            valor={evento.lugar}
            onChange={(v) => actualizarEvento("lugar", v)}
            marcador="Ej.: Auditorio Sede Norte"
            maxLength={200}
          />
        </RejillaCampos>
      </SeccionFormulario>

      <SeccionFormulario
        paso="B"
        titulo="Asistentes"
        descripcion="Agregue cada persona que asistió; la actividad se guarda con todos juntos al final."
      >
        <SubformularioAsistente onAgregar={agregarAsistente} />
        <ListaAsistentes asistentes={asistentes} onEliminar={eliminarAsistente} />
      </SeccionFormulario>
    </FormularioBase>
  );
}
