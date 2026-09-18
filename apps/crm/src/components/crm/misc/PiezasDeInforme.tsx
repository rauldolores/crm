import { ResponsiveBar } from "@nivo/bar";

/** Piezas compartidas por los informes: una cifra grande y una gráfica de barras. */

export const Indicador = ({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) => (
  <div className="rounded-lg border p-3">
    <p className="text-xs text-muted-foreground">{etiqueta}</p>
    <p className="text-2xl font-semibold tabular-nums">{valor}</p>
  </div>
);

export const Grafica = ({
  datos,
  vacio,
  color,
  formato,
}: {
  datos: { id: string; valor: number }[];
  vacio: string;
  color: string;
  formato?: (valor: number) => string;
}) => {
  if (datos.every((fila) => fila.valor === 0)) {
    return <p className="text-sm text-muted-foreground">{vacio}</p>;
  }

  return (
    <div className="h-[280px]">
      <ResponsiveBar
        data={datos}
        indexBy="id"
        keys={["valor"]}
        colors={[color]}
        margin={{ top: 10, right: 20, bottom: 60, left: 50 }}
        padding={0.3}
        enableGridX={false}
        enableLabel={false}
        axisBottom={{ tickRotation: -30 }}
        tooltip={({ value, indexValue }) => (
          <div className="p-2 bg-secondary rounded shadow inline-flex items-center gap-1 text-secondary-foreground text-sm">
            <strong>{indexValue}:</strong>{" "}
            {formato ? formato(value) : String(value)}
          </div>
        )}
      />
    </div>
  );
};
