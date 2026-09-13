import { LogOut, ShieldAlert } from "lucide-react";
import { useLogout, useTranslate } from "ra-core";

import { Button } from "@/components/ui/button";

import { SelectorDeOrganizacion } from "../layout/SelectorDeOrganizacion";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { olvidarDerechos } from "../facturacion/useDerechos";
import { RUTA_SIN_ACCESO } from "./GuardiaDeAplicacion";

/**
 * Adonde manda GuardiaDeAplicacion cuando el token no trae ningún permiso
 * del CRM. Fuera del layout: sin acceso no hay nada que navegar.
 *
 * Lleva el selector de organización porque una persona puede pertenecer a
 * varias, y solo una (o ninguna) tener el CRM contratado — igual que
 * EligeTuPlanPage, que resuelve el mismo problema para el bloqueo por plan.
 */
export const SinAccesoPage = () => {
  const translate = useTranslate();
  const logout = useLogout();
  const { title, darkModeLogo } = useConfigurationContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={darkModeLogo} alt={title} className="size-8 rounded-lg" />
            <span className="font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <SelectorDeOrganizacion />
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
          </div>
        </header>

        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
          <ShieldAlert className="h-10 w-10 text-amber-500" />
          <h1 className="text-2xl font-semibold">
            {translate("crm.access.denied_title")}
          </h1>
          <p className="text-muted-foreground">
            {translate("crm.access.denied_text", { app: title })}
          </p>
        </div>
      </div>
    </div>
  );
};

SinAccesoPage.path = RUTA_SIN_ACCESO;
