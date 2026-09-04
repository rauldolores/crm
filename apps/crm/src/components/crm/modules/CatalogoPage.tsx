import { useDataProvider, useNotify, useTranslate } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import {
  useConfigurationContext,
  useConfigurationUpdater,
} from "../root/ConfigurationContext";
import type { CrmDataProvider } from "../providers/types";
import { MODULE_REGISTRY } from "./registry";

/**
 * Módulos > Catálogo: activa o desactiva módulos por organización. El
 * estado vive en crm.configuration.config.modules — ver ConfigurationContext.
 */
export const CatalogoPage = () => {
  const translate = useTranslate();
  const config = useConfigurationContext();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const updateConfiguration = useConfigurationUpdater();
  const notify = useNotify();

  const alternar = async (clave: string, activo: boolean) => {
    const nuevaConfiguracion = {
      ...config,
      modules: {
        ...config.modules,
        [clave]: { ...config.modules[clave], active: activo },
      },
    };
    try {
      const guardada =
        await dataProvider.updateConfiguration(nuevaConfiguracion);
      updateConfiguration(guardada);
      notify("crm.modules.catalog.updated");
    } catch {
      notify("crm.modules.catalog.update_error", { type: "error" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.modules.catalog.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.modules.catalog.intro")}
        </p>
      </div>

      {MODULE_REGISTRY.map((modulo) => {
        const activo = config.modules[modulo.key]?.active ?? false;
        const Icono = modulo.icon;
        return (
          <Card key={modulo.key}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="flex items-start gap-3">
                <Icono className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <CardTitle>{translate(modulo.nameKey)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {translate(modulo.descriptionKey)}
                  </p>
                </div>
              </div>
              <Switch
                checked={activo}
                onCheckedChange={(valor) => alternar(modulo.key, valor)}
                aria-label={translate(modulo.nameKey)}
              />
            </CardHeader>
            {activo && (
              <CardContent className="text-sm text-muted-foreground">
                {translate("crm.modules.catalog.active_hint")}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

CatalogoPage.path = "/modulos/catalogo";
