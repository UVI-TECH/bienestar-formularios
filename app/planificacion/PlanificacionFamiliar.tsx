"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AvisoConsulta from "@/components/forms/AvisoConsulta";
import CampoCedula from "@/components/forms/CampoCedula";
import CampoCondicional from "@/components/forms/CampoCondicional";
import CampoFecha from "@/components/forms/CampoFecha";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoTexto from "@/components/forms/CampoTexto";
import CampoTextareaConIA from "@/components/forms/CampoTextareaConIA";
import FormularioBase from "@/components/forms/FormularioBase";
import RejillaCampos from "@/components/forms/RejillaCampos";
import ResumenRegistro from "@/components/forms/ResumenRegistro";
import SeccionFormulario from "@/components/forms/SeccionFormulario";
import { RESALTADO_MS, sinErrores } from "@/components/forms/utilidades";
import { useConsultaCedula } from "@/components/forms/useConsultaCedula";
import { PROFESIONALES, PROGRAMAS, SEDES, SEMESTRES, TIPOS_PERSONA } from "@/lib/catalogos";
import { enviarRegistro } from "@/lib/enviarRegistro";
import { fechaLegible } from "@/lib/fechas";
import { FORMATOS } from "@/lib/formatos";
import type { ErroresFormulario, RespuestaConsultaCedula } from "@/lib/types";
import { limpiarErrores, validarCedula } from "@/lib/validacion";

/**
 * Planificación Familiar (BH-F-015). Registro simple por persona, mismo molde
 * que Asistencia a Enfermería: una atención, un formulario, un envío.
 */

interface DatosPlanificacion {
  fecha: string;
  sede: string;
  tipoPersona: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  programa: string;
  semestre: string;
  medicamento: string;
  observacion: string;
  profesional: string;
}

const DATOS_VACIOS: DatosPlanificacion = {
  fecha: "",
  sede: "",
  tipoPersona: "",
  cedula: "",
  nombres: "",
  apellidos: "",
  programa: "",
  semestre: "",
  medicamento: "",
  observacion: "",
  profesional: "",
};

interface Props {
  /**
   * Profesional preseleccionado, cuando coincide con la persona en sesión
   * (ver `nombreDeSesionEnCatalogo`). Sigue siendo un desplegable normal, por
   * si registra alguien distinto de quien tiene la sesión abierta.
   */
  profesionalPorDefecto?: string;
}

