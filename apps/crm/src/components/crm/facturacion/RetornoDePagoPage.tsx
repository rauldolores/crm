import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { getKontroliaClient } from "@/lib/kontrolia-auth/client";
import {
  getEntitlements,
  type KontroliaEntitlements,
} from "@/lib/kontrolia-auth/facturacion";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { RUTA_FACTURACION, RUTA_RETORNO_DE_PAGO } from "./GuardiaDePlan";
import { olvidarDerechos, recargarDerechos } from "./useDerechos";

const INTENTOS = 5;
const ESPERA_MS = 1500;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Adonde vuelve la persona desde Stripe tras pagar. Volver aquí NO prueba
 * que pagó: la suscripción llega por webhook un instante después. Se
 * refresca el token (permisos del plan nuevo) y se vuelve a preguntar unas
 * cuantas veces antes de dar el resultado.
 */
export const RetornoDePagoPage = () => {
  const translate = useTranslate();
  const navigate = useNavigate();
  const { title, darkModeLogo } = useConfigurationContext();
  const [estado, setEstado] = useState<"comprobando" | "ok" | "pendiente">(
    "comprobando",
  );
  const [derechos, setDerechos] = useState<KontroliaEntitlements | null>(null);

  const comprobar = useCallback(async () => {
    setEstado("comprobando");
    const cliente = getKontroliaClient();
    const refrescar = () => cliente?.refresh().catch(() => undefined);
    const preguntar = () =>
      getEntitlements(env.kontroliaApplicationSlug).catch(() => null);

    await refrescar();
    let e = await preguntar();
    for (let i = 0; i < INTENTOS && e?.access !== "ok"; i++) {
      await esperar(ESPERA_MS);
      await refrescar();
      e = await preguntar();
    }

    setDerechos(e);
    // Lo cacheado en la app es de antes del pago.
    olvidarDerechos();
    void recargarDerechos();
    setEstado(e?.access === "ok" ? "ok" : "pendiente");
  }, []);

  useEffect(() => {
    void comprobar();
  }, [comprobar]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-20 text-center">
        <img src={darkModeLogo} alt={title} className="size-10 rounded-lg" />

        {estado === "comprobando" ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">
              {translate("crm.billing.return.checking")}
            </p>
          </>
        ) : estado === "ok" ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <h1 className="text-2xl font-semibold">
              {translate("crm.billing.return.ok_title", {
                plan: derechos?.subscription?.planName ?? "",
              })}
            </h1>
            <p className="text-muted-foreground">
              {translate("crm.billing.return.ok_text")}
            </p>
            <Button onClick={() => navigate("/", { replace: true })}>
              {translate("crm.billing.return.enter")}
            </Button>
          </>
        ) : (
          <>
            <Clock className="h-10 w-10 text-amber-500" />
            <h1 className="text-2xl font-semibold">
              {translate("crm.billing.return.pending_title")}
            </h1>
            <p className="text-muted-foreground">
              {translate("crm.billing.return.pending_text")}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => comprobar()}>
                {translate("crm.billing.retry")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(RUTA_FACTURACION, { replace: true })}
              >
                {translate("crm.billing.title")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

RetornoDePagoPage.path = RUTA_RETORNO_DE_PAGO;
