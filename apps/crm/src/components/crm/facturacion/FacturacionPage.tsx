import { CreditCard, Loader2 } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { facturacionDisponible } from "@/lib/kontrolia-auth/facturacion";

import { ConsumoDelPlan } from "./ConsumoDelPlan";
import { RUTA_FACTURACION } from "./GuardiaDePlan";
import { fechaLarga } from "./formato";
import {
  irAlPortal,
  PlanesDisponibles,
  useEsAdministrador,
} from "./PlanesDisponibles";
import { useDerechos } from "./useDerechos";

const ESTADOS: Record<string, string> = {
  trialing: "crm.billing.status.trialing",
  active: "crm.billing.status.active",
  past_due: "crm.billing.status.past_due",
  canceled: "crm.billing.status.canceled",
  expired: "crm.billing.status.expired",
};

/**
 * Plan y facturación de la organización: qué plan tiene, en qué estado,
 * cuánto lleva consumido de cada límite, la puerta al portal de Stripe y los
 * demás planes disponibles. Dentro del layout, para quien ya está dentro.
 *
 * Vinqulia se instala de dos formas: como SaaS (con planes en KontrolIA
 * Auth) o por cuenta propia, sin nada de esto. En la segunda, la pantalla lo
 * dice y no pinta planes.
 */
export const FacturacionPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const { derechos, cargando, error, recargar } = useDerechos();
  const esAdministrador = useEsAdministrador();
  const [abriendoPortal, setAbriendoPortal] = useState(false);

  const suscripcion = derechos?.subscription ?? null;
  const puedeIrAlPortal = esAdministrador && suscripcion?.provider === "stripe";

  const abrirPortal = async () => {
    setAbriendoPortal(true);
    const fallo = await irAlPortal(translate);
    if (fallo) {
      notify(fallo, { type: "error" });
      setAbriendoPortal(false);
    }
  };

  if (!facturacionDisponible()) {
    return (
      <div className="max-w-5xl mx-auto mt-8 mb-16 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">
          {translate("crm.billing.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {translate("crm.billing.self_hosted")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.billing.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.billing.intro")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.billing.your_plan")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {cargando && !derechos ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {translate("crm.billing.checking")}
            </div>
          ) : error && !derechos ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-destructive">
                {translate("crm.billing.errors.unreachable")}
              </p>
              <div>
                <Button variant="outline" onClick={() => recargar()}>
                  {translate("crm.billing.retry")}
                </Button>
              </div>
            </div>
          ) : derechos && !derechos.plansRequired && !suscripcion ? (
            <p className="text-sm text-muted-foreground">
              {translate("crm.billing.not_required")}
            </p>
          ) : suscripcion ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    {suscripcion.planName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {translate(
                      ESTADOS[suscripcion.status] ?? suscripcion.status,
                    )}
                    {suscripcion.currentPeriodEnd
                      ? ` · ${translate(
                          suscripcion.cancelAtPeriodEnd
                            ? "crm.billing.ends_on"
                            : "crm.billing.renews_on",
                          { date: fechaLarga(suscripcion.currentPeriodEnd) },
                        )}`
                      : ""}
                  </p>
                  {suscripcion.provider === "manual" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {translate("crm.billing.manual_subscription")}
                    </p>
                  )}
                </div>
                {puedeIrAlPortal && (
                  <Button
                    variant="outline"
                    disabled={abriendoPortal}
                    onClick={abrirPortal}
                  >
                    {abriendoPortal ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {translate("crm.billing.open_portal")}
                  </Button>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">
                  {translate("crm.billing.usage_title")}
                </p>
                <ConsumoDelPlan usage={derechos?.usage ?? []} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {translate("crm.billing.no_subscription")}
            </p>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          {translate("crm.billing.plans_title")}
        </h2>
        <PlanesDisponibles derechos={derechos} />
      </section>
    </div>
  );
};

FacturacionPage.path = RUTA_FACTURACION;
