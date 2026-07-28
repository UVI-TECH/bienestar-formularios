"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import AvisoConsulta from "@/components/forms/AvisoConsulta";
import CampoCedula from "@/components/forms/CampoCedula";
import CampoCondicional from "@/components/forms/CampoCondicional";
import CampoFecha from "@/components/forms/CampoFecha";
import CampoHora from "@/components/forms/CampoHora";
import CampoRadio from "@/components/forms/CampoRadio";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoTexto from "@/components/forms/CampoTexto";
import CampoTextarea from "@/components/forms/CampoTextarea";
import FormularioBase from "@/components/forms/FormularioBase";
import RejillaCampos from "@/components/forms/RejillaCampos";
import ResumenRegistro from "@/components/forms/ResumenRegistro";
import SeccionFormulario from "@/components/forms/SeccionFormulario";
import { RESALTADO_MS, sinErrores } from "@/components/forms/utilidades";
import { useConsultaCedula } from "@/components/forms/useConsultaCedula";
import {
  ENFERMERAS,
  ESTADOS_CASO,
  PROGRAMAS,
  SEDES,
  SEMESTRES,
  SEXO,
  TIPOS_REMISION,
} from "@/lib/catalogos";
import { enviarRegistro } from "@/lib/enviarRegistro";
import { fechaLegible, horaLegible } from "@/lib/fechas";
import { FORMATOS } from "@/lib/formatos";
import { variantesFundido } from "@/lib/motion";
import type { ErroresFormulario, RespuestaConsultaCedula } from "@/lib/types";
import {
  limpiarErrores,
  normalizarCelular,
  validarCedula,
  validarCelular,
} from "@/lib/validacion";

const SI_NO = ["Sí", "No"] as const;

/** El único valor de `TIPOS_REMISION` que no implica remitir a ninguna parte. */
const SIN_REMISION = "No requirió remisión";

interface DatosPoliza {
  fechaAccidente: string;
  horaAccidente: string;
  sede: string;
  lugar: string;
  horaIngreso: string;

  cedula: string;
  nombres: string;
  apellidos: string;
  sexo: string;
  programa: string;
  semestre: string;
  telefonoEstudiante: string;
  telefonoFamiliar: string;

  enfermera: string;
  atencionInicial: string;
  areaProtegida: string;
  horaLlamada: string;
  medicoAreaProtegida: string;
  ambulancia: string;
  tipoRemision: string;
  centroMedico: string;
  diagnostico: string;
  horaEgreso: string;
  acompanante: string;
  observaciones: string;

  estado: string;
}

const DATOS_VACIOS: DatosPoliza = {
  fechaAccidente: "",
  horaAccidente: "",
  sede: "",
  lugar: "",
  horaIngreso: "",
  cedula: "",
  nombres: "",
  apellidos: "",
  sexo: "",
  programa: "",
  semestre: "",
  telefonoEstudiante: "",
  telefonoFamiliar: "",
  enfermera: "",
  atencionInicial: "",
  areaProtegida: "",
  horaLlamada: "",
  medicoAreaProtegida: "",
  ambulancia: "",
  tipoRemision: "",
  centroMedico: "",
  diagnostico: "",
  horaEgreso: "",
  acompanante: "",
  observaciones: "",
  estado: "",
};

