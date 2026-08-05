import InsigniaEstado from "@/components/ui/InsigniaEstado";
import { cn } from "@/lib/cn";
import { fechaLegible, horaLegible } from "@/lib/fechas";
import type { AtencionPoliza } from "@/lib/casos";

/**
 * Cabecera de sólo lectura con la atención inicial del caso.
 *
 * La atención inicial es un registro inmutable (ver AGENTS.md): esta cabecera
 * no tiene ningún control editable, sólo el dato tal como se registró el día
 * del accidente. Lo que cambia después se documenta como seguimiento, nunca
 * reescribiendo esta sección.
 */
export default function CabeceraAtencion({ atencion }: { atencion: AtencionPoliza }) {
  return (
    <section className="overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-borde px-6 py-5 sm:px-8">
        <div>
          <p className="font-mono text-meta uppercase text-texto-tenue">Caso</p>
          <p className="mt-1 font-mono text-titulo font-medium text-inst-800">
            {atencion.casoId}
          </p>
        </div>
        <InsigniaEstado estado={atencion.estado} />
      </header>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <Dato etiqueta="Estudiante" valor={`${atencion.nombres} ${atencion.apellidos}`.trim()} />
        <Dato etiqueta="Documento" valor={atencion.cedula} />
        <Dato etiqueta="Programa" valor={atencion.programa} />
        <Dato etiqueta="Facultad" valor={atencion.facultad} />
        <Dato
          etiqueta="Accidente"
          valor={[fechaLegible(atencion.fechaAccidente), horaLegible(atencion.horaAccidente)]
            .filter(Boolean)
            .join(", ")}
        />
        <Dato
          etiqueta="Lugar"
          valor={[atencion.sede, atencion.lugarAccidente].filter(Boolean).join(" · ")}
        />
        <Dato etiqueta="Atendió" valor={atencion.enfermera} />
        <Dato etiqueta="Remisión" valor={atencion.tipoRemision} />
        {atencion.centroMedico && (
          <Dato etiqueta="Centro médico" valor={atencion.centroMedico} />
        )}
        <Dato
          etiqueta="Diagnóstico presuntivo"
          valor={atencion.diagnosticoPresuntivo}
          className="sm:col-span-2"
        />
        <Dato
          etiqueta="Atención inicial y primeros auxilios"
          valor={atencion.atencionInicial}
          className="sm:col-span-2"
        />
        {atencion.observaciones && (
          <Dato
            etiqueta="Observaciones"
            valor={atencion.observaciones}
            className="sm:col-span-2"
          />
        )}
      </dl>

      <p className="border-t border-borde bg-superficie-tenue px-6 py-3 text-ayuda text-texto-tenue sm:px-8">
        Registro inicial de la atención · no se edita. Las novedades del
        estudiante se documentan abajo, como seguimientos.
      </p>
    </section>
  );
}

function Dato({
  etiqueta,
  valor,
  className,
}: {
  etiqueta: string;
  valor: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-etiqueta font-medium text-texto-medio">{etiqueta}</dt>
      <dd className="mt-0.5 text-cuerpo text-texto whitespace-pre-wrap">
        {valor || "—"}
      </dd>
    </div>
  );
}
