"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumeroAnimado from "@/components/ui/NumeroAnimado";
import AvisoConsulta from "@/components/forms/AvisoConsulta";
import CampoCedula from "@/components/forms/CampoCedula";
import CampoCondicional from "@/components/forms/CampoCondicional";
import CampoFecha from "@/components/forms/CampoFecha";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoTexto from "@/components/forms/CampoTexto";
import FormularioBase from "@/components/forms/FormularioBase";
import RejillaCampos from "@/components/forms/RejillaCampos";
import ResumenRegistro from "@/components/forms/ResumenRegistro";
import SeccionFormulario from "@/components/forms/SeccionFormulario";
import { RESALTADO_MS, sinErrores } from "@/components/forms/utilidades";
import { useConsultaCedula } from "@/components/forms/useConsultaCedula";
import { calcularImc, clasificarImc } from "@/lib/antropometria";
import { ENFERMERAS, PROGRAMAS, SEDES, TIPOS_PERSONA } from "@/lib/catalogos";
import { enviarRegistro } from "@/lib/enviarRegistro";
import { fechaLegible } from "@/lib/fechas";
import { FORMATOS } from "@/lib/formatos";
import { variantesFundido } from "@/lib/motion";
import type { ErroresFormulario, RespuestaConsultaCedula } from "@/lib/types";
import {
  limpiarErrores,
  normalizarTension,
  validarCedula,
  validarRango,
  validarTension,
} from "@/lib/validacion";

interface DatosTamizaje {
  fecha: string;
  sede: string;
  tipoPersona: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  programa: string;
  edad: string;
  peso: string;
  talla: string;
  tension: string;
  glicemia: string;
  auxiliar: string;
}

const DATOS_VACIOS: DatosTamizaje = {
  fecha: "",
  sede: "",
  tipoPersona: "",
  cedula: "",
  nombres: "",
  apellidos: "",
  programa: "",
  edad: "",
  peso: "",
  talla: "",
  tension: "",
  glicemia: "",
  auxiliar: "",
};

