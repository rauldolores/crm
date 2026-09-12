import { Blocks, Globe, Mail, Sparkles, Webhook, Zap } from "lucide-react";
import { useTranslate } from "ra-core";
import type { ComponentType } from "react";
import { Link } from "react-router";

import { Card, CardContent } from "@/components/ui/card";

import { ApiPage } from "../misc/ApiPage";
import { AutomatizacionesPage } from "../misc/AutomatizacionesPage";
import { CorreoPage } from "../misc/CorreoPage";
import { FormulariosPage } from "../misc/FormulariosPage";
import { IaPage } from "../misc/IaPage";
import { CatalogoPage } from "../modules/CatalogoPage";

interface Herramienta {
  titulo: string;
  descripcion: string;
  ruta: string;
  Icono: ComponentType<{ className?: string }>;
}

/**
 * Accesos a las páginas de administración que no son un campo del formulario
 * de `configuration` (automatizaciones, formularios públicos, API, catálogo
 * de módulos, correo saliente, IA): cada una es su propio recurso, así que
 * aquí solo se enlaza, no se edita nada in situ.
 *
 * Antes vivían como una lista plana dentro del menú del avatar, mezcladas
 * con lo personal (perfil, cerrar sesión) y compitiendo en nombre con
 * «Módulos» —la sección del menú lateral con los módulos que YA están
 * activos— pese a que esta tarjeta lleva al catálogo para activarlos o
 * desactivarlos, no a usarlos. Aquí, dentro de Ajustes, quedan agrupadas y
 * con su nombre completo.
 */
export const HerramientasDeAdministracion = () => {
  const translate = useTranslate();

  const herramientas: Herramienta[] = [
    {
      titulo: translate("crm.automations.title"),
      descripcion: translate("crm.automations.intro"),
      ruta: AutomatizacionesPage.path,
      Icono: Zap,
    },
    {
      titulo: translate("crm.public_forms.title"),
      descripcion: translate("crm.public_forms.intro"),
      ruta: FormulariosPage.path,
      Icono: Globe,
    },
    {
      titulo: translate("crm.api.title"),
      descripcion: translate("crm.api.intro"),
      ruta: ApiPage.path,
      Icono: Webhook,
    },
    {
      titulo: translate("crm.modules.catalog.title"),
      descripcion: translate("crm.modules.catalog.intro"),
      ruta: CatalogoPage.path,
      Icono: Blocks,
    },
    {
      titulo: translate("crm.email.title"),
      descripcion: translate("crm.email.intro"),
      ruta: CorreoPage.path,
      Icono: Mail,
    },
    {
      titulo: translate("crm.ai.title"),
      descripcion: translate("crm.ai.intro"),
      ruta: IaPage.path,
      Icono: Sparkles,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {herramientas.map((herramienta) => (
        <Link
          key={herramienta.ruta}
          to={herramienta.ruta}
          className="no-underline"
        >
          <Card className="h-full transition-colors hover:border-primary">
            <CardContent className="flex items-start gap-3 pt-6">
              <herramienta.Icono className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {herramienta.titulo}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {herramienta.descripcion}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
