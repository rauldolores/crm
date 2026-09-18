import { Loader2, Sparkles } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { llamarApi } from "../misc/llamarApi";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Ticket } from "../types";

/**
 * Propone prioridad y categoría a partir del asunto y la descripción, con
 * las listas de Ajustes. Rellena los campos del formulario y dice por qué;
 * quien captura sigue decidiendo (los campos quedan editables).
 */
export const SugerirConIaButton = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const { ticketPriorities, ticketCategories } = useConfigurationContext();
  const { getValues, setValue } = useFormContext<Ticket>();
  const [cargando, setCargando] = useState(false);

  const sugerir = async () => {
    const subject = getValues("subject") ?? "";
    const description = getValues("description") ?? "";
    if (!subject.trim() && !description.trim()) {
      notify("resources.tickets.ai.classify_empty", { type: "warning" });
      return;
    }
    setCargando(true);
    try {
      const sugerencia = await llamarApi<{
        priority: string | null;
        category: string | null;
        motivo: string;
      }>("/api/ia/tickets/clasificar", {
        method: "POST",
        body: JSON.stringify({ subject, description }),
      });
      if (sugerencia.priority) {
        setValue("priority", sugerencia.priority, { shouldDirty: true });
      }
      if (sugerencia.category) {
        setValue("category", sugerencia.category, { shouldDirty: true });
      }
      const prioridad = ticketPriorities.find(
        (p) => p.value === sugerencia.priority,
      )?.label;
      const categoria = ticketCategories.find(
        (c) => c.value === sugerencia.category,
      )?.label;
      notify(
        [[prioridad, categoria].filter(Boolean).join(" · "), sugerencia.motivo]
          .filter(Boolean)
          .join(" — "),
        { type: "info", autoHideDuration: 8000 },
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.tickets.ai.classify_error"),
        { type: "error" },
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      disabled={cargando}
      onClick={sugerir}
    >
      {cargando ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {translate("resources.tickets.ai.classify")}
    </Button>
  );
};
