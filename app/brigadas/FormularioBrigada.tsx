"use client";

import { useCallback, useMemo, useState } from "react";
import CampoFecha from "@/components/forms/CampoFecha";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoTexto from "@/components/forms/CampoTexto";
import FormularioBase from "@/components/forms/FormularioBase";
import RejillaCampos from "@/components/forms/RejillaCampos";
import ResumenRegistro from "@/components/forms/ResumenRegistro";
import SeccionFormulario from "@/components/forms/SeccionFormulario";
import { sinErrores } from "@/components/forms/utilidades";
import { PROFESIONALES, SEDES } from "@/lib/catalogos";
import { enviarBrigada } from "@/lib/enviarBrigada";
import { fechaLegible } from "@/lib/fechas";
import { FORMATOS } from "@/lib/formatos";
import type { ErroresFormulario } from "@/lib/types";
import { limpiarErrores } from "@/lib/validacion";
import ListaAsistentes from "./ListaAsistentes";
import SubformularioAsistente from "./SubformularioAsistente";
import type { Asistente } from "./tipos";

/**
 * Asistencia a Brigada de Salud (BH-F-014).
 *
 * A diferencia de los demás formatos, aquí un registro es UN EVENTO
 * (empresa, fecha, profesional, sede) al que asisten VARIAS personas: los
 * datos del evento se capturan una sola vez arriba, los asistentes se van
 * agregando a una lista con `SubformularioAsistente`, y todo se envía junto
 * al pulsar "Guardar brigada".
 */

interface DatosEvento {
  fecha: string;
  empresa: string;
  profesional: string;
  sede: string;
}

const EVENTO_VACIO: DatosEvento = {
  fecha: "",
  empresa: "",
  profesional: "",
  sede: "",
};

interface ResumenBrigada {
  evento: DatosEvento;
  totalAsistentes: number;
}

interface Props {
  /**
   * Profesional preseleccionado, cuando coincide con la persona en sesión
   * (ver `nombreDeSesionEnCatalogo`). El campo sigue siendo un desplegable
   * normal, por si registra alguien distinto de quien tiene la sesión abierta.
   */
  profesionalPorDefecto?: string;
}

export default function FormularioBrigada({ profesionalPorDefecto = "" }: Props) {
  const eventoInicial = useMemo(
    () => ({ ...EVENTO_VACIO, profesional: profesionalPorDefecto }),
    [profesionalPorDefecto],
  );
  const [evento, setEvento] = useState<DatosEvento>(eventoInicial);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [resumen, setResumen] = useState<ResumenBrigada | null>(null);
  const [brigadaId, setBrigadaId] = useState("");

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
  // sentido dejar que alguien pulse "Guardar brigada" sin asistentes.
  const puedeGuardar =
    evento.fecha.trim() !== "" &&
    evento.empresa.trim() !== "" &&
    evento.profesional.trim() !== "" &&
    asistentes.length > 0;

  const validar = useCallback((): ErroresFormulario => {
    const encontrados = limpiarErrores({
      fecha: evento.fecha ? undefined : "Indique la fecha de la brigada.",
      empresa: evento.empresa.trim() ? undefined : "Ingrese la empresa.",
      profesional: evento.profesional
        ? undefined
        : "Seleccione el profesional a cargo.",
    });
    setErrores(encontrados);
    return encontrados;
  }, [evento]);

  const enviar = useCallback(async () => {
    const resultado = await enviarBrigada({
      fecha: evento.fecha,
      empresa: evento.empresa.trim(),
      profesional: evento.profesional,
      sede: evento.sede,
      asistentes: asistentes.map((asistente) => {
        const estudiante = asistente.tipoPersona === "Estudiante";
        return {
          documento: asistente.cedula,
          nombres: asistente.nombres,
          apellidos: asistente.apellidos,
          tipo_persona: asistente.tipoPersona,
          semestre: estudiante ? asistente.semestre : "",
          programa: estudiante ? asistente.programa : "",
          motivo_consulta: asistente.motivoConsulta,
        };
      }),
    });

    setBrigadaId(resultado.brigada_id ?? "");
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
    setBrigadaId("");
  }

  return (
    <FormularioBase
      formato={FORMATOS.brigadas}
      espaciado="amplio"
      validar={validar}
      onEnviar={enviar}
      onReiniciar={reiniciar}
      enviarDeshabilitado={!puedeGuardar}
      etiquetaEnviar="Guardar brigada"
      mensajeExito="La brigada quedó registrada con todos sus asistentes."
      resumenExito={
        resumen && (
          <div className="space-y-4">
            {brigadaId && (
              <div className="rounded-campo border border-inst-200 bg-inst-50 px-4 py-3 text-center">
                <p className="font-mono text-meta uppercase text-texto-tenue">
                  Radicado de la brigada
                </p>
                <p className="mt-1 font-mono text-titulo font-medium text-inst-800">
                  {brigadaId}
                </p>
              </div>
            )}
            <ResumenRegistro
              filas={[
                ["Empresa", resumen.evento.empresa],
                ["Fecha", fechaLegible(resumen.evento.fecha)],
                ["Sede", resumen.evento.sede],
                ["Profesional a cargo", resumen.evento.profesional],
                ["Asistentes registrados", String(resumen.totalAsistentes)],
              ]}
            />
          </div>
        )
      }
    >
      <SeccionFormulario
        paso="A"
        titulo="Datos de la brigada"
        descripcion="Se registran una sola vez para todo el evento."
      >
        <RejillaCampos columnas={3}>
          <CampoFecha
            name="fecha"
            etiqueta="Fecha"
            valor={evento.fecha}
            onChange={(v) => actualizarEvento("fecha", v)}
            error={errores.fecha}
            requerido
          />
          <CampoTexto
            name="empresa"
            etiqueta="Empresa"
            valor={evento.empresa}
            onChange={(v) => actualizarEvento("empresa", v)}
            marcador="Ej.: Almacenes Éxito S.A."
            maxLength={200}
            error={errores.empresa}
            requerido
          />
          <CampoSelect
            name="profesional"
            etiqueta="Profesional a cargo"
            valor={evento.profesional}
            onChange={(v) => actualizarEvento("profesional", v)}
            opciones={PROFESIONALES}
            error={errores.profesional}
            requerido
          />
          <CampoSelect
            name="sede"
            etiqueta="Sede"
            valor={evento.sede}
            onChange={(v) => actualizarEvento("sede", v)}
            opciones={SEDES}
            ayuda="Opcional: déjela vacía si la brigada fue en las instalaciones de la empresa."
          />
        </RejillaCampos>
      </SeccionFormulario>

      <SeccionFormulario
        paso="B"
        titulo="Asistentes"
        descripcion="Agregue cada persona atendida durante la jornada; la brigada se guarda con todos juntos al final."
      >
        <SubformularioAsistente onAgregar={agregarAsistente} />
        <ListaAsistentes asistentes={asistentes} onEliminar={eliminarAsistente} />
      </SeccionFormulario>
    </FormularioBase>
  );
}