export default function Tamizaje() {
  const [datos, setDatos] = useState<DatosTamizaje>(DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [resaltado, setResaltado] = useState(false);
  const [resumen, setResumen] = useState<DatosTamizaje | null>(null);

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const esEstudiante = datos.tipoPersona === "Estudiante";

  // El IMC se deriva del estado: se recalcula en cada tecla, sin guardarse.
  const imc = calcularImc(datos.peso, datos.talla);
  const clasificacion = clasificarImc(imc);

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

  function actualizar<C extends keyof DatosTamizaje>(
    campo: C,
    valor: DatosTamizaje[C],
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
      fecha: datos.fecha ? undefined : "Indique la fecha del tamizaje.",
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
      edad: validarRango(datos.edad, {
        minimo: 10,
        maximo: 99,
        campo: "la edad",
        unidad: "años",
        entero: true,
      }),
      peso: validarRango(datos.peso, {
        minimo: 30,
        maximo: 250,
        campo: "el peso",
        unidad: "kg",
        decimales: 1,
      }),
      talla: validarRango(datos.talla, {
        minimo: 100,
        maximo: 230,
        campo: "la talla",
        unidad: "cm",
        entero: true,
      }),
      tension: validarTension(datos.tension),
      glicemia: validarRango(datos.glicemia, {
        minimo: 20,
        maximo: 600,
        campo: "la glicemia",
        unidad: "mg/dL",
        opcional: true,
      }),
      auxiliar: datos.auxiliar
        ? undefined
        : "Seleccione la auxiliar de enfermería.",
    });

    setErrores(encontrados);
    return encontrados;
  }, [datos, esEstudiante]);

  /* --- Envío ---------------------------------------------------------------- */

  const enviar = useCallback(async () => {
    // El IMC y su clasificación se envían ya calculados: la fila de Excel debe
    // poder leerse sin repetir la cuenta.
    await enviarRegistro("tamizaje", {
      fecha: datos.fecha,
      sede: datos.sede,
      tipo_persona: datos.tipoPersona,
      cedula: datos.cedula,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      programa: esEstudiante ? datos.programa : "",
      edad: Number(datos.edad),
      // `peso` en kilogramos y `talla` en centímetros: así se llaman las
      // columnas de la tabla de Excel y del esquema del flujo.
      peso: Number(datos.peso),
      talla: Number(datos.talla),
      imc: imc ?? "",
      clasificacion_imc: clasificacion,
      tension_arterial: datos.tension,
      glicemia: datos.glicemia ? Number(datos.glicemia) : "",
      auxiliar: datos.auxiliar,
    });

    setResumen(datos);
  }, [datos, esEstudiante, imc, clasificacion]);

  function reiniciar() {
    setDatos(DATOS_VACIOS);
    setErrores({});
    setResumen(null);
    consulta.reiniciar();
  }

  /* --- Interfaz -------------------------------------------------------------- */

  return (
    <FormularioBase
      formato={FORMATOS.tamizaje}
      validar={validar}
      onEnviar={enviar}
      onReiniciar={reiniciar}
      mensajeExito="El tamizaje quedó registrado correctamente."
      resumenExito={
        resumen && (
          <ResumenRegistro
            filas={[
              ["Persona", `${resumen.nombres} ${resumen.apellidos}`.trim()],
              ["Documento", resumen.cedula],
              ["Fecha", fechaLegible(resumen.fecha)],
              ["Sede", resumen.sede],
              [
                "IMC",
                calcularImc(resumen.peso, resumen.talla) !== null
                  ? `${calcularImc(resumen.peso, resumen.talla)?.toFixed(1)} kg/m² · ${clasificarImc(
                      calcularImc(resumen.peso, resumen.talla),
                    )}`
                  : "",
              ],
              ["Tomó", resumen.auxiliar],
            ]}
          />
        )
      }
    >
      <SeccionFormulario
        titulo="Jornada"
        descripcion="Momento y lugar en que se realizó el tamizaje."
      >
        <RejillaCampos>
          <CampoFecha
            name="fecha"
            etiqueta="Fecha del tamizaje"
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
        descripcion="Datos de la persona tamizada."
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
              className="sm:col-span-2"
            />
          </RejillaCampos>
        </CampoCondicional>
      </SeccionFormulario>

      <SeccionFormulario
        titulo="Medidas"
        descripcion="Antropometría y signos tomados durante la jornada."
      >
        <RejillaCampos columnas={3}>
          <CampoTexto
            name="edad"
            etiqueta="Edad"
            valor={datos.edad}
            onChange={(v) => actualizar("edad", v)}
            tipo="number"
            inputMode="numeric"
            min={10}
            max={99}
            step={1}
            sufijo="años"
            ayuda="Entre 10 y 99 años."
            error={errores.edad}
            requerido
          />
          <CampoTexto
            name="peso"
            etiqueta="Peso"
            valor={datos.peso}
            onChange={(v) => actualizar("peso", v)}
            tipo="number"
            inputMode="decimal"
            min={30}
            max={250}
            step={0.1}
            sufijo="kg"
            ayuda="Entre 30 y 250 kg, con un decimal."
            error={errores.peso}
            requerido
          />
          <CampoTexto
            name="talla"
            etiqueta="Talla"
            valor={datos.talla}
            onChange={(v) => actualizar("talla", v)}
            tipo="number"
            inputMode="numeric"
            min={100}
            max={230}
            step={1}
            sufijo="cm"
            ayuda="Entre 100 y 230 cm, sin decimales."
            error={errores.talla}
            requerido
          />
        </RejillaCampos>

        <PanelImc imc={imc} clasificacion={clasificacion} />

        <RejillaCampos>
          <CampoTexto
            name="tension"
            etiqueta="Tensión arterial"
            valor={datos.tension}
            onChange={(v) => actualizar("tension", normalizarTension(v))}
            inputMode="numeric"
            marcador="120/80"
            ayuda="Sistólica/diastólica en mmHg, por ejemplo 120/80."
            error={errores.tension}
            requerido
          />
          <CampoTexto
            name="glicemia"
            etiqueta="Glicemia"
            valor={datos.glicemia}
            onChange={(v) => actualizar("glicemia", v)}
            tipo="number"
            inputMode="numeric"
            min={20}
            max={600}
            step={1}
            sufijo="mg/dL"
            ayuda="Opcional. Regístrela sólo si se tomó."
            error={errores.glicemia}
          />
        </RejillaCampos>

        <RejillaCampos>
          <CampoSelect
            name="auxiliar"
            etiqueta="Auxiliar de enfermería que atiende"
            valor={datos.auxiliar}
            onChange={(v) => actualizar("auxiliar", v)}
            opciones={ENFERMERAS}
            error={errores.auxiliar}
            requerido
          />
        </RejillaCampos>
      </SeccionFormulario>
    </FormularioBase>
  );
}

/* ---------------------------------------------------------------------------
   Índice de masa corporal
   --------------------------------------------------------------------------- */

/**
 * Resultado del IMC. Es un dato derivado, no un campo: por eso se presenta como
 * una lectura y no como un control.
 *
 * La cifra recorre el camino hasta su nuevo valor en lugar de saltar, para que
 * se vea que respondió a lo que se acaba de teclear. La clasificación se
 * enuncia en texto neutro: acompaña la medición, no la califica.
 */
function PanelImc({
  imc,
  clasificacion,
}: {
  imc: number | null;
  clasificacion: string;
}) {
  return (
    <div className="rounded-campo border border-borde bg-superficie-tenue px-5 py-4">
      <p className="font-mono text-meta uppercase text-texto-tenue">
        Índice de masa corporal
      </p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-titulo text-texto tabular-nums">
          {imc === null ? "—" : <NumeroAnimado valor={imc} decimales={1} />}
        </span>
        <span className="font-mono text-ayuda text-texto-tenue">kg/m²</span>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={clasificacion || "sin-datos"}
            variants={variantesFundido}
            initial="oculto"
            animate="visible"
            exit="oculto"
            className="ml-auto text-cuerpo text-texto-medio"
          >
            {clasificacion || "Ingrese peso y talla"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* La cifra animada está oculta a los lectores de pantalla; este es su
          equivalente, que se anuncia una vez que el valor se asienta. */}
      <p className="sr-only" role="status">
        {imc === null
          ? "Índice de masa corporal pendiente de peso y talla."
          : `Índice de masa corporal ${imc.toFixed(1)}, ${clasificacion}.`}
      </p>

      <p className="mt-2 text-ayuda text-texto-tenue">
        Valor informativo, calculado a partir del peso y la talla según los
        rangos de la OMS.
      </p>
    </div>
  );
}
