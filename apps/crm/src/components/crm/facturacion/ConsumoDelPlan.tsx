import { useTranslate } from "ra-core";

import type { KontroliaUsage } from "@/lib/kontrolia-auth/facturacion";

import { etiquetaDePeriodo } from "./formato";

/** Nombres legibles de las claves de límite que configura el administrador. */
const NOMBRES: Record<string, string> = {
  "contactos.registrados": "Contactos registrados",
  usuarios: "Usuarios",
  pipelines: "Embudos",
};

export const nombreDelLimite = (uso: KontroliaUsage): string =>
  uso.description ?? NOMBRES[uso.key] ?? uso.key;

/** Barra de un límite: «37 de 100 este mes». Sin límite, solo el conteo. */
const BarraDeUso = ({
  uso,
  compacto,
}: {
  uso: KontroliaUsage;
  compacto: boolean;
}) => {
  const translate = useTranslate();
  const porcentaje =
    uso.limit === null || uso.limit === 0
      ? 0
      : Math.min(100, Math.round((uso.used / uso.limit) * 100));
  const agotado = uso.limit !== null && uso.used >= uso.limit;
  const cerca = !agotado && porcentaje >= 80;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={compacto ? "truncate opacity-80" : "font-medium"}>
          {nombreDelLimite(uso)}
        </span>
        <span
          className={[
            "shrink-0 tabular-nums",
            agotado ? "text-destructive" : cerca ? "text-amber-500" : "",
          ].join(" ")}
        >
          {uso.limit === null
            ? translate("crm.billing.usage_unlimited", { used: uso.used })
            : translate("crm.billing.usage_of", {
                used: uso.used,
                limit: uso.limit,
                period: etiquetaDePeriodo(uso.period),
              })}
        </span>
      </div>
      {uso.limit !== null && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-current/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={uso.limit}
          aria-valuenow={uso.used}
          aria-label={nombreDelLimite(uso)}
        >
          <div
            className={[
              "h-full rounded-full transition-all",
              agotado
                ? "bg-destructive"
                : cerca
                  ? "bg-amber-500"
                  : "bg-primary",
            ].join(" ")}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * El consumo actual de cada límite del plan. `compacto` es la versión de la
 * barra lateral: mismo dato, menos tinta.
 */
export const ConsumoDelPlan = ({
  usage,
  compacto = false,
}: {
  usage: KontroliaUsage[];
  compacto?: boolean;
}) => {
  const translate = useTranslate();
  if (usage.length === 0) {
    return compacto ? null : (
      <p className="text-sm text-muted-foreground">
        {translate("crm.billing.no_limits")}
      </p>
    );
  }
  return (
    <div className={compacto ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
      {usage.map((uso) => (
        <BarraDeUso key={uso.key} uso={uso} compacto={compacto} />
      ))}
    </div>
  );
};