export default function PlanificacionFamiliar({
  profesionalPorDefecto = "",
}: Props) {
  const datosIniciales = useMemo(
    () => ({ ...DATOS_VACIOS, profesional: profesionalPorDefecto }),
    [profesionalPorDefecto],
  );
  const [datos, setDatos] = useState<DatosPlanificacion>(datosIniciales);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [resaltado, setResaltado] = useState(false);
  const [resumen, setResumen] = useState<DatosPlanificacion | null>(null);

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const esEstudiante = datos.tipoPersona === "Estudiante";

  /* --- Consulta por documento ---------------------------------------------- */

  const aplicarConsulta = useCallback((traidos: RespuestaConsultaCedula) => {
    setDatos((previo) => ({
      ...previo,
      nombres: traidos.nombres ?? "",
      apellidos: traidos.apellidos ?? "",
      programa: traidos.programa ?? previo.programa,
      semestre: traidos.semestre ?? previo.semestre,
    }));
    setErrores((previos) =>
      sinErrores(previos, "nombres", "apellidos", "programa", "semestre"),
    );

    if (temporizador.current) clearTimeout(temporizador.current);
    setResaltado(true);
    temporizador.current = setTimeout(() => setResaltado(false), RESALTADO_MS);
  }, []);

  const consulta = useConsultaCedula({ onEncontrado: aplicarConsulta });

  function actualizar<C extends keyof DatosPlanificacion>(
    campo: C,
    valor: DatosPlanificacion[C],
  ) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previos) => sinErrores(previos, campo));
  }

  function cambiarCedula(cedula: string) {
    // El hook decide si los datos en pantalla siguen correspondiendo al
    // documento; si no, se descartan antes de que se puedan guardar.
    if (consulta.alCambiarCedula(cedula)) {
      setDatos((previo) => ({
        ...previo,
        cedula,
        nombres: "",
        apellidos: "",
        programa: "",
        semestre: "",
      }));
      return;
    }
    actualizar("cedula", cedula);
  }

  /* --- Validación ----------------------------------------------------------- */

  const validar = useCallback((): ErroresFormulario => {
    const encontrados = limpiarErrores({
      fecha: datos.fecha ? undefined : "Indique la fecha de atención.",
      sede: datos.sede ? undefined : "Seleccione la sede.",
      tipoPersona: datos.tipoPersona
        ? undefined
        : "Seleccione el tipo de persona.",
      cedula: validarCedula(datos.cedula),
      nombres: datos.nombres.trim() ? undefined : "Ingrese los nombres.",
      apellidos: datos.apellidos.trim() ? undefined : "Ingrese los apellidos.",
      programa:
        esEstudiante && !datos.programa
          ? "Seleccione el programa académico."
          : undefined,
      semestre:
        esEstudiante && !datos.semestre ? "Seleccione el semestre." : undefined,
      medicamento: datos.medicamento.trim()
        ? undefined
        : "Indique el medicamento suministrado.",
      profesional: datos.profesional
        ? undefined
        : "Seleccione el profesional que atiende.",
    });

    setErrores(encontrados);
    return encontrados;
  }, [datos, esEstudiante]);

  /* --- Envío ---------------------------------------------------------------- */

  const enviar = useCallback(async () => {
    await enviarRegistro("planificacion", {
      fecha: datos.fecha,
      sede: datos.sede,
      tipo_persona: datos.tipoPersona,
      cedula: datos.cedula,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      programa: esEstudiante ? datos.programa : "",
      semestre: esEstudiante ? datos.semestre : "",
      medicamento: datos.medicamento,
      observacion: datos.observacion,
      profesional: datos.profesional,
    });

    setResumen(datos);
  }, [datos, esEstudiante]);

  function reiniciar() {
    setDatos(datosIniciales);
    setErrores({});
    setResumen(null);
    consulta.reiniciar();
  }

  /* --- Interfaz -------------------------------------------------------------- */

  return (
    <FormularioBase
      formato={FORMATOS.planificacion}
      validar={validar}
      onEnviar={enviar}
      onReiniciar={reiniciar}
      resumenExito={
        resumen && (
          <ResumenRegistro
            filas={[
              ["Persona", `${resumen.nombres} ${resumen.apellidos}`.trim()],
              ["Documento", resumen.cedula],
              ["Fecha", fechaLegible(resumen.fecha)],
              ["Sede", resumen.sede],
              ["Medicamento", resumen.medicamento],
              ["Atendió", resumen.profesional],
            ]}
          />
        )
      }
    >
      <SeccionFormulario
        titulo="Atención"
        descripcion="Momento y lugar en que se prestó el servicio."
      >
        <RejillaCampos>
          <CampoFecha
            name="fecha"
            etiqueta="Fecha de atención"
            valor={datos.fecha}
            onChange={(v) => actualizar("fecha", v)}
            error={errores.fecha}
            requerido
          />
          <CampoSelect
            name="sede"
            etiqueta="Sede"
            valor={datos.sede}
            onChange={(v) => actualizar("sede", v)}
            opciones={SEDES}
            error={errores.sede}
            requerido
          />
        </RejillaCampos>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Identificación"
        descripcion="Datos de la persona atendida."
      >
        <RejillaCampos>
          <CampoSelect
            name="tipoPersona"
            etiqueta="Tipo de persona"
            valor={datos.tipoPersona}
            onChange={(v) => actualizar("tipoPersona", v)}
            opciones={TIPOS_PERSONA}
            error={errores.tipoPersona}
            requerido
          />
          <CampoCedula
            name="cedula"
            etiqueta="Documento de identidad"
            valor={datos.cedula}
            onChange={cambiarCedula}
            // La consulta sólo aplica a estudiantes: Smart Campus no conoce
            // al personal administrativo ni docente.
            onBuscar={
              esEstudiante
                ? (cedula) => consulta.buscar(cedula, datos.tipoPersona)
                : undefined
            }
            buscando={consulta.buscando}
            ayuda={
              esEstudiante
                ? "Entre 6 y 12 dígitos. Consulte para traer los datos."
                : "Entre 6 y 12 dígitos."
            }
            error={errores.cedula}
            requerido
          />
          <CampoTexto
            name="nombres"
            etiqueta="Nombres"
            valor={datos.nombres}
            onChange={(v) => actualizar("nombres", v)}
            autoCapitalize="words"
            error={errores.nombres}
            soloLectura={consulta.bloqueado}
            resaltado={resaltado}
            requerido
          />
          <CampoTexto
            name="apellidos"
            etiqueta="Apellidos"
            valor={datos.apellidos}
            onChange={(v) => actualizar("apellidos", v)}
            autoCapitalize="words"
            error={errores.apellidos}
            soloLectura={consulta.bloqueado}
            resaltado={resaltado}
            requerido
          />
        </RejillaCampos>

        <AvisoConsulta
          estado={consulta.estado}
          mensaje={consulta.mensaje}
          onEditarManualmente={consulta.editarManualmente}
        />

        <CampoCondicional visible={esEstudiante}>
          <RejillaCampos>
            <CampoSelect
              name="programa"
              etiqueta="Programa académico"
              valor={datos.programa}
              onChange={(v) => actualizar("programa", v)}
              opciones={PROGRAMAS}
              error={errores.programa}
              soloLectura={consulta.bloqueado}
              resaltado={resaltado}
              requerido
            />
            <CampoSelect
              name="semestre"
              etiqueta="Semestre"
              valor={datos.semestre}
              onChange={(v) => actualizar("semestre", v)}
              opciones={SEMESTRES}
              error={errores.semestre}
              soloLectura={consulta.bloqueado}
              resaltado={resaltado}
              requerido
            />
          </RejillaCampos>
        </CampoCondicional>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Planificación"
        descripcion="Qué se suministró y quién atendió."
      >
        <CampoTexto
          name="medicamento"
          etiqueta="Medicamento"
          valor={datos.medicamento}
          onChange={(v) => actualizar("medicamento", v)}
          marcador="Ej.: Inyección trimestral"
          maxLength={200}
          error={errores.medicamento}
          requerido
        />
        <CampoTextareaConIA
          name="observacion"
          etiqueta="Observación"
          valor={datos.observacion}
          onChange={(v) => actualizar("observacion", v)}
          filas={3}
          maxLength={1000}
          ayuda="Opcional."
        />
        <RejillaCampos>
          <CampoSelect
            name="profesional"
            etiqueta="Profesional que atiende"
            valor={datos.profesional}
            onChange={(v) => actualizar("profesional", v)}
            opciones={PROFESIONALES}
            error={errores.profesional}
            requerido
          />
        </RejillaCampos>
      </SeccionFormulario>
    </FormularioBase>
  );
}
