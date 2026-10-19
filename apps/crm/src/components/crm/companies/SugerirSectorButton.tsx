import { Loader2, Sparkles } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";

import { llamarApi } from "../misc/llamarApi";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company } from "../types";

/**
 * Propone el sector a partir del nombre y el sitio web, con la lista de
 * Ajustes. Rellena el desplegable y dice lo seguro que está; el campo queda
 * editable, como cualquier otro.
 *
 * Existe porque el sector es el campo por el que después se segmenta y el que
 * nadie rellena: un desplegable de veinte opciones se omite siempre.
 */
export const SugerirSectorButton = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const { companySectors } = useConfigurationContext();
  const { getValues, setValue } = useFormContext<Company>();
  const [cargando, setCargando] = useState(false);

  const sugerir = async () => {
    const name = getValues("name") ?? "";
    if (!name.trim()) {
      notify("resources.companies.ai.sector_empty", { type: "warning" });
      return;
    }
    setCargando(true);
    try {
      const sugerencia = await llamarApi<{
        sector: string | null;
        confianza: number | null;
      }>("/api/ia/empresas/sector", {
        method: "POST",
        body: JSON.stringify({ name, website: getValues("website") ?? "" }),
      });
      if (!sugerencia.sector) {
        notify("resources.companies.ai.sector_unknown", { type: "info" });
        return;
      }
      setValue("sector", sugerencia.sector, { shouldDirty: true });
      const etiqueta = companySectors.find(
        (s) => s.value === sugerencia.sector,
      )?.label;
      notify(
        translate("resources.companies.ai.sector_done", {
          sector: etiqueta ?? sugerencia.sector,
          porcentaje:
            sugerencia.confianza == null
              ? "—"
              : `${Math.round(sugerencia.confianza * 100)} %`,
        }),
        { type: "info", autoHideDuration: 8000 },
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.companies.ai.sector_error"),
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
      {translate("resources.companies.ai.sector")}
    </Button>
  );
};
