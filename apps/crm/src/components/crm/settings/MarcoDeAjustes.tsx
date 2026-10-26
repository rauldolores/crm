import { useCanAccess, useTranslate } from "ra-core";
import { useEffect, useRef, type ReactNode } from "react";
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

/**
 * El menú va en una tarjeta, como el contenido, para que no flote sobre el
 * fondo. Las cabeceras de grupo son rótulos en versalitas (como los de la
 * barra lateral) y las opciones llevan icono: así no se confunden unas con
 * otras. La opción activa se tiñe del color de marca.
 */
const MenuDeAjustes = ({ pathname }: { pathname: string }) => {
  const translate = useTranslate();
  const { modules } = useConfigurationContext();
  const activaRef = useRef<HTMLAnchorElement>(null);

  // Con la ventana baja el menú se desplaza; la opción activa, a la vista.
  useEffect(() => {
    activaRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <nav className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-[calc(4rem_+_var(--kontrolia-band-height,0px))] flex max-h-[calc(100dvh_-_5rem_-_var(--kontrolia-band-height,0px))] flex-col">
        <h1 className="px-1 pb-3 text-2xl font-black tracking-tight">
          {translate("crm.settings.title")}
        </h1>
        <div className="min-h-0 overflow-y-auto rounded-2xl bg-card p-2 shadow-tarjeta [scrollbar-width:thin] dark:border dark:border-border">
          {gruposVisibles(modules).map((grupo, posicion) => (
            <div key={grupo.titulo}>
              <p
                className={[
                  "px-3 pb-1.5 text-[10px] font-black tracking-[0.18em] text-muted-foreground/70 uppercase",
                  posicion === 0 ? "pt-2" : "pt-5",
                ].join(" ")}
              >
                {translate(grupo.titulo)}
              </p>
              {grupo.entradas.map((entrada) => {
                const activa = rutaPerteneceA(pathname, entrada.ruta);
                return (
                  <Link
                    key={entrada.ruta}
                    to={entrada.ruta}
                    ref={activa ? activaRef : undefined}
                    aria-current={activa ? "page" : undefined}
                    className={[
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] no-underline transition-colors",
                      activa
                        ? "bg-accent font-semibold text-primary"
                        : "font-medium text-foreground/75 hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    <entrada.Icono
                      className={[
                        "size-4 shrink-0",
                        activa ? "text-primary" : "text-muted-foreground",
                      ].join(" ")}
                    />
                    <span className="truncate">
                      {translate(entrada.etiqueta)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};
