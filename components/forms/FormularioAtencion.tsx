"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROGRAMAS, SEDES, SEMESTRES, TIPOS_PERSONA } from "@/lib/catalogos";
import { enviarRegistro } from "@/lib/enviarRegistro";
import { fechaLegible, horaLegible } from "@/lib/fechas";
import type { FormatoConRuta } from "@/lib/formatos";
import type { ErroresFormulario, RespuestaConsultaCedula } from "@/lib/types";
import { limpiarErrores, validarCedula } from "@/lib/validacion";
import AvisoConsulta from "./AvisoConsulta";
import CampoCedula from "./CampoCedula";
import CampoCondicional from "./CampoCondicional";
import CampoFecha from "./CampoFecha";
import CampoHora from "./CampoHora";
import CampoSelect from "./CampoSelect";
import CampoTexto from "./CampoTexto";
import CampoTextarea from "./CampoTextarea";
import FormularioBase from "./FormularioBase";
import RejillaCampos from "./RejillaCampos";
import ResumenRegistro from "./ResumenRegistro";
import SeccionFormulario from "./SeccionFormulario";
import { RESALTADO_MS, sinErrores } from "./utilidades";
import { useConsultaCedula } from "./useConsultaCedula";

/**
 * Formulario de atención individual: la estructura que comparten Asistencia a
 * Enfermería y Consulta Médica. Sólo cambian el formato, la ruta de envío y
 * quién atiende.
 */

interface QuienAtiende {
  /** `name` del campo y clave del payload, p. ej. `enfermera`. */
  name: string;
  etiqueta: string;
  opciones: readonly string[];
}

interface Props {
  formato: FormatoConRuta;
  /** Segmento de `/api/submit/[formato]`, p. ej. `consulta-medica`. */
  rutaEnvio: string;
  quienAtiende: QuienAtiende;
}

interface DatosAtencion {
  fecha: string;
  hora: string;
  sede: string;
  tipoPersona: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  programa: string;
  semestre: string;
  dependencia: string;
  motivo: string;
  procedimiento: string;
  atiende: string;
}

const DATOS_VACIOS: DatosAtencion = {
  fecha: "",
  hora: "",
  sede: "",
  tipoPersona: "",
  cedula: "",
  nombres: "",
  apellidos: "",
  programa: "",
  semestre: "",
  dependencia: "",
  motivo: "",
  procedimiento: "",
  atiende: "",
};

