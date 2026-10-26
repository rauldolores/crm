import { useCanAccess, useTranslate } from "ra-core";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { useConfigurationContext } from "../root/ConfigurationContext";
import {
  esPantallaDeAjustes,
  gruposVisibles,
  rutaPerteneceA,
} from "./apartadosDeAjustes";

/**
 * Pinta las pantallas de Ajustes con su menú a la izquierda, para que se
 * pueda pasar de una a otra sin volver atrás con el navegador.
 *
 * Lo decide la ruta y no cada pantalla: así entran también Usuarios y
 * Plantillas, que son recursos de react-admin y no páginas propias. Fuera de
 * Ajustes, o para quien no administra la organización, deja la pantalla tal
 * cual: el menú solo lleva a sitios que esa persona no puede tocar.
 */
export const MarcoDeAjustes = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { canAccess } = useCanAccess({
    resource: "configuration",
    action: "edit",
  });

  if (!canAccess || !esPantallaDeAjustes(pathname)) return <>{children}</>;

  return (
    <div className="flex gap-8">
      <MenuDeAjustes pathname={pathname} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

const MenuDeAjustes = ({ pathname }: { pathname: string }) => {
  const translate = useTranslate();
  const { modules } = useConfigurationContext();

  return (
    <nav className="hidden w-52 shrink-0 md:block">
      <div className="sticky top-[calc(4rem_+_var(--kontrolia-band-height,0px))] space-y-4">
        <h1 className="px-3 text-2xl font-semibold">
          {translate("crm.settings.title")}
        </h1>
        {gruposVisibles(modules).map((grupo) => (
          <div key={grupo.titulo}>
            <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
              {translate(grupo.titulo)}
            </p>
            {grupo.entradas.map((entrada) => {
              const activa = rutaPerteneceA(pathname, entrada.ruta);
              return (
                <Link
                  key={entrada.ruta}
                  to={entrada.ruta}
                  aria-current={activa ? "page" : undefined}
                  className={[
                    "block rounded-md px-3 py-1 text-sm no-underline transition-colors",
                    activa
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {translate(entrada.etiqueta)}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
};
