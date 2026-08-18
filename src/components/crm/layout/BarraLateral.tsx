import { CanAccess, useTranslate } from "ra-core";
import {
  Building2,
  Contact,
  Handshake,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import { useConfigurationContext } from "../root/ConfigurationContext";

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
    className={[
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm no-underline transition-colors",
      activa
        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
    ].join(" ")}
  >
    <seccion.Icono className="size-4 shrink-0" />
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
      etiqueta: translate("resources.sales.name", { smart_count: 2 }),
      ruta: "/sales",
      Icono: Users,
      recurso: "sales",
    },
  ];

  // La raíz solo se marca activa en coincidencia exacta: de otro modo lo
  // estaría siempre, porque toda ruta empieza por "/".
  const estaActiva = (ruta: string) =>
    ruta === "/" ? pathname === "/" : pathname.startsWith(ruta);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1 bg-sidebar p-3 text-sidebar-foreground">
      <Link
        to="/"
        className="mb-4 flex items-center gap-2 px-2 py-1 no-underline text-sidebar-foreground"
      >
        <img
          src={darkModeLogo}
          alt={title}
          className="h-7 w-7 rounded-md bg-sidebar-primary p-1"
        />
        <span className="text-lg font-semibold tracking-tight">{title}</span>
      </Link>

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
    </aside>
  );
};
