import { useTranslate } from "ra-core";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { DesempenoDePersona } from "./metricasDelEquipo";
import { Grafica } from "./PiezasDeInforme";
import { LOCALE } from "./RelativeDate";

/**
 * Una fila por persona: lo que tiene abierto hoy y lo que hizo en el
 * periodo. Tabla y no gráfica: lo que se quiere es comparar varias cifras
 * de la misma persona de un vistazo. Ver desempenoDelEquipo().
 */
export const DesempenoDelEquipo = ({
  filas,
  moneda,
}: {
  filas: DesempenoDePersona[];
  moneda: string;
}) => {
  const translate = useTranslate();
  const importe = (valor: number) =>
    valor.toLocaleString(LOCALE, {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: 0,
    });
  const t = (clave: string) => translate(`crm.reports.team.${clave}`);

  const columnas: {
    clave: string;
    grupo: "now" | "period";
    valor: (fila: DesempenoDePersona) => string;
    alerta?: (fila: DesempenoDePersona) => boolean;
  }[] = [
    { clave: "open", grupo: "now", valor: (f) => String(f.abiertas) },
    {
      clave: "open_amount",
      grupo: "now",
      valor: (f) => importe(f.importeAbierto),
    },
    {
      clave: "tasks_overdue",
      grupo: "now",
      valor: (f) => String(f.tareasVencidas),
      alerta: (f) => f.tareasVencidas > 0,
    },
    {
      clave: "tickets_open",
      grupo: "now",
      valor: (f) => String(f.ticketsAbiertos),
    },
    { clave: "new", grupo: "period", valor: (f) => String(f.nuevas) },
    { clave: "won", grupo: "period", valor: (f) => String(f.ganadas) },
    {
      clave: "won_amount",
      grupo: "period",
      valor: (f) => importe(f.importeGanado),
    },
    { clave: "lost", grupo: "period", valor: (f) => String(f.perdidas) },
    {
      clave: "conversion",
      grupo: "period",
      valor: (f) =>
        f.conversion == null ? "—" : `${Math.round(f.conversion)} %`,
    },
    {
      clave: "tasks_done",
      grupo: "period",
      valor: (f) => String(f.tareasCompletadas),
    },
    { clave: "notes", grupo: "period", valor: (f) => String(f.notas) },
    {
      clave: "tickets_closed",
      grupo: "period",
      valor: (f) => String(f.ticketsCerrados),
    },
  ];
  const deHoy = columnas.filter((columna) => columna.grupo === "now").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {filas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {translate("crm.reports.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead colSpan={deHoy} className="text-center">
                    {t("now")}
                  </TableHead>
                  <TableHead
                    colSpan={columnas.length - deHoy}
                    className="border-l text-center"
                  >
                    {t("period")}
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead>{t("person")}</TableHead>
                  {columnas.map((columna, indice) => (
                    <TableHead
                      key={columna.clave}
                      className={cn(
                        "text-right whitespace-normal",
                        indice === deHoy && "border-l",
                      )}
                    >
                      {t(columna.clave)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.id}>
                    <TableCell
                      className={cn(
                        "font-medium",
                        fila.id === "" && "text-muted-foreground italic",
                      )}
                    >
                      {fila.id === "" ? t("unassigned") : fila.nombre}
                    </TableCell>
                    {columnas.map((columna, indice) => (
                      <TableCell
                        key={columna.clave}
                        className={cn(
                          "text-right tabular-nums",
                          indice === deHoy && "border-l",
                          columna.alerta?.(fila) && "text-destructive",
                        )}
                      >
                        {columna.valor(fila)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">{t("open_by_owner")}</p>
          <Grafica
            datos={filas.map((fila) => ({
              id: fila.id === "" ? t("unassigned") : fila.nombre,
              valor: fila.abiertas,
            }))}
            vacio={translate("crm.reports.forecast.empty")}
            color="#7aa6c2"
          />
        </div>
      </CardContent>
    </Card>
  );
};
