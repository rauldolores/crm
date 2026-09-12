import { Check, Loader2 } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/lib/env";
import {
  esAdministradorDeLaOrganizacion,
  getPlans,
  openBillingPortal,
  startCheckout,
  type KontroliaEntitlements,
  type KontroliaPlan,
} from "@/lib/kontrolia-auth/facturacion";

import { periodoDeCobro, precioDelPlan } from "./formato";
import { PlanEnterpriseCard } from "./PlanEnterpriseCard";

/** Adónde vuelve la persona tras pagar o cancelar en Stripe. */
export const URL_DE_RETORNO_OK = () =>
  `${window.location.origin}/#/facturacion/ok`;
export const URL_DE_RETORNO_CANCELADO = () =>
  `${window.location.origin}/#/facturacion`;

/** Si quien mira puede comprar: owner o admin de la organización. */
export const useEsAdministrador = (): boolean => {
  const [es, setEs] = useState(false);
  useEffect(() => {
    void esAdministradorDeLaOrganizacion().then(setEs);
  }, []);
  return es;
};

/**
 * Abre el portal de Stripe. Solo para suscripciones de Stripe; las manuales
 * las cambia un administrador de la plataforma. Devuelve el mensaje de error
 * traducido si no se pudo.
 */
export const irAlPortal = async (
  translate: (clave: string) => string,
): Promise<string | null> => {
  try {
    const { url } = await openBillingPortal({
      applicationSlug: env.kontroliaApplicationSlug,
      returnUrl: window.location.href,
    });
    window.location.href = url;
    return null;
  } catch (error: unknown) {
    return mensajeDeError(error, translate);
  }
};

/**
 * El SDK lanza un Error con el texto que devolvió auth-server (ya en
 * español y concreto: «Solo un owner o admin…», «La URL de retorno no está
 * autorizada…», «ya tiene ese plan», «sin Stripe»). Se muestra tal cual; el
 * genérico queda para un fallo sin texto (red caída).
 */
const mensajeDeError = (
  error: unknown,
  translate: (clave: string) => string,
): string =>
  error instanceof Error && error.message
    ? error.message
    : translate("crm.billing.errors.generic");

/**
 * La rejilla de planes: precio, características, cuál es el actual, y el
 * botón de compra para quien puede comprar. Comparte forma entre la pantalla
 * de facturación (dentro de la app) y la de «elige tu plan» (bloqueo).
 */
export const PlanesDisponibles = ({
  derechos,
}: {
  derechos: KontroliaEntitlements | null;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const esAdministrador = useEsAdministrador();

  const [planes, setPlanes] = useState<KontroliaPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comprando, setComprando] = useState<string | null>(null);

  useEffect(() => {
    getPlans(env.kontroliaApplicationSlug)
      .then((lista) =>
        setPlanes([...lista].sort((a, b) => a.sortOrder - b.sortOrder)),
      )
      .catch((fallo: unknown) => setError(mensajeDeError(fallo, translate)));
  }, [translate]);

  const planActual = derechos?.subscription?.planSlug ?? null;

  const comprar = async (plan: KontroliaPlan) => {
    setComprando(plan.slug);
    try {
      const { url } = await startCheckout({
        applicationSlug: env.kontroliaApplicationSlug,
        planSlug: plan.slug,
        successUrl: URL_DE_RETORNO_OK(),
        cancelUrl: URL_DE_RETORNO_CANCELADO(),
      });
      window.location.href = url;
    } catch (fallo: unknown) {
      notify(mensajeDeError(fallo, translate), { type: "error" });
      setComprando(null);
    }
  };

  // El plan Enterprise no viene del catálogo de KontrolIA Auth (no tiene
  // precio, no es algo que "getPlans" pueda devolver), así que se muestra
  // siempre junto a los reales — incluso si el catálogo está vacío, dio
  // error, o todavía está cargando.
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {error ? (
        <p className="text-sm text-destructive sm:col-span-2 lg:col-span-3">
          {error}
        </p>
      ) : !planes ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          {translate("crm.billing.loading_plans")}
        </div>
      ) : planes.length === 0 ? (
        <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
          {translate("crm.billing.no_plans")}
        </p>
      ) : (
        planes.map((plan) => {
          const esActual = plan.slug === planActual;
          const esGratis = plan.priceAmount === 0;
          return (
            <Card
              key={plan.id}
              className={esActual ? "border-primary ring-1 ring-primary" : ""}
            >
              <CardContent className="flex h-full flex-col gap-4 pt-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {esActual && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {translate("crm.billing.current_plan")}
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-2xl font-semibold">
                    {precioDelPlan(plan)}
                  </span>
                  {!esGratis && (
                    <span className="ml-1 text-sm text-muted-foreground">
                      {periodoDeCobro(plan.billingInterval)}
                    </span>
                  )}
                  {plan.trialDays > 0 && !esActual && (
                    <p className="text-xs text-muted-foreground">
                      {translate("crm.billing.trial_days", {
                        smart_count: plan.trialDays,
                      })}
                    </p>
                  )}
                </div>

                {plan.features.length > 0 && (
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {plan.features.map((caracteristica) => (
                      <li key={caracteristica} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{caracteristica}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {plan.limits.length > 0 && (
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {plan.limits.map((limite) => (
                      <li key={limite.key}>
                        {limite.description ?? limite.key}:{" "}
                        {limite.limit === null
                          ? translate("crm.billing.unlimited")
                          : limite.limit}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-2">
                  {esActual ? null : esGratis ? (
                    // Un plan gratis no pasa por Stripe: se asigna solo si es
                    // el plan por defecto, o lo asigna un administrador de la
                    // plataforma desde KontrolIA Auth.
                    <p className="text-xs text-muted-foreground">
                      {translate("crm.billing.free_plan_hint")}
                    </p>
                  ) : esAdministrador ? (
                    <Button
                      className="w-full"
                      disabled={comprando !== null}
                      onClick={() => comprar(plan)}
                    >
                      {comprando === plan.slug ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {translate("crm.billing.choose_plan")}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {translate("crm.billing.ask_admin")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
      <PlanEnterpriseCard />
    </div>
  );
};
