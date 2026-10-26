import { ChevronUp } from "lucide-react";
import { useTranslate } from "ra-core";
import { Link } from "react-router";

import type { KontroliaEntitlements } from "@/lib/kontrolia-auth/facturacion";

import { ConsumoDelPlan } from "./ConsumoDelPlan";
import { FacturacionPage } from "./FacturacionPage";

type Suscripcion = NonNullable<KontroliaEntitlements["subscription"]>;

const ESTADOS_SANOS = ["active", "trialing"];

const COBRO: Record<Suscripcion["billingInterval"], string> = {
  month: "Pago mensual",
  year: "Pago anual",
  one_time: "Pago único",
};

/**
 * Color del punto de estado: verde tiene que significar «todo bien». Rojo
 * con un pago pendiente o un límite agotado; ámbar al pasar del 80 %. Los
 * mismos cortes que las barras de ConsumoDelPlan.
 */
const colorDelPunto = (
  suscripcion: Suscripcion,
  usage: KontroliaEntitlements["usage"],
): string => {
  const conLimite = usage.filter((uso) => uso.limit !== null);
  if (
    !ESTADOS_SANOS.includes(suscripcion.status) ||
    conLimite.some((uso) => uso.used >= (uso.limit ?? 0))
  ) {
    return "bg-rose-500";
  }
  if (conLimite.some((uso) => uso.used >= (uso.limit ?? 0) * 0.8)) {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
};

/**
 * El plan al pie de la barra lateral, plegado: solo el nombre y un punto de
 * estado. Al pasar el ratón (o con el foco del teclado) crece hacia arriba,
 * encima del menú y sin empujarlo, y enseña el consumo de cada límite. Igual
 * que la tarjeta del plan de AduaniaX (components/billing/tarjeta-plan.tsx).
 */
export const TarjetaDelPlan = ({
  subscription,
  usage,
}: {
  subscription: Suscripcion;
  usage: KontroliaEntitlements["usage"];
}) => {
  const translate = useTranslate();

  return (
    // El hueco guarda la altura de la tarjeta cerrada; la tarjeta va pegada
    // abajo y al abrirse crece hacia arriba.
    <div className="relative h-[46px] w-full">
      <Link
        to={FacturacionPage.path}
        title={translate("crm.billing.title")}
        className="group absolute inset-x-0 bottom-0 z-30 block rounded-2xl border border-white/5 bg-sidebar-raised px-3 py-3 text-sidebar-strong no-underline transition-[border-color,box-shadow] duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 focus-visible:border-white/10"
      >
        {/* 0fr → 1fr: anima la altura real del contenido, sin medirla. */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <div className="pb-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:delay-100 group-focus-visible:opacity-100">
              <p className="mb-2.5 text-[11px] font-semibold text-sidebar-foreground/60">
                {COBRO[subscription.billingInterval]}
              </p>
              {usage.length > 0 ? (
                <ConsumoDelPlan usage={usage} compacto />
              ) : (
                <p className="text-xs opacity-80">
                  {translate("crm.billing.no_limits")}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex h-5 items-center gap-2">
          <span
            className={`size-2 shrink-0 rounded-full ${colorDelPunto(subscription, usage)}`}
          />
          {/* Vino fijo en ambos temas: la tarjeta es oscura en los dos. Es el
              tono más vino que sigue pasando AA a 11px sobre la barra. */}
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold tracking-wider text-[#d97485] uppercase">
            {translate("crm.billing.plan_named", {
              // El nombre del plan ya suele venir como «Plan Impulso»: sin
              // esto se leería «Plan Plan Impulso». El intervalo de cobro va
              // en el detalle, para que plegada quepa en una línea.
              plan: subscription.planName.replace(/^plan\s+/i, ""),
            })}
          </span>
          <ChevronUp className="size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-300 group-hover:rotate-180 group-focus-visible:rotate-180" />
        </div>
      </Link>
    </div>
  );
};
