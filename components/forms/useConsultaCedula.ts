"use client";

import { useCallback, useState } from "react";
import { consultarCedula } from "@/lib/lookup";
import type { RespuestaConsultaCedula } from "@/lib/types";

export type EstadoConsulta =
  | "inactivo"
  | "buscando"
  | "encontrado"
  | "no-encontrado"
  | "error";

interface Opciones {
  /** Se llama con los datos traídos cuando la consulta encuentra a la persona. */
  onEncontrado: (datos: RespuestaConsultaCedula) => void;
}

/**
 * Máquina de estados de la consulta por documento.
 *
 * Regla de bloqueo: los campos quedan en sólo lectura **únicamente** cuando la
 * consulta encontró a la persona, porque en ese caso el dato proviene de Smart
 * Campus y no debería alterarse a la ligera; "Editar manualmente" levanta el
 * bloqueo cuando el registro está desactualizado. Si no se encuentra o el
 * servicio falla no hay nada que bloquear: los campos siguen editables.
 */
export function useConsultaCedula({ onEncontrado }: Opciones) {
  const [estado, setEstado] = useState<EstadoConsulta>("inactivo");
  const [mensaje, setMensaje] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  /**
   * Documento al que pertenecen los datos que hay en pantalla.
   * Permite detectar que el formulario quedó con los datos de otra persona.
   */
  const [cedulaConsultada, setCedulaConsultada] = useState("");

  const buscar = useCallback(
    async (cedula: string, tipoPersona?: string) => {
      setEstado("buscando");
      setMensaje("");

      const resultado = await consultarCedula(cedula, tipoPersona);

      if (resultado.estado === "encontrado") {
        onEncontrado(resultado.datos);
        setCedulaConsultada(cedula);
        setBloqueado(true);
        setEstado("encontrado");
        return;
      }

      setBloqueado(false);

      if (resultado.estado === "no-encontrado") {
        setEstado("no-encontrado");
        setMensaje(
          "El documento no está registrado en Smart Campus. Diligencie los datos manualmente.",
        );
        return;
      }

      setEstado("error");
      setMensaje(resultado.mensaje);
    },
    [onEncontrado],
  );

  /** Levanta el bloqueo conservando los datos ya traídos. */
  const editarManualmente = useCallback(() => {
    setBloqueado(false);
    setEstado("inactivo");
    setMensaje("");
  }, []);

  /**
   * Vuelve al punto de partida. Se llama cuando cambia el documento: los datos
   * en pantalla ya no corresponden a la cédula que se está escribiendo.
   */
  const reiniciar = useCallback(() => {
    setBloqueado(false);
    setEstado("inactivo");
    setMensaje("");
    setCedulaConsultada("");
  }, []);

  /**
   * Avisa al hook de que el documento cambió y deja la consulta en reposo.
   *
   * Devuelve `true` cuando los datos que hay en pantalla fueron traídos para
   * OTRO documento y por lo tanto deben borrarse: dejarlos sería peor que no
   * tenerlos, porque se podría registrar la atención de una persona a nombre
   * de otra. Quien llama es responsable de limpiar sus propios campos.
   */
  const alCambiarCedula = useCallback(
    (cedulaNueva: string): boolean => {
      const invalidados = Boolean(cedulaConsultada) && cedulaConsultada !== cedulaNueva;
      if (invalidados || estado !== "inactivo") reiniciar();
      return invalidados;
    },
    [cedulaConsultada, estado, reiniciar],
  );

  return {
    estado,
    mensaje,
    bloqueado,
    cedulaConsultada,
    buscando: estado === "buscando",
    buscar,
    editarManualmente,
    reiniciar,
    alCambiarCedula,
  };
}
