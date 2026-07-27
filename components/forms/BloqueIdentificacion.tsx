"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import IconoCheck from "@/components/ui/IconoCheck";
import { PROGRAMAS, SEMESTRES, TIPOS_PERSONA } from "@/lib/catalogos";
import { esEstudiante, type DatosIdentificacion } from "@/lib/identificacion";
import { variantesError } from "@/lib/motion";
import type { ErroresFormulario, RespuestaConsultaCedula } from "@/lib/types";
import CampoCedula from "./CampoCedula";
import CampoCondicional from "./CampoCondicional";
import CampoSelect from "./CampoSelect";
import CampoTexto from "./CampoTexto";
import RejillaCampos from "./RejillaCampos";
import { useConsultaCedula } from "./useConsultaCedula";

interface Props {
  valor: DatosIdentificacion;
  onChange: (datos: DatosIdentificacion) => void;
  errores?: ErroresFormulario;
}

/**
 * Identificación de la persona atendida, con consulta por documento contra
 * Smart Campus.
 *
 * Al encontrar a la persona, los campos se rellenan y quedan en sólo lectura;
 * "Editar manualmente" los libera. Si no se encuentra, o el servicio falla, el
 * bloque se comporta como un formulario normal y lo dice.
 */
export default function BloqueIdentificacion({
  valor,
  onChange,
  errores = {},
}: Props) {
  const aplicarConsulta = useCallback(
    (datos: RespuestaConsultaCedula) => {
      onChange({
        ...valor,
        nombres: datos.nombres ?? "",
        apellidos: datos.apellidos ?? "",
        programa: datos.programa ?? valor.programa,
        semestre: (datos.semestre ?? valor.semestre) as DatosIdentificacion["semestre"],
        // Si Smart Campus lo conoce, es estudiante.
        tipoPersona: valor.tipoPersona || "Estudiante",
      });
    },
    [onChange, valor],
  );

  const consulta = useConsultaCedula({ onEncontrado: aplicarConsulta });

  function actualizar<C extends keyof DatosIdentificacion>(
    campo: C,
    nuevoValor: DatosIdentificacion[C],
  ) {
    onChange({ ...valor, [campo]: nuevoValor });
  }

  function cambiarCedula(cedula: string) {
    // El hook decide si los datos en pantalla siguen correspondiendo.
    if (consulta.alCambiarCedula(cedula)) {
      onChange({
        ...valor,
        cedula,
        nombres: "",
        apellidos: "",
        programa: "",
        semestre: "",
      });
      return;
    }

    actualizar("cedula", cedula);
  }

  const bloqueado = consulta.bloqueado;

  return (
    <div className="space-y-3">
      <RejillaCampos>
        <CampoCedula
          name="cedula"
          etiqueta="Documento de identidad"
          valor={valor.cedula}
          onChange={cambiarCedula}
          onBuscar={(cedula) => consulta.buscar(cedula, valor.tipoPersona)}
          buscando={consulta.buscando}
          error={errores.cedula}
          ayuda="Entre 6 y 12 dígitos. Consulte para traer los datos del estudiante."
          requerido
        />

        <CampoSelect
          name="tipoPersona"
          etiqueta="Tipo de persona"
          valor={valor.tipoPersona}
          onChange={(v) =>
            actualizar("tipoPersona", v as DatosIdentificacion["tipoPersona"])
          }
          opciones={TIPOS_PERSONA}
          error={errores.tipoPersona}
          soloLectura={bloqueado}
          requerido
        />

        <CampoTexto
          name="nombres"
          etiqueta="Nombres"
          valor={valor.nombres}
          onChange={(v) => actualizar("nombres", v)}
          autoCapitalize="words"
          error={errores.nombres}
          soloLectura={bloqueado}
          requerido
        />

        <CampoTexto
          name="apellidos"
          etiqueta="Apellidos"
          valor={valor.apellidos}
          onChange={(v) => actualizar("apellidos", v)}
          autoCapitalize="words"
          error={errores.apellidos}
          soloLectura={bloqueado}
          requerido
        />
      </RejillaCampos>

      <AvisoConsulta
        estado={consulta.estado}
        mensaje={consulta.mensaje}
        onEditarManualmente={consulta.editarManualmente}
      />

      <CampoCondicional visible={esEstudiante(valor)}>
        <RejillaCampos>
          <CampoSelect
            name="programa"
            etiqueta="Programa académico"
            valor={valor.programa}
            onChange={(v) => actualizar("programa", v)}
            opciones={PROGRAMAS}
            error={errores.programa}
            soloLectura={bloqueado}
          />
          <CampoSelect
            name="semestre"
            etiqueta="Semestre"
            valor={valor.semestre}
            onChange={(v) =>
              actualizar("semestre", v as DatosIdentificacion["semestre"])
            }
            opciones={SEMESTRES}
            error={errores.semestre}
            soloLectura={bloqueado}
          />
        </RejillaCampos>
      </CampoCondicional>
    </div>
  );
}

/**
 * Franja de resultado de la consulta. Entra con el mismo fade corto que los
 * errores de campo: informa sin robar la atención de quien está registrando.
 */
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
