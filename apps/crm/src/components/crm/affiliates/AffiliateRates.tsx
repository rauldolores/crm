import { Plus, Trash2 } from "lucide-react";
import {
  CanAccess,
  useCreate,
  useDelete,
  useGetList,
  useNotify,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AffiliateApplication, AffiliateRate } from "../types";

const SOLUCIONES: AffiliateApplication[] = [
  "facturacion",
  "crm",
  "nodia-agents",
  "aduaniax",
  "diagnostico",
];

/**
 * Tasas negociadas por solución (crm.affiliate_rates). La que no esté aquí
 * usa la comisión general del afiliado.
 */
export const AffiliateRates = ({ afiliadoId }: { afiliadoId: Identifier }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [create, { isPending: creando }] = useCreate();
  const [deleteOne] = useDelete();
  const [solucion, setSolucion] = useState<AffiliateApplication | "">("");
  const [porcentaje, setPorcentaje] = useState("");

  const { data: tasas, refetch } = useGetList<AffiliateRate>(
    "affiliate_rates",
    {
      filter: { affiliate_id: afiliadoId },
      pagination: { page: 1, perPage: 20 },
      sort: { field: "application_slug", order: "ASC" },
    },
  );

  const usadas = new Set((tasas ?? []).map((t) => t.application_slug));
  const libres = SOLUCIONES.filter((s) => !usadas.has(s));
  const valor = Number(porcentaje);
  const valido = !!solucion && porcentaje !== "" && valor >= 0 && valor <= 100;

  const agregar = () => {
    if (!valido) return;
    create(
      "affiliate_rates",
      {
        data: {
          affiliate_id: afiliadoId,
          application_slug: solucion,
          percentage: valor,
        },
      },
      {
        onSuccess: () => {
          notify("crm.affiliates.rates.saved", { type: "success" });
          setSolucion("");
          setPorcentaje("");
          refetch();
        },
        onError: (error) => notify((error as Error).message, { type: "error" }),
      },
    );
  };

  const quitar = (tasa: AffiliateRate) =>
    deleteOne(
      "affiliate_rates",
      { id: tasa.id, previousData: tasa },
      {
        onSuccess: () => {
          notify("crm.affiliates.rates.deleted", { type: "info" });
          refetch();
        },
      },
    );

  return (
    <section>
      <p className="text-muted-foreground mb-1 text-sm">
        {translate("crm.affiliates.rates.title")}
      </p>
      <p className="text-xs text-muted-foreground mb-2">
        {translate("crm.affiliates.rates.intro")}
      </p>
      {!tasas?.length ? (
        <p className="text-sm text-muted-foreground mb-2">
          {translate("crm.affiliates.rates.empty")}
        </p>
      ) : (
        <ul className="mb-2 divide-y rounded-md border text-sm">
          {tasas.map((tasa) => (
            <li
              key={tasa.id}
              className="flex items-center justify-between px-3 py-1.5"
            >
              <span>
                {translate(
                  `crm.affiliates.rates.applications.${tasa.application_slug}`,
                )}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-medium">{tasa.percentage}%</span>
                <CanAccess resource="configuration" action="edit">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={translate("ra.action.delete")}
                    onClick={() => quitar(tasa)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CanAccess>
              </span>
            </li>
          ))}
        </ul>
      )}
      <CanAccess resource="configuration" action="edit">
        {libres.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={solucion}
              onValueChange={(v) => setSolucion(v as AffiliateApplication)}
            >
              <SelectTrigger className="h-8 w-56">
                <SelectValue
                  placeholder={translate("crm.affiliates.rates.application")}
                />
              </SelectTrigger>
              <SelectContent>
                {libres.map((s) => (
                  <SelectItem key={s} value={s}>
                    {translate(`crm.affiliates.rates.applications.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.5"
              className="h-8 w-28"
              placeholder={translate("crm.affiliates.rates.percentage")}
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!valido || creando}
              onClick={agregar}
            >
              <Plus className="h-3.5 w-3.5" />
              {translate("crm.affiliates.rates.add")}
            </Button>
          </div>
        )}
      </CanAccess>
    </section>
  );
};
