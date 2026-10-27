import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  Ban,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Phone,
} from "lucide-react";
import { RecordContextProvider, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  destinosPosibles,
  diasHabiles,
  etapaDeDescarte,
  etapaSugerida,
  type ResultadoDeMiDia,
} from "@/lib/miDia/etapas";
import type { FilaDeMiDia as Fila } from "@/lib/miDia/tipos";
import { cn } from "@/lib/utils";

import { EnviarCorreoButton } from "../contacts/EnviarCorreoButton";
import { EnviarWhatsAppButton } from "../contacts/EnviarWhatsAppButton";
import { llamarApi } from "../misc/llamarApi";
import { useConfigurationContext } from "../root/ConfigurationContext";

/**
 * Un prospecto de «Mi día»: quién es, qué toca, cómo contactarlo y qué pasó.
 *
 * El canal con el que se le escribió (WhatsApp, correo, llamada) se recuerda
 * al pulsarlo y es el tipo de la nota que deja el resultado; si la tarea ya
 * decía el canal (una llamada, una visita), ese es el de partida.
 */

/** El tipo de nota que corresponde a cada tipo de tarea con canal. */
const CANAL_DE_TAREA: Record<string, string> = {
  call: "call",
  email: "email",
  visita: "visita",
  whatsapp: "whatsapp",
};

const POSPOSICIONES = [
  { clave: "crm.my_day.postpone_tomorrow", dias: 1 },
  { clave: "crm.my_day.postpone_three", dias: 3 },
  { clave: "crm.my_day.postpone_week", dias: 5 },
];