export default function FormularioAtencion({
  formato,
  rutaEnvio,
  quienAtiende,
}: Props) {
  const [datos, setDatos] = useState<DatosAtencion>(DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [resaltado, setResaltado] = useState(false);
  const [resumen, setResumen] = useState<DatosAtencion | null>(null);

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const esEstudiante = datos.tipoPersona === "Estudiante";
  const esVinculado = datos.tipoPersona !== "" && !esEstudiante;

  /* --- Consulta por documento ---------------------------------------------- */

  const aplicarConsulta = useCallback((traidos: RespuestaConsultaCedula) => {
    setDatos((previo) => ({
      ...previo,
      nombres: traidos.nombres ?? "",
      apellidos: traidos.apellidos ?? "",
      // Smart Campus no devuelve el semestre: ese lo elige quien registra.
      programa: traidos.programa ?? previo.programa,
    }));
    setErrores((previos) =>
      sinErrores(previos, "nombres", "apellidos", "programa"),
    );

    if (temporizador.current) clearTimeout(temporizador.current);
    setResaltado(true);
    temporizador.current = setTimeout(() => setResaltado(false), RESALTADO_MS);
  }, []);

  const consulta = useConsultaCedula({ onEncontrado: aplicarConsulta });

  function actualizar<C extends keyof DatosAtencion>(
    campo: C,
    valor: DatosAtencion[C],
  ) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    // Corregir un campo borra su error: el aviso deja de ser cierto.
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
      hora: datos.hora ? undefined : "Indique la hora de atención.",
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
      dependencia:
        esVinculado && !datos.dependencia.trim()
          ? "Indique la dependencia o el cargo."
          : undefined,
      motivo: datos.motivo.trim() ? undefined : "Describa el motivo de consulta.",
      procedimiento: datos.procedimiento.trim()
        ? undefined
        : "Describa el procedimiento realizado.",
      atiende: datos.atiende
        ? undefined
        : `Seleccione ${quienAtiende.etiqueta.toLowerCase()}.`,
    });

    setErrores(encontrados);
    return encontrados;
  }, [datos, esEstudiante, esVinculado, quienAtiende.etiqueta]);

  /* --- Envío ---------------------------------------------------------------- */

  const enviar = useCallback(async () => {
    // Claves planas en snake_case, tal como las espera la fila de Excel.
    // Los campos que no aplican al tipo de persona van vacíos, no ausentes,
    // para que la tabla conserve siempre las mismas columnas.
    await enviarRegistro(rutaEnvio, {
      fecha: datos.fecha,
      hora: datos.hora,
      sede: datos.sede,
      tipo_persona: datos.tipoPersona,
      cedula: datos.cedula,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      programa: esEstudiante ? datos.programa : "",
      semestre: esEstudiante ? datos.semestre : "",
      dependencia: esVinculado ? datos.dependencia : "",
      motivo: datos.motivo,
      procedimiento: datos.procedimiento,
      [quienAtiende.name]: datos.atiende,
    });

    setResumen(datos);
  }, [datos, esEstudiante, esVinculado, rutaEnvio, quienAtiende.name]);

  function reiniciar() {
    setDatos(DATOS_VACIOS);
    setErrores({});
    setResumen(null);
    consulta.reiniciar();
  }

  /* --- Interfaz -------------------------------------------------------------- */

  return (
    <FormularioBase
      formato={formato}
      validar={validar}
      onEnviar={enviar}
      onReiniciar={reiniciar}
      resumenExito={
        resumen && (
          <ResumenRegistro
            filas={[
              ["Persona", `${resumen.nombres} ${resumen.apellidos}`.trim()],
              ["Documento", resumen.cedula],
              [
                "Atención",
                `${fechaLegible(resumen.fecha)}, ${horaLegible(resumen.hora)}`,
              ],
              ["Sede", resumen.sede],
              ["Atendió", resumen.atiende],
            ]}
          />
        )
      }
    >
      <SeccionFormulario
        titulo="Atención"
        descripcion="Momento y lugar en que se prestó el servicio."
      >
        <RejillaCampos columnas={3}>
          <CampoFecha
            name="fecha"
            etiqueta="Fecha de atención"
            valor={datos.fecha}
            onChange={(v) => actualizar("fecha", v)}
            error={errores.fecha}
            requerido
          />
          <CampoHora
            name="hora"
            etiqueta="Hora"
            valor={datos.hora}
            onChange={(v) => actualizar("hora", v)}
            error={errores.hora}
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
              requerido
            />
          </RejillaCampos>
        </CampoCondicional>

        <CampoCondicional visible={esVinculado}>
          <CampoTexto
            name="dependencia"
            etiqueta="Dependencia o cargo"
            valor={datos.dependencia}
            onChange={(v) => actualizar("dependencia", v)}
            marcador="Ej.: Secretaría General"
            error={errores.dependencia}
            requerido
          />
        </CampoCondicional>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Servicio prestado"
        descripcion="Registre lo consultado y lo realizado durante la atención."
      >
        <CampoTextarea
          name="motivo"
          etiqueta="Motivo de consulta"
          valor={datos.motivo}
          onChange={(v) => actualizar("motivo", v)}
          filas={3}
          maxLength={1000}
          error={errores.motivo}
          requerido
        />
        <CampoTextarea
          name="procedimiento"
          etiqueta="Procedimiento realizado"
          valor={datos.procedimiento}
          onChange={(v) => actualizar("procedimiento", v)}
          filas={4}
          maxLength={1000}
          error={errores.procedimiento}
          requerido
        />
        <RejillaCampos>
          <CampoSelect
            name="atiende"
            etiqueta={quienAtiende.etiqueta}
            valor={datos.atiende}
            onChange={(v) => actualizar("atiende", v)}
            opciones={quienAtiende.opciones}
            error={errores.atiende}
            requerido
          />
        </RejillaCampos>
      </SeccionFormulario>
    </FormularioBase>
  );
}
