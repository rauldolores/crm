import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, X } from "lucide-react";
import { useCreate, useGetIdentity, useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import { llamarApi } from "../misc/llamarApi";
import type { Ticket } from "../types";

/**
 * Resumen del hilo por IA (qué pide, qué se hizo, qué falta), para quien
 * llega a un ticket largo y tiene que responder ya. No se guarda solo: se
 * ofrece dejarlo como nota, que es donde el resto del equipo lo verá.
 */
export const ResumenConIa = ({ ticket }: { ticket: Ticket }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { identity } = useGetIdentity();
  const [create, { isPending: guardando }] = useCreate();
  const [resumen, setResumen] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const resumir = async () => {
    setCargando(true);
    try {
      const { resumen } = await llamarApi<{ resumen: string }>(
        "/api/ia/tickets/resumen",
        { method: "POST", body: JSON.stringify({ ticketId: ticket.id }) },
      );
      setResumen(resumen);
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.tickets.ai.summary_error"),
        { type: "error" },
      );
    } finally {
      setCargando(false);
    }
  };

  const guardarComoNota = () => {
    if (!resumen) return;
    create(
      "ticket_notes",
      {
        data: {
          ticket_id: ticket.id,
          text: `${translate("resources.tickets.ai.summary_note_prefix")}\n\n${resumen}`,
          type: "note",
          date: new Date().toISOString(),
          sales_id: identity?.id,
        },
      },
      {
        onSuccess: () => {
          notify("resources.tickets.ai.summary_saved", { type: "success" });
          void queryClient.invalidateQueries({ queryKey: ["ticket_notes"] });
          setResumen(null);
        },
        onError: () =>
          notify("resources.tickets.ai.summary_error", { type: "error" }),
      },
    );
  };

  if (resumen === null) {
    return (
      <Button variant="outline" size="sm" disabled={cargando} onClick={resumir}>
        {cargando ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {translate("resources.tickets.ai.summarize")}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" />
          {translate("resources.tickets.ai.summary_title")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label={translate("ra.action.close")}
          onClick={() => setResumen(null)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <p className="whitespace-pre-wrap">{resumen}</p>
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          disabled={guardando}
          onClick={guardarComoNota}
        >
          {translate("resources.tickets.ai.save_as_note")}
        </Button>
      </div>
    </div>
  );
};