export const FilaDeMiDia = ({
  fila,
  inicioDelDia,
  onHecho,
}: {
  fila: Fila;
  inicioDelDia: Date;
  onHecho: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { dealPipelines, dealLossReasons, noteTypes, requireIncomeToWin } =
    useConfigurationContext();
  const [nota, setNota] = useState("");
  const [canal, setCanal] = useState<string | null>(
    (fila.tarea?.type && CANAL_DE_TAREA[fila.tarea.type]) || null,
  );
  const [guardando, setGuardando] = useState(false);

  const { oportunidad, contacto, tarea, empresa } = fila;
  const embudo = dealPipelines.find((e) => e.value === oportunidad?.pipeline);
  const etapaActual = embudo?.stages.find(
    (e) => e.value === oportunidad?.stage,
  );
  const nombreDelCanal =
    noteTypes.find((tipo) => tipo.value === canal)?.label ?? null;
  const siguiente =
    embudo && oportunidad
      ? etapaSugerida(embudo, oportunidad.stage, nombreDelCanal)
      : null;
  const destinos =
    embudo && oportunidad
      ? destinosPosibles(embudo, oportunidad.stage, requireIncomeToWin).filter(
          (etapa) => etapa.value !== siguiente?.value,
        )
      : [];
  const sePuedeDescartar = Boolean(embudo && etapaDeDescarte(embudo));

  const nombre =
    [contacto?.first_name, contacto?.last_name].filter(Boolean).join(" ") ||
    empresa?.name ||
    oportunidad?.name ||
    translate("crm.my_day.no_contact");
  const telefono = contacto?.phone_jsonb?.find((t) => t.number?.trim())?.number;
  const vencida =
    tarea?.due_date && new Date(tarea.due_date) < inicioDelDia
      ? formatDistanceToNow(new Date(tarea.due_date), {
          addSuffix: true,
          locale: es,
        })
      : null;

  const registrar = async (resultado: ResultadoDeMiDia) => {
    setGuardando(true);
    try {
      await llamarApi("/api/mi-dia/resultado", {
        method: "POST",
        body: JSON.stringify({
          dealId: oportunidad?.id ?? null,
          contactId: contacto?.id ?? null,
          tareaId: tarea?.id ?? null,
          canal,
          nota,
          resultado,
        }),
      });
      notify("crm.my_day.saved", { messageArgs: { name: nombre } });
      onHecho();
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error), {
        type: "error",
      });
      setGuardando(false);
    }
  };

  const posponer = (dias: number) =>
    registrar({
      tipo: "posponer",
      fecha: diasHabiles(new Date(), dias).at(-1)!.toISOString(),
    });

  return (
    <li className="min-w-0 rounded-2xl bg-card p-4 shadow-tarjeta space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="font-semibold leading-tight">
            {contacto ? (
              <Link
                to={`/contacts/${contacto.id}/show`}
                className="hover:underline"
              >
                {nombre}
              </Link>
            ) : (
              nombre
            )}
            {contacto?.title && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {contacto.title}
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {empresa?.name}
            {empresa?.name && oportunidad && " · "}
            {oportunidad ? (
              <Link
                to={`/deals/${oportunidad.id}/show`}
                className="hover:underline"
              >
                {oportunidad.name}
              </Link>
            ) : (
              translate("crm.my_day.no_deal")
            )}
          </p>
        </div>
        {etapaActual && <Badge variant="secondary">{etapaActual.label}</Badge>}
      </div>

      {tarea && (
        <p className="text-sm">
          <span
            className={cn(
              "mr-2 text-xs font-semibold",
              vencida ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {vencida
              ? translate("crm.my_day.overdue", { when: vencida })
              : translate("crm.my_day.due_today")}
          </span>
          {tarea.text}
        </p>
      )}

      {contacto && (
        <RecordContextProvider value={contacto}>
          <div className="flex flex-wrap gap-2 [&_a]:h-8 [&_button]:h-8">
            <span onClickCapture={() => setCanal("whatsapp")}>
              <EnviarWhatsAppButton />
            </span>
            <span onClickCapture={() => setCanal("email")}>
              <EnviarCorreoButton />
            </span>
            {telefono && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCanal("call")}
              >
                <a href={`tel:${telefono.replace(/[^\d+]/g, "")}`}>
                  <Phone className="w-4 h-4" />
                  {translate("crm.my_day.call")}
                </a>
              </Button>
            )}
          </div>
        </RecordContextProvider>
      )}

      <Input
        value={nota}
        onChange={(evento) => setNota(evento.target.value)}
        placeholder={translate("crm.my_day.note_placeholder")}
        aria-label={translate("crm.my_day.note_placeholder")}
        disabled={guardando}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={guardando}
          onClick={() =>
            registrar(
              siguiente
                ? { tipo: "mover", etapa: siguiente.value }
                : { tipo: "quedarse" },
            )
          }
        >
          {guardando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : siguiente ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {siguiente
            ? translate("crm.my_day.advance", { stage: siguiente.label })
            : translate("crm.my_day.done")}
        </Button>

        {oportunidad && (siguiente || destinos.length > 0) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={guardando}>
                {translate("crm.my_day.move_to")}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {siguiente && (
                <>
                  <DropdownMenuItem
                    onSelect={() => registrar({ tipo: "quedarse" })}
                  >
                    {translate("crm.my_day.stay")}
                  </DropdownMenuItem>
                  {destinos.length > 0 && <DropdownMenuSeparator />}
                </>
              )}
              {destinos.map((etapa) => (
                <DropdownMenuItem
                  key={etapa.value}
                  onSelect={() =>
                    registrar({ tipo: "mover", etapa: etapa.value })
                  }
                >
                  {etapa.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {(tarea || contacto) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={guardando}>
                <Clock className="w-4 h-4" />
                {translate("crm.my_day.postpone")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {POSPOSICIONES.map(({ clave, dias }) => (
                <DropdownMenuItem key={clave} onSelect={() => posponer(dias)}>
                  {translate(clave)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {sePuedeDescartar && dealLossReasons.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={guardando}
              >
                <Ban className="w-4 h-4" />
                {translate("crm.my_day.discard")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>
                {translate("crm.my_day.discard_reason")}
              </DropdownMenuLabel>
              {dealLossReasons.map((motivo) => (
                <DropdownMenuItem
                  key={motivo.value}
                  onSelect={() =>
                    registrar({ tipo: "descartar", motivo: motivo.value })
                  }
                >
                  {motivo.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
};