export default function AtencionPorAccidente() {
  const [datos, setDatos] = useState<DatosPoliza>(DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [resaltado, setResaltado] = useState(false);
  const [resumen, setResumen] = useState<DatosPoliza | null>(null);
  const [casoId, setCasoId] = useState("");

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const llamoAreaProtegida = datos.areaProtegida === "Sí";
  const huboRemision =
    datos.tipoRemision !== "" && datos.tipoRemision !== SIN_REMISION;
  const quedaEnSeguimiento = datos.estado === "En seguimiento";

  /* --- Consulta por documento ---------------------------------------------- */

  const aplicarConsulta = useCallback((traidos: RespuestaConsultaCedula) => {
    setDatos((previo) => ({
      ...previo,
      nombres: traidos.nombres ?? "",
      apellidos: traidos.apellidos ?? "",
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

  function actualizar<C extends keyof DatosPoliza>(
    campo: C,
    valor: DatosPoliza[C],
  ) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previos) => sinErrores(previos, campo));
  }

  function cambiarCedula(cedula: string) {
    if (consulta.alCambiarCedula(cedula)) {
      setDatos((previo) => ({
        ...previo,
        cedula,
        nombres: "",
        apellidos: "",
        programa: "",
      }));
      return;
    }
    actualizar("cedula", cedula);
  }

  /* --- Validación ----------------------------------------------------------- */

  const validar = useCallback((): ErroresFormulario => {
    const encontrados = limpiarErrores({
      fechaAccidente: datos.fechaAccidente
        ? undefined
        : "Indique la fecha del accidente.",
      horaAccidente: datos.horaAccidente
        ? undefined
        : "Indique la hora del accidente.",
      sede: datos.sede ? undefined : "Seleccione la sede.",
      lugar: datos.lugar.trim()
        ? undefined
        : "Indique el lugar exacto del accidente.",
      horaIngreso: datos.horaIngreso
        ? undefined
        : "Indique la hora de ingreso a enfermería.",

      cedula: validarCedula(datos.cedula),
      nombres: datos.nombres.trim() ? undefined : "Ingrese los nombres.",
      apellidos: datos.apellidos.trim() ? undefined : "Ingrese los apellidos.",
      sexo: datos.sexo ? undefined : "Seleccione el sexo.",
      programa: datos.programa ? undefined : "Seleccione el programa académico.",
      semestre: datos.semestre ? undefined : "Seleccione el semestre.",
      telefonoEstudiante: validarCelular(
        datos.telefonoEstudiante,
        "el teléfono del estudiante",
      ),
      telefonoFamiliar: validarCelular(
        datos.telefonoFamiliar,
        "el teléfono del familiar",
      ),

      enfermera: datos.enfermera
        ? undefined
        : "Seleccione la enfermera que atiende.",
      atencionInicial: datos.atencionInicial.trim()
        ? undefined
        : "Describa la atención inicial prestada.",
      areaProtegida: datos.areaProtegida
        ? undefined
        : "Indique si se llamó a área protegida.",
      horaLlamada:
        llamoAreaProtegida && !datos.horaLlamada
          ? "Indique la hora de la llamada."
          : undefined,
      medicoAreaProtegida:
        llamoAreaProtegida && !datos.medicoAreaProtegida.trim()
          ? "Indique el médico de área protegida que atendió."
          : undefined,
      ambulancia:
        llamoAreaProtegida && !datos.ambulancia
          ? "Indique si se solicitó ambulancia."
          : undefined,
      tipoRemision: datos.tipoRemision
        ? undefined
        : "Seleccione el tipo de remisión.",
      centroMedico:
        huboRemision && !datos.centroMedico.trim()
          ? "Indique el centro médico de remisión."
          : undefined,
      diagnostico: datos.diagnostico.trim()
        ? undefined
        : "Registre el diagnóstico presuntivo.",
      horaEgreso: datos.horaEgreso
        ? undefined
        : "Indique la hora de egreso de enfermería.",

      estado: datos.estado ? undefined : "Indique cómo queda el caso.",
    });

    setErrores(encontrados);
    return encontrados;
  }, [datos, llamoAreaProtegida, huboRemision]);

  /* --- Envío ---------------------------------------------------------------- */

  const enviar = useCallback(async () => {
    // Los teléfonos van como texto: un número perdería el cero inicial y Excel
    // los pasaría a notación científica. "Sí"/"No" también son texto, que se
    // lee mejor que un booleano en los informes.
    const resultado = await enviarRegistro("poliza", {
      fecha_accidente: datos.fechaAccidente,
      hora_accidente: datos.horaAccidente,
      sede: datos.sede,
      lugar: datos.lugar,
      hora_ingreso: datos.horaIngreso,

      cedula: datos.cedula,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      sexo: datos.sexo,
      programa: datos.programa,
      semestre: datos.semestre,
      telefono_estudiante: datos.telefonoEstudiante,
      telefono_familiar: datos.telefonoFamiliar,

      enfermera: datos.enfermera,
      atencion_inicial: datos.atencionInicial,
      area_protegida: datos.areaProtegida,
      // Los campos de área protegida sólo tienen sentido si se llamó.
      hora_llamada: llamoAreaProtegida ? datos.horaLlamada : "",
      medico_area_protegida: llamoAreaProtegida ? datos.medicoAreaProtegida : "",
      ambulancia: llamoAreaProtegida ? datos.ambulancia : "",
      tipo_remision: datos.tipoRemision,
      centro_medico: huboRemision ? datos.centroMedico : "",
      diagnostico: datos.diagnostico,
      hora_egreso: datos.horaEgreso,
      acompanante: datos.acompanante,
      observaciones: datos.observaciones,

      estado: datos.estado,
    });

    setCasoId(resultado.caso_id ?? "");
    setResumen(datos);
  }, [datos, llamoAreaProtegida, huboRemision]);

  function reiniciar() {
    setDatos(DATOS_VACIOS);
    setErrores({});
    setResumen(null);
    setCasoId("");
    consulta.reiniciar();
  }

  /* --- Interfaz -------------------------------------------------------------- */

  return (
    <FormularioBase
      formato={FORMATOS.poliza}
      espaciado="amplio"
      validar={validar}
      onEnviar={enviar}
      onReiniciar={reiniciar}
      mensajeExito={
        resumen?.estado === "En seguimiento"
          ? "El caso quedó registrado y abierto en seguimiento."
          : "El caso quedó registrado y cerrado."
      }
      resumenExito={
        resumen && <ResumenCaso datos={resumen} casoId={casoId} />
      }
    >
      {/* ------------------------------ A ------------------------------ */}
      <SeccionFormulario
        paso="A"
        titulo="Datos del evento"
        descripcion="Cuándo y dónde ocurrió el accidente."
      >
        <RejillaCampos>
          <CampoFecha
            name="fechaAccidente"
            etiqueta="Fecha del accidente"
            valor={datos.fechaAccidente}
            onChange={(v) => actualizar("fechaAccidente", v)}
            error={errores.fechaAccidente}
            requerido
          />
          <CampoHora
            name="horaAccidente"
            etiqueta="Hora del accidente"
            valor={datos.horaAccidente}
            onChange={(v) => actualizar("horaAccidente", v)}
            error={errores.horaAccidente}
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
          <CampoHora
            name="horaIngreso"
            etiqueta="Hora de ingreso a enfermería"
            valor={datos.horaIngreso}
            onChange={(v) => actualizar("horaIngreso", v)}
            error={errores.horaIngreso}
            requerido
          />
          <CampoTexto
            name="lugar"
            etiqueta="Lugar específico del accidente"
            valor={datos.lugar}
            onChange={(v) => actualizar("lugar", v)}
            marcador="Ej.: cancha múltiple, bloque 3, escalera del segundo piso"
            maxLength={200}
            error={errores.lugar}
            className="sm:col-span-2"
            requerido
          />
        </RejillaCampos>
      </SeccionFormulario>

      {/* ------------------------------ B ------------------------------ */}
      <SeccionFormulario
        paso="B"
        titulo="Datos del estudiante"
        descripcion="Consulte el documento para traer los datos; este formato aplica sólo a estudiantes."
      >
        <RejillaCampos>
          <CampoCedula
            name="cedula"
            etiqueta="Documento de identidad"
            valor={datos.cedula}
            onChange={cambiarCedula}
            onBuscar={(cedula) => consulta.buscar(cedula, "Estudiante")}
            buscando={consulta.buscando}
            ayuda="Entre 6 y 12 dígitos. Consulte para traer los datos."
            error={errores.cedula}
            requerido
          />
          <CampoSelect
            name="sexo"
            etiqueta="Sexo"
            valor={datos.sexo}
            onChange={(v) => actualizar("sexo", v)}
            opciones={SEXO}
            error={errores.sexo}
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
          <CampoTexto
            name="telefonoEstudiante"
            etiqueta="Teléfono del estudiante"
            valor={datos.telefonoEstudiante}
            onChange={(v) => actualizar("telefonoEstudiante", normalizarCelular(v))}
            inputMode="numeric"
            marcador="3001234567"
            ayuda="Diez dígitos."
            error={errores.telefonoEstudiante}
            requerido
          />
          <CampoTexto
            name="telefonoFamiliar"
            etiqueta="Teléfono de un familiar"
            valor={datos.telefonoFamiliar}
            onChange={(v) => actualizar("telefonoFamiliar", normalizarCelular(v))}
            inputMode="numeric"
            marcador="3001234567"
            ayuda="Diez dígitos. A quién avisar en caso de urgencia."
            error={errores.telefonoFamiliar}
            requerido
          />
        </RejillaCampos>
      </SeccionFormulario>

      {/* ------------------------------ C ------------------------------ */}
      <SeccionFormulario
        paso="C"
        titulo="Atención"
        descripcion="Lo prestado en enfermería y lo que se hizo con el caso."
      >
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

        <CampoTextarea
          name="atencionInicial"
          etiqueta="Atención inicial y primeros auxilios"
          valor={datos.atencionInicial}
          onChange={(v) => actualizar("atencionInicial", v)}
          filas={4}
          maxLength={1500}
          error={errores.atencionInicial}
          requerido
        />

        <CampoRadio
          name="areaProtegida"
          etiqueta="¿Se llamó a área protegida?"
          valor={datos.areaProtegida}
          onChange={(v) => actualizar("areaProtegida", v)}
          opciones={SI_NO}
          error={errores.areaProtegida}
          requerido
        />

        <CampoCondicional visible={llamoAreaProtegida}>
          <div className="rounded-campo border border-borde bg-superficie-tenue px-5 py-4">
            <RejillaCampos>
              <CampoHora
                name="horaLlamada"
                etiqueta="Hora de la llamada"
                valor={datos.horaLlamada}
                onChange={(v) => actualizar("horaLlamada", v)}
                porDefectoAhora={false}
                error={errores.horaLlamada}
                requerido
              />
              <CampoTexto
                name="medicoAreaProtegida"
                etiqueta="Médico de área protegida"
                valor={datos.medicoAreaProtegida}
                onChange={(v) => actualizar("medicoAreaProtegida", v)}
                autoCapitalize="words"
                maxLength={120}
                error={errores.medicoAreaProtegida}
                requerido
              />
            </RejillaCampos>
            <CampoRadio
              name="ambulancia"
              etiqueta="¿Se solicitó ambulancia?"
              valor={datos.ambulancia}
              onChange={(v) => actualizar("ambulancia", v)}
              opciones={SI_NO}
              error={errores.ambulancia}
              requerido
            />
          </div>
        </CampoCondicional>

        <RejillaCampos>
          <CampoSelect
            name="tipoRemision"
            etiqueta="Tipo de remisión"
            valor={datos.tipoRemision}
            onChange={(v) => actualizar("tipoRemision", v)}
            opciones={TIPOS_REMISION}
            error={errores.tipoRemision}
            requerido
          />
          <CampoHora
            name="horaEgreso"
            etiqueta="Hora de egreso de enfermería"
            valor={datos.horaEgreso}
            onChange={(v) => actualizar("horaEgreso", v)}
            porDefectoAhora={false}
            error={errores.horaEgreso}
            requerido
          />
        </RejillaCampos>

        <CampoCondicional visible={huboRemision}>
          <CampoTexto
            name="centroMedico"
            etiqueta="Centro médico de remisión"
            valor={datos.centroMedico}
            onChange={(v) => actualizar("centroMedico", v)}
            marcador="Ej.: Clínica Nuestra Señora de los Remedios"
            maxLength={200}
            error={errores.centroMedico}
            requerido
          />
        </CampoCondicional>

        <CampoTextarea
          name="diagnostico"
          etiqueta="Diagnóstico presuntivo"
          valor={datos.diagnostico}
          onChange={(v) => actualizar("diagnostico", v)}
          filas={3}
          maxLength={1000}
          error={errores.diagnostico}
          requerido
        />

        <RejillaCampos>
          <CampoTexto
            name="acompanante"
            etiqueta="Nombre del acompañante"
            valor={datos.acompanante}
            onChange={(v) => actualizar("acompanante", v)}
            autoCapitalize="words"
            maxLength={120}
            ayuda="Opcional. Quién acompañó al estudiante."
            className="sm:col-span-2"
          />
        </RejillaCampos>

        <CampoTextarea
          name="observaciones"
          etiqueta="Observaciones"
          valor={datos.observaciones}
          onChange={(v) => actualizar("observaciones", v)}
          filas={3}
          maxLength={1000}
          ayuda="Opcional."
        />
      </SeccionFormulario>

      {/* ------------------------------ D ------------------------------ */}
      <SeccionFormulario
        paso="D"
        titulo="Estado del caso"
        descripcion="Lo último que se decide, y lo que determina si el caso sigue abierto."
        destacado
      >
        <CampoRadio
          name="estado"
          etiqueta="¿Cómo queda el caso?"
          valor={datos.estado}
          onChange={(v) => actualizar("estado", v)}
          opciones={[
            { valor: ESTADOS_CASO[0], etiqueta: "Caso cerrado" },
            { valor: ESTADOS_CASO[1], etiqueta: "Pasa a seguimiento" },
          ]}
          ayuda="Marque «Pasa a seguimiento» si el estudiante queda pendiente de cirugía, terapias, controles u otro procedimiento."
          error={errores.estado}
          requerido
        />

        <CampoCondicional visible={quedaEnSeguimiento}>
          <motion.div
            variants={variantesFundido}
            initial="oculto"
            animate="visible"
            className="rounded-campo border border-aviso-200 bg-aviso-50 px-4 py-3"
          >
            <p className="text-ayuda text-aviso-700">
              El caso quedará abierto con un radicado propio. Bienestar
              Universitario hará seguimiento hasta el alta; conserve el número
              del caso para reportar cirugías, terapias o controles posteriores.
            </p>
          </motion.div>
        </CampoCondicional>
      </SeccionFormulario>
    </FormularioBase>
  );
}

/* ---------------------------------------------------------------------------
   Confirmación
   --------------------------------------------------------------------------- */

function ResumenCaso({
  datos,
  casoId,
}: {
  datos: DatosPoliza;
  casoId: string;
}) {
  const enSeguimiento = datos.estado === "En seguimiento";

  return (
    <div className="space-y-4">
      {casoId && (
        <div className="rounded-campo border border-inst-200 bg-inst-50 px-4 py-3 text-center">
          <p className="font-mono text-meta uppercase text-texto-tenue">
            Número del caso
          </p>
          <p className="mt-1 font-mono text-titulo font-medium text-inst-800">
            {casoId}
          </p>
        </div>
      )}

      <ResumenRegistro
        filas={[
          ["Estudiante", `${datos.nombres} ${datos.apellidos}`.trim()],
          ["Documento", datos.cedula],
          [
            "Accidente",
            `${fechaLegible(datos.fechaAccidente)}, ${horaLegible(datos.horaAccidente)}`,
          ],
          ["Lugar", `${datos.sede} · ${datos.lugar}`],
          ["Remisión", datos.tipoRemision],
          ["Atendió", datos.enfermera],
          ["Estado", enSeguimiento ? "En seguimiento" : "Cerrado"],
        ]}
      />

      {enSeguimiento && (
        <p className="rounded-campo border border-aviso-200 bg-aviso-50 px-4 py-3 text-ayuda text-aviso-700">
          Este caso queda abierto. Anote el número y repórtelo a Bienestar
          Universitario cuando haya novedades del estudiante.
        </p>
      )}
    </div>
  );
}
