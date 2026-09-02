import { CanAccess, useTranslate } from "ra-core";
import {
  Building2,
  ChartColumn,
  CheckSquare,
  Contact,
  Handshake,
  LayoutDashboard,
  Ticket,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { InformesPage } from "../misc/InformesPage";

/**
 * Navegación principal de Vinqulia, en una barra lateral.
 *
 * Antes vivía en una fila de pestañas dentro de la cabecera. Una barra lateral
 * escala mejor: caben más secciones sin apretar, cada una con su icono, y deja
 * la parte superior libre para lo que es contextual —organización, búsqueda,
 * perfil— en lugar de mezclarlo con la navegación.
 */

interface Seccion {
  etiqueta: string;
  ruta: string;
  Icono: typeof LayoutDashboard;
  /** Recurso a comprobar antes de mostrarla, si aplica. */
  recurso?: string;
}

const EnlaceDeSeccion = ({
  seccion,
  activa,
}: {
  seccion: Seccion;
  activa: boolean;
}) => (
  <Link
    to={seccion.ruta}
    aria-current={activa ? "page" : undefined}
    className={[
      "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm no-underline transition-all",
      activa
        ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-lg shadow-black/25 ring-1 ring-inset ring-white/15"
        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
    ].join(" ")}
  >
    <seccion.Icono
      className={[
        "size-4 shrink-0 transition-transform",
        activa ? "scale-105" : "",
      ].join(" ")}
    />
    <span className="truncate">{seccion.etiqueta}</span>
  </Link>
);

export const BarraLateral = () => {
  const translate = useTranslate();
  const { darkModeLogo, title } = useConfigurationContext();
  const { pathname } = useLocation();

  const secciones: Seccion[] = [
    {
      etiqueta: translate("ra.page.dashboard"),
      ruta: "/",
      Icono: LayoutDashboard,
    },
    {
      etiqueta: translate("resources.contacts.name", { smart_count: 2 }),
      ruta: "/contacts",
      Icono: Contact,
      recurso: "contacts",
    },
    {
      etiqueta: translate("resources.companies.name", { smart_count: 2 }),
      ruta: "/companies",
      Icono: Building2,
      recurso: "companies",
    },
    {
      etiqueta: translate("resources.deals.name", { smart_count: 2 }),
      ruta: "/deals",
      Icono: Handshake,
      recurso: "deals",
    },
    {
      etiqueta: translate("resources.tasks.name", { smart_count: 2 }),
      ruta: "/tasks",
      Icono: CheckSquare,
      recurso: "tasks",
    },
    {
      etiqueta: translate("resources.tickets.name", { smart_count: 2 }),
      ruta: "/tickets",
      Icono: Ticket,
      recurso: "tickets",
    },
    {
      etiqueta: translate("resources.sales.name", { smart_count: 2 }),
      ruta: "/sales",
      Icono: Users,
      recurso: "sales",
    },
    {
      etiqueta: translate("crm.reports.title", { _: "Informes" }),
      ruta: InformesPage.path,
      Icono: ChartColumn,
    },
  ];

  // La raíz solo se marca activa en coincidencia exacta: de otro modo lo
  // estaría siempre, porque toda ruta empieza por "/".
  const estaActiva = (ruta: string) =>
    ruta === "/" ? pathname === "/" : pathname.startsWith(ruta);

  return (
    <aside className="relative hidden w-60 shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground md:flex">
      {/* Halo de marca en la parte superior: da profundidad a la barra sin
          competir con la navegación. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sidebar-primary/20 to-transparent"
      />

      <div className="relative flex flex-1 flex-col gap-1 p-3">
        <Link
          to="/"
          className="group mb-5 flex items-center gap-2.5 px-2 py-1 no-underline text-sidebar-foreground"
        >
          <img
            src={darkModeLogo}
            alt={title}
            className="size-9 rounded-lg ring-1 ring-sidebar-primary/30 transition-opacity group-hover:opacity-90"
          />
          <span className="text-base font-semibold tracking-tight">
            {title}
          </span>
        </Link>

        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Principal
        </p>

        <nav className="flex flex-col gap-1">
          {secciones.map((seccion) =>
            seccion.recurso ? (
              <CanAccess
                key={seccion.ruta}
                resource={seccion.recurso}
                action="list"
              >
                <EnlaceDeSeccion
                  seccion={seccion}
                  activa={estaActiva(seccion.ruta)}
                />
              </CanAccess>
            ) : (
              <EnlaceDeSeccion
                key={seccion.ruta}
                seccion={seccion}
                activa={estaActiva(seccion.ruta)}
              />
            ),
          )}
        </nav>

        <div className="mt-auto border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-2 px-2 text-xs text-sidebar-foreground/50">
            <img src={darkModeLogo} alt="" className="h-4 w-4 opacity-60" />
            <span className="truncate">{title} · CRM</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
