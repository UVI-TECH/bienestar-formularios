/** Resumen del registro guardado, para la pantalla de confirmación. */
export default function ResumenRegistro({
  filas,
}: {
  filas: ReadonlyArray<readonly [string, string]>;
}) {
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
