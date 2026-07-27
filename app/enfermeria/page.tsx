"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import IconoCheck from "@/components/ui/IconoCheck";
import {
  CampoCedula,
  CampoCondicional,
  CampoFecha,
  CampoHora,
  CampoSelect,
  CampoTexto,
  CampoTextarea,
  FormularioBase,
  RejillaCampos,
  SeccionFormulario,
  useConsultaCedula,
} from "@/components/forms";
import { ENFERMERAS, PROGRAMAS, SEDES, SEMESTRES, TIPOS_PERSONA } from "@/lib/catalogos";
import { enviarRegistro } from "@/lib/enviarRegistro";
import { FORMATOS } from "@/lib/formatos";
import { fechaLegible, horaLegible } from "@/lib/fechas";
import { variantesError } from "@/lib/motion";
import type { ErroresFormulario, RespuestaConsultaCedula } from "@/lib/types";
import { limpiarErrores, validarCedula } from "@/lib/validacion";

/* ---------------------------------------------------------------------------
   Estado del formulario
   --------------------------------------------------------------------------- */

interface DatosEnfermeria {
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
  enfermera: string;
}

const DATOS_VACIOS: DatosEnfermeria = {
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
  enfermera: "",
};

/** Duración del resaltado de los campos que llegan de la consulta. */
const RESALTADO_MS = 900;

/** Quita los errores de los campos indicados, sin tocar los demás. */
function sinErrores(
  previos: ErroresFormulario,
  ...campos: string[]
): ErroresFormulario {
  if (!campos.some((campo) => previos[campo])) return previos;
  const copia = { ...previos };
  for (const campo of campos) delete copia[campo];
  return copia;
}

export default function AsistenciaEnfermeria() {
  const [datos, setDatos] = useState<DatosEnfermeria>(DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [resaltado, setResaltado] = useState(false);
  const [resumen, setResumen] = useState<DatosEnfermeria | null>(null);

  const temporizadorResaltado = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizadorResaltado.current) clearTimeout(temporizadorResaltado.current);
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

    if (temporizadorResaltado.current) clearTimeout(temporizadorResaltado.current);
    setResaltado(true);
    temporizadorResaltado.current = setTimeout(
      () => setResaltado(false),
      RESALTADO_MS,
    );
  }, []);

  const consulta = useConsultaCedula({ onEncontrado: aplicarConsulta });

  function actualizar<C extends keyof DatosEnfermeria>(
    campo: C,
    valor: DatosEnfermeria[C],
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
      enfermera: datos.enfermera
        ? undefined
        : "Seleccione la enfermera que atiende.",
    });

    setErrores(encontrados);
    return encontrados;
  }, [datos, esEstudiante, esVinculado]);

  /* --- Envío ---------------------------------------------------------------- */

  const enviar = useCallback(async () => {
    // Claves planas en snake_case, tal como las espera la fila de Excel.
    // Los campos que no aplican al tipo de persona van vacíos, no ausentes,
    // para que la tabla conserve siempre las mismas columnas.
    await enviarRegistro("enfermeria", {
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
      enfermera: datos.enfermera,
    });

    setResumen(datos);
  }, [datos, esEstudiante, esVinculado]);

  function reiniciar() {
    setDatos(DATOS_VACIOS);
    setErrores({});
    setResumen(null);
    consulta.reiniciar();
  }

  /* --- Interfaz -------------------------------------------------------------- */

  return (
    <FormularioBase
      formato={FORMATOS.enfermeria}
      validar={validar}
      onEnviar={enviar}
      onReiniciar={reiniciar}
      resumenExito={resumen && <ResumenRegistro datos={resumen} />}
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
            name="enfermera"
            etiqueta="Enfermera que atiende"
            valor={datos.enfermera}
            onChange={(v) => actualizar("enfermera", v)}
            opciones={ENFERMERAS}
            error={errores.enfermera}
            requerido
          />
        </RejillaCampos>
      </SeccionFormulario>
    </FormularioBase>
  );
}

/* ---------------------------------------------------------------------------
   Aviso del resultado de la consulta
   --------------------------------------------------------------------------- */

function AvisoConsulta({
  estado,
  mensaje,
  onEditarManualmente,
}: {
  estado: ReturnType<typeof useConsultaCedula>["estado"];
  mensaje: string;
  onEditarManualmente: () => void;
}) {
  const visible = estado === "encontrado" || Boolean(mensaje);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key={estado}
          role="status"
          variants={variantesError}
          initial="oculto"
          animate="visible"
          exit="oculto"
          className={
            estado === "encontrado"
              ? "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-campo border border-exito-200 bg-exito-50 px-4 py-3"
              : "rounded-campo border border-aviso-200 bg-aviso-50 px-4 py-3"
          }
        >
          {estado === "encontrado" ? (
            <>
              <span className="flex items-center gap-2 text-ayuda text-exito-700">
                <IconoCheck />
                Datos traídos de Smart Campus. Los campos quedan bloqueados.
              </span>
              <button
                type="button"
                onClick={onEditarManualmente}
                className="rounded-chip text-ayuda font-medium text-inst-700 underline underline-offset-2 transition-colors hover:text-inst-800"
              >
                Editar manualmente
              </button>
            </>
          ) : (
            <span className="text-ayuda text-aviso-700">{mensaje}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------------------
   Resumen de la pantalla de confirmación
   --------------------------------------------------------------------------- */

function ResumenRegistro({ datos }: { datos: DatosEnfermeria }) {
  const filas: Array<[string, string]> = [
    ["Persona", `${datos.nombres} ${datos.apellidos}`.trim()],
    ["Documento", datos.cedula],
    ["Atención", `${fechaLegible(datos.fecha)}, ${horaLegible(datos.hora)}`],
    ["Sede", datos.sede],
    ["Atendió", datos.enfermera],
  ];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-ayuda">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="contents">
          <dt className="text-texto-tenue">{etiqueta}</dt>
          <dd className="text-texto">{valor || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
