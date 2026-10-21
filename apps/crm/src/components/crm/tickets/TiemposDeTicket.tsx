import { useQuery } from "@tanstack/react-query";
import { Clock, Plus } from "lucide-react";
import {
  useDataProvider,
  useGetList,
  useGetMany,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { formatearMinutos } from "@/lib/soporteTiempos";
import type { CrmDataProvider } from "../providers/types";
import type { Sale, SoporteTiempo } from "../types";
import {
  CorregirTiempoDialog,
  RegistrarTiempoDialog,
} from "./RegistrarTiempoDialog";

/** Un ticket no llega ni de lejos a tantos registros; si llega, se avisa. */
const MAXIMO_DE_REGISTROS = 500;

/** Suma de minutos: todos, y los que descuentan de la bolsa. */
const totalesDeTiempo = (registros: SoporteTiempo[]) => ({
  total: registros.reduce((suma, r) => suma + r.minutos, 0),
  consume: registros
    .filter((r) => r.consume)
    .reduce((suma, r) => suma + r.minutos, 0),
});

/**
 * Tiempo de soporte del ticket (crm.soporte_tiempos): el total, el botón
 * para registrar y la lista de registros. Los registros no se editan: se
 * corrigen con uno en contra, y el original queda marcado como corregido.
 */
export const TiemposDeTicket = ({
  ticketId,
  companyId,
}: {
  ticketId: number;
  companyId: Identifier;
}) => {
  const translate = useTranslate();
  const [registrando, setRegistrando] = useState(false);
  const [corrigiendo, setCorrigiendo] = useState<SoporteTiempo | null>(null);
  const { data: registros = [], total: cuantos } = useGetList<SoporteTiempo>(
    "soporte_tiempos",
    {
      filter: { ticket_id: ticketId },
      sort: { field: "created_at", order: "DESC" },
      pagination: { page: 1, perPage: MAXIMO_DE_REGISTROS },
    },
  );
  const idsDeQuienAtendio = Array.from(
    new Set(registros.map((r) => r.atendio).filter((id) => id != null)),
  );
  const { data: usuarios } = useGetMany<Sale>(
    "sales",
    { ids: idsDeQuienAtendio },
    { enabled: idsDeQuienAtendio.length > 0 },
  );
  const nombre = (id?: SoporteTiempo["atendio"]) => {
    const u = usuarios?.find((s) => String(s.id) === String(id));
    return u ? `${u.first_name} ${u.last_name}` : null;
  };

  const corregidos = new Set(
    registros
      .filter((r) => r.corrige_a != null)
      .map((r) => String(r.corrige_a)),
  );
  const { total, consume } = totalesDeTiempo(registros);

  return (
    <section className="mb-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <h6 className="font-medium">
            {translate("resources.tickets.tiempos.title")}
          </h6>
          {registros.length > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {translate("resources.tickets.tiempos.total", {
                total: formatearMinutos(total),
              })}
              {consume !== total &&
                ` · ${translate("resources.tickets.tiempos.total_consume", {
                  total: formatearMinutos(consume),
                })}`}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRegistrando(true)}
        >
          <Plus className="size-4" />
          {translate("resources.tickets.tiempos.register")}
        </Button>
      </div>

      <BolsaDelMes companyId={companyId} />

      {registros.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {translate("resources.tickets.tiempos.empty")}
        </p>
      ) : (
        <ul className="divide-y rounded-md border text-sm">
          {registros.map((r) => {
            const esCorreccion = r.corrige_a != null;
            const yaCorregido = corregidos.has(String(r.id));
            const quien = nombre(r.atendio);
            return (
              <li key={r.id} className="flex items-start gap-3 p-3">
                <span
                  className={`w-20 shrink-0 font-medium tabular-nums ${
                    r.minutos < 0 || yaCorregido ? "text-muted-foreground" : ""
                  } ${yaCorregido ? "line-through" : ""}`}
                >
                  {formatearMinutos(r.minutos)}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="whitespace-pre-line break-words">
                    {r.descripcion_cliente}
                  </p>
                  {r.nota_interna && (
                    <p className="whitespace-pre-line break-words text-xs text-muted-foreground">
                      <span className="font-medium">
                        {translate("resources.tickets.tiempos.internal")}
                      </span>{" "}
                      {r.nota_interna}
                    </p>
                  )}
                  {esCorreccion && r.motivo_correccion && (
                    <p className="text-xs text-muted-foreground">
                      {r.motivo_correccion}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {formatearFecha(r.fecha_atencion)}
                    </span>
                    {quien && (
                      <span>
                        ·{" "}
                        {translate("resources.tickets.tiempos.attended_by", {
                          name: quien,
                        })}
                      </span>
                    )}
                    {!r.consume && r.motivo_no_consume && (
                      <Badge variant="secondary">
                        {translate(
                          "resources.tickets.tiempos.does_not_consume",
                          {
                            reason: translate(
                              `resources.tickets.tiempos.reasons.${r.motivo_no_consume}`,
                            ),
                          },
                        )}
                      </Badge>
                    )}
                    {esCorreccion && (
                      <Badge variant="outline">
                        {translate("resources.tickets.tiempos.correction")}
                      </Badge>
                    )}
                    {yaCorregido && (
                      <Badge variant="outline">
                        {translate("resources.tickets.tiempos.corrected")}
                      </Badge>
                    )}
                  </div>
                </div>
                {!esCorreccion && !yaCorregido && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCorrigiendo(r)}
                  >
                    {translate("resources.tickets.tiempos.correct")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {cuantos != null && cuantos > registros.length && (
        <p className="mt-1 text-xs text-muted-foreground">
          {registros.length} / {cuantos}
        </p>
      )}

      {registrando && (
        <RegistrarTiempoDialog
          ticketId={ticketId}
          open={registrando}
          onClose={() => setRegistrando(false)}
        />
      )}
      <CorregirTiempoDialog
        key={corrigiendo?.id}
        registro={corrigiendo}
        onClose={() => setCorrigiendo(null)}
      />
    </section>
  );
};

/** A partir de aquí se avisa: hay que pedir autorización pronto. */
const UMBRAL_DE_AVISO = 0.8;

/**
 * La bolsa del cliente en el mes en curso (crm.soporte_resumen): cuánto
 * lleva y cuánto le queda, para pedir la autorización de la hora de más
 * antes de pasarse. Sin bolsa contratada no muestra nada.
 */
const BolsaDelMes = ({ companyId }: { companyId: Identifier }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const { data: resumen } = useQuery({
    queryKey: ["soporte_tiempos", "resumen", String(companyId)],
    queryFn: () => dataProvider.resumenDeSoporte(companyId),
  });
  if (!resumen || resumen.minutos_incluidos <= 0) return null;

  const { minutos_incluidos: incluidos, minutos_usados: usados } = resumen;
  const quedan = Math.max(incluidos - usados, 0);
  const proporcion = usados / incluidos;
  const color =
    proporcion >= 1
      ? "text-destructive"
      : proporcion >= UMBRAL_DE_AVISO
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <p className={`mb-2 text-sm tabular-nums ${color}`}>
      {translate("resources.tickets.tiempos.bolsa", {
        usados: formatearMinutos(usados),
        incluidos: formatearMinutos(incluidos),
      })}
      {" · "}
      {resumen.minutos_de_mas > 0
        ? translate("resources.tickets.tiempos.bolsa_de_mas", {
            minutos: formatearMinutos(resumen.minutos_de_mas),
          })
        : translate("resources.tickets.tiempos.bolsa_quedan", {
            minutos: formatearMinutos(quedan),
          })}
    </p>
  );
};

/** AAAA-MM-DD → DD/MM/AAAA, sin pasar por Date (no se corre de día). */
const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-");
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : fecha;
};
