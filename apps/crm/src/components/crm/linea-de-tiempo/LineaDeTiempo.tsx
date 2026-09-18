import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Paperclip,
} from "lucide-react";
import {
  InfiniteListBase,
  ResourceContextProvider,
  useGetOne,
  useListContext,
  useTranslate,
} from "ra-core";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { InfinitePagination } from "../misc/InfinitePagination";
import { Markdown } from "../misc/Markdown";
import { RelativeDate } from "../misc/RelativeDate";
import { Status } from "../misc/Status";
import { Note } from "../notes/Note";
import { NoteCreate } from "../notes/NoteCreate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { useGetSalesName } from "../sales/useGetSalesName";
import type { ContactNote } from "../types";
import {
  agruparPorMes,
  claveDeEtiqueta,
  type EventoDeLaLinea,
  type FiltroDeLaLinea,
  iconoDelEvento,
  resumenDe,
} from "./eventos";

const POR_PAGINA = 25;

/**
 * Línea de tiempo del contacto: todo lo que le ha pasado (notas, llamadas,
 * WhatsApp, correos, tareas, oportunidades, tickets, cotizaciones) en una
 * sola cronología, agrupada por mes, con un resumen de una línea por evento
 * y el detalle completo a un clic. Sale de la vista crm.contact_timeline.
 *
 * El alta de notas sigue arriba, como siempre: se crea en contact_notes
 * (de ahí el ResourceContextProvider) pero se refresca esta lista.
 */
export const LineaDeTiempo = ({
  contactId,
}: {
  contactId: string | number;
}) => {
  const [filtro, setFiltro] = useState<FiltroDeLaLinea>({ todo: true });
  const filtroDeLista =
    "todo" in filtro
      ? {}
      : "kind" in filtro
        ? { kind: filtro.kind }
        : { type: filtro.type };

  return (
    <InfiniteListBase
      resource="contact_timeline"
      filter={{ contact_id: contactId, ...filtroDeLista }}
      sort={{ field: "date", order: "DESC" }}
      perPage={POR_PAGINA}
      disableSyncWithLocation
      storeKey={false}
    >
      <ResourceContextProvider value="contact_notes">
        <NoteCreate reference="contacts" showStatus className="mt-4" />
      </ResourceContextProvider>
      <Filtros filtro={filtro} onChange={setFiltro} />
      <Cronologia />
    </InfiniteListBase>
  );
};

