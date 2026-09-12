import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
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
 * que pagó: la suscripción llega por webhook un instante después, así que se
 * pregunta unas cuantas veces antes de dar el resultado.
 *
 * El refresco del token pasa UNA sola vez, no en cada intento. Repetirlo en
 * cada vuelta forzaba varias rotaciones del refresh token en pocos segundos,
 * justo la ventana en la que puede chocar con el refresco automático del
 * propio SDK y dejar la sesión de este cliente invalidada a mitad de camino
 * (GoTrue responde 400 "already used" al segundo, y @supabase/auth-js borra
 * la sesión local ante ese error). getEntitlements ya usa el token vigente
 * por su cuenta — no necesita que se lo fuerce.
 *
 * Si eso pasa igual, se nota aquí: `getToken()` empieza a devolver null. En
 * ese caso no tiene sentido seguir reintentando la misma pregunta contra un
 * cliente sin sesión — se ofrece refrescar la página en vez de un botón que
 * repetiría el mismo fallo para siempre.
 */
export const RetornoDePagoPage = () => {
  const translate = useTranslate();
  const navigate = useNavigate();
  const { title, darkModeLogo } = useConfigurationContext();
  const [estado, setEstado] = useState<
    "comprobando" | "ok" | "pendiente" | "sin_sesion"
  >("comprobando");
  const [derechos, setDerechos] = useState<KontroliaEntitlements | null>(null);

  const comprobar = useCallback(async () => {
    setEstado("comprobando");
    const cliente = getKontroliaClient();
    await cliente?.refresh().catch(() => undefined);

    let e: KontroliaEntitlements | null = null;
    let sinSesion = false;

    for (let intento = 0; intento <= INTENTOS; intento++) {
      if (intento > 0) await esperar(ESPERA_MS);

      const token = await cliente?.getToken().catch(() => null);
      if (!token) {
        sinSesion = true;
        break;
      }

      e = await getEntitlements(env.kontroliaApplicationSlug).catch(() => null);
      if (e?.access === "ok") break;
    }

    setDerechos(e);
    // Lo cacheado en la app es de antes del pago.
    olvidarDerechos();
    void recargarDerechos();
    setEstado(
      sinSesion ? "sin_sesion" : e?.access === "ok" ? "ok" : "pendiente",
    );
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
        ) : estado === "sin_sesion" ? (
          <>
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <h1 className="text-2xl font-semibold">
              {translate("crm.billing.return.session_lost_title")}
            </h1>
            <p className="text-muted-foreground">
              {translate("crm.billing.return.session_lost_text")}
            </p>
            {/*
              Un botón "reintentar" aquí repetiría exactamente el mismo
              fallo: este cliente ya no tiene sesión. Recargar crea uno
              nuevo que lee la cookie tal como está ahora mismo, que sigue
              siendo válida — solo la copia en memoria de este cliente se
              quedó atrás.
            */}
            <Button onClick={() => window.location.reload()}>
              {translate("crm.billing.return.reload")}
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
