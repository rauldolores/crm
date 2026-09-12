import { CreditCard, Loader2, LogOut } from "lucide-react";
import { useLogout, useNotify, useTranslate } from "ra-core";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import type { KontroliaAccess } from "@/lib/kontrolia-auth/facturacion";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { LIMITE_DE_USUARIOS_KEY } from "../providers/supabase/authProvider";
import { MOTIVO_USUARIOS, RUTA_ELIGE_TU_PLAN } from "./GuardiaDePlan";
import { fechaLarga } from "./formato";
import {
  irAlPortal,
  PlanesDisponibles,
  useEsAdministrador,
} from "./PlanesDisponibles";
import { olvidarDerechos, useDerechos } from "./useDerechos";

/** Título y explicación por motivo de bloqueo. */
const MOTIVOS: Record<
  Exclude<KontroliaAccess, "ok">,
  { titulo: string; texto: string }
> = {
  no_subscription: {
    titulo: "crm.billing.blocked.no_subscription.title",
    texto: "crm.billing.blocked.no_subscription.text",
  },
  past_due: {
    titulo: "crm.billing.blocked.past_due.title",
    texto: "crm.billing.blocked.past_due.text",
  },
  canceled: {
    titulo: "crm.billing.blocked.canceled.title",
    texto: "crm.billing.blocked.canceled.text",
  },
  expired: {
    titulo: "crm.billing.blocked.expired.title",
    texto: "crm.billing.blocked.expired.text",
  },
};

/**
 * «Elige tu plan»: adonde llega quien entra sin un plan vigente. Explica el
 * motivo, ofrece los planes y, si el problema es un cobro fallido, la puerta
 * al portal para actualizar la tarjeta. Fuera del layout: sin plan no hay
 * barra lateral ni nada que navegar.
 */
export const EligeTuPlanPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const navigate = useNavigate();
  const logout = useLogout();
  const { title, darkModeLogo } = useConfigurationContext();
  const { derechos, cargando, error, recargar } = useDerechos();
  const esAdministrador = useEsAdministrador();
  const [abriendoPortal, setAbriendoPortal] = useState(false);
  const [parametros] = useSearchParams();
  // Caso aparte: hay plan, pero no cupo para un usuario más. El plan no
  // cambia con recargar; se sale de aquí cuando el servidor deje entrar.
  const sinCupo = parametros.get("motivo") === MOTIVO_USUARIOS;
  const mensajeDeCupo = (() => {
    try {
      return window.localStorage.getItem(LIMITE_DE_USUARIOS_KEY) ?? "";
    } catch {
      return "";
    }
  })();

  // Si al volver a mirar ya hay plan (o la app no lo exige), adentro.
  useEffect(() => {
    if (sinCupo) return;
    if (derechos && (!derechos.plansRequired || derechos.access === "ok")) {
      navigate("/", { replace: true });
    }
  }, [derechos, navigate, sinCupo]);

  const acceso = derechos?.access;
  const motivo = sinCupo
    ? {
        titulo: "crm.billing.blocked.seats.title",
        texto: "crm.billing.blocked.seats.text",
      }
    : acceso && acceso !== "ok"
      ? MOTIVOS[acceso]
      : null;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={darkModeLogo} alt={title} className="size-8 rounded-lg" />
            <span className="font-semibold">{title}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              olvidarDerechos();
              logout();
            }}
          >
            <LogOut className="h-4 w-4" />
            {translate("ra.auth.logout")}
          </Button>
        </header>

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
        ) : motivo ? (
          <>
            <div className="max-w-2xl">
              <h1 className="text-2xl font-semibold">
                {translate(motivo.titulo)}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {translate(motivo.texto, {
                  plan: suscripcion?.planName ?? "",
                  date: fechaLarga(suscripcion?.currentPeriodEnd),
                  detail: mensajeDeCupo,
                })}
              </p>
              {acceso === "past_due" && puedeIrAlPortal && (
                <Button
                  className="mt-4"
                  disabled={abriendoPortal}
                  onClick={abrirPortal}
                >
                  {abriendoPortal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {translate("crm.billing.update_payment_method")}
                </Button>
              )}
            </div>

            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">
                {translate("crm.billing.plans_title")}
              </h2>
              <PlanesDisponibles derechos={derechos} />
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

EligeTuPlanPage.path = RUTA_ELIGE_TU_PLAN;