const Filtros = ({
  filtro,
  onChange,
}: {
  filtro: FiltroDeLaLinea;
  onChange: (filtro: FiltroDeLaLinea) => void;
}) => {
  const translate = useTranslate();
  const { noteTypes } = useConfigurationContext();
  const activo = (candidato: FiltroDeLaLinea) =>
    JSON.stringify(candidato) === JSON.stringify(filtro);
  const opciones: { etiqueta: string; valor: FiltroDeLaLinea }[] = [
    { etiqueta: translate("crm.timeline.filters.all"), valor: { todo: true } },
    ...noteTypes.map((tipo) => ({
      etiqueta: tipo.label,
      valor: { type: tipo.value } as FiltroDeLaLinea,
    })),
    {
      etiqueta: translate("crm.timeline.filters.tasks"),
      valor: { kind: "task" },
    },
    {
      etiqueta: translate("crm.timeline.filters.deals"),
      valor: { kind: "deal" },
    },
    {
      etiqueta: translate("crm.timeline.filters.tickets"),
      valor: { kind: "ticket" },
    },
    {
      etiqueta: translate("crm.timeline.filters.quotes"),
      valor: { kind: "quote" },
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={translate("crm.timeline.filters.label")}
      className="mt-6 flex flex-wrap gap-1.5"
    >
      {opciones.map((opcion) => (
        <button
          key={opcion.etiqueta}
          type="button"
          role="radio"
          aria-checked={activo(opcion.valor)}
          onClick={() => onChange(opcion.valor)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            activo(opcion.valor)
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
};

/**
 * Editar o borrar una nota desde el detalle invalida `contact_notes`, no
 * esta vista: se escucha esa invalidación para volver a pedir la cronología.
 */
const useRefrescarCuandoCambienLasNotas = (refetch: () => void) => {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((evento) => {
        if (
          evento.type === "updated" &&
          evento.action.type === "invalidate" &&
          evento.query.queryKey[0] === "contact_notes"
        ) {
          refetch();
        }
      }),
    [queryClient, refetch],
  );
};

const Cronologia = () => {
  const translate = useTranslate();
  const { data, isPending, error, total, refetch } =
    useListContext<EventoDeLaLinea>();
  useRefrescarCuandoCambienLasNotas(refetch);

  if (isPending || error) return null;
  const eventos = data ?? [];
  if (eventos.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        {translate("crm.timeline.empty")}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-xs text-muted-foreground">
        {translate("crm.timeline.count", {
          smart_count: total ?? eventos.length,
        })}
      </p>
      {agruparPorMes(eventos).map((grupo) => (
        <section key={grupo.mes} className="mt-4">
          <h3 className="sticky top-0 z-10 bg-card py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {grupo.mes}
          </h3>
          <ol className="mt-1 border-l border-border pl-4">
            {grupo.eventos.map((evento) => (
              <Evento key={evento.id} evento={evento} />
            ))}
          </ol>
        </section>
      ))}
      <InfinitePagination />
    </div>
  );
};

const Evento = ({ evento }: { evento: EventoDeLaLinea }) => {
  const translate = useTranslate();
  const { noteTypes } = useConfigurationContext();
  const [abierto, setAbierto] = useState(false);
  const nombre = useGetSalesName(evento.sales_id ?? undefined, {
    enabled: evento.sales_id != null,
  });
  const Icono = iconoDelEvento(evento);
  const etiqueta =
    evento.kind === "note"
      ? (noteTypes.find((tipo) => tipo.value === evento.type)?.label ??
        translate("crm.timeline.events.note"))
      : translate(claveDeEtiqueta(evento));
  const cambioDeEtapa = useCambioDeEtapa(evento);
  const resumen = cambioDeEtapa
    ? [evento.title, cambioDeEtapa].filter(Boolean).join(" — ")
    : evento.title
      ? [evento.title, resumenDe(evento.text)].filter(Boolean).join(" — ")
      : resumenDe(evento.text);

  return (
    <li className="relative py-1.5">
      <span className="absolute -left-[21px] top-2.5 flex size-2.5 items-center justify-center rounded-full bg-border" />
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="flex w-full items-start gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/60"
      >
        {abierto ? (
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{etiqueta}</span>
            <RelativeDate date={evento.date} />
            {nombre && <span>· {nombre}</span>}
            {evento.attachment_count > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Paperclip className="size-3" />
                {evento.attachment_count}
              </span>
            )}
            {evento.kind === "note" && evento.status && (
              <Status status={evento.status} />
            )}
          </span>
          {!abierto && resumen && (
            <span className="block truncate text-sm">{resumen}</span>
          )}
        </span>
      </button>
      {abierto && (
        <div className="ml-7 mt-1">
          {evento.kind === "note" ? (
            <DetalleDeNota id={evento.source_id} />
          ) : (
            <DetalleDeEvento evento={evento} />
          )}
        </div>
      )}
    </li>
  );
};

/**
 * «de Contactado a Propuesta»: un cambio de etapa guarda en `status` la
 * etapa anterior y en `text` la nueva (slugs); aquí se traducen a etiquetas.
 */
const useCambioDeEtapa = (evento: EventoDeLaLinea): string | null => {
  const translate = useTranslate();
  const { dealStages } = useConfigurationContext();
  if (evento.type !== "deal_stage") return null;
  const etiqueta = (slug: string | null) =>
    dealStages.find((s) => s.value === slug)?.label ?? slug ?? "";
  return translate("crm.timeline.events.deal_stage_detail", {
    from: etiqueta(evento.status),
    to: etiqueta(evento.text),
  });
};

/** La nota íntegra, con adjuntos, edición y borrado: el mismo componente de siempre. */
const DetalleDeNota = ({ id }: { id: string | number }) => {
  const translate = useTranslate();
  const { data, isPending } = useGetOne<ContactNote & { id: string | number }>(
    "contact_notes",
    { id },
  );
  if (isPending) {
    return (
      <p className="text-xs text-muted-foreground">
        {translate("crm.timeline.loading")}
      </p>
    );
  }
  if (!data) return null;
  return (
    <ResourceContextProvider value="contact_notes">
      <Note note={data} isLast showStatus />
    </ResourceContextProvider>
  );
};

const DetalleDeEvento = ({ evento }: { evento: EventoDeLaLinea }) => {
  const translate = useTranslate();
  const { currency, dealStages } = useConfigurationContext();
  const cambioDeEtapa = useCambioDeEtapa(evento);
  const enlace =
    evento.kind === "deal"
      ? `/deals/${evento.source_id}/show`
      : evento.kind === "ticket"
        ? `/tickets/${evento.source_id}/show`
        : null;
  const etapa = cambioDeEtapa
    ? cambioDeEtapa
    : evento.kind === "deal"
      ? (dealStages.find((s) => s.value === evento.status)?.label ??
        evento.status)
      : evento.status;

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      {evento.title && <p className="font-medium">{evento.title}</p>}
      <p className="mt-0.5 text-xs text-muted-foreground">
        {[
          etapa,
          evento.amount != null
            ? evento.amount.toLocaleString("es-ES", {
                style: "currency",
                currency,
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: 0,
              })
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {evento.text && !cambioDeEtapa && (
        <div className="mt-2">
          <Markdown>{evento.text}</Markdown>
        </div>
      )}
      {enlace && (
        <Button asChild variant="link" size="sm" className="mt-1 h-auto px-0">
          <Link to={enlace}>
            <ExternalLink className="size-3.5" />
            {translate("crm.timeline.open")}
          </Link>
        </Button>
      )}
    </div>
  );
};
