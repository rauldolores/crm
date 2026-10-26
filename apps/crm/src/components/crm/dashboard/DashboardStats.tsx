import { Building2, Contact, Handshake } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { Link } from "react-router";

import { StatCard, StatGrid, type TonoDeCifra } from "../misc/Patrones";

const formatter = new Intl.NumberFormat("es-MX");

/**
 * Resumen ejecutivo del tablero: tres cifras clave que enlazan con sus
 * respectivos listados. Solo entidades con lista propia (contactos, empresas
 * y oportunidades); las tareas no tienen listado de escritorio, así que se
 * dejan fuera para no enlazar a una ruta muerta.
 */
export const DashboardStats = ({
  compacto = false,
}: {
  /** Móvil: las tres cifras en una fila, sin icono. */
  compacto?: boolean;
}) => {
  const translate = useTranslate();

  const { total: totalContacts, isPending: pendingContacts } = useGetList(
    "contacts",
    { pagination: { page: 1, perPage: 1 } },
  );
  const { total: totalCompanies, isPending: pendingCompanies } = useGetList(
    "companies",
    { pagination: { page: 1, perPage: 1 } },
  );
  const { total: totalDeals, isPending: pendingDeals } = useGetList("deals", {
    pagination: { page: 1, perPage: 1 },
  });

  const stats = [
    {
      icono: <Contact className="size-5" />,
      etiqueta: translate("resources.contacts.name", { smart_count: 2 }),
      total: totalContacts,
      pendiente: pendingContacts,
      ruta: "/contacts",
      tono: "total" as TonoDeCifra,
    },
    {
      icono: <Building2 className="size-5" />,
      etiqueta: translate("resources.companies.name", { smart_count: 2 }),
      total: totalCompanies,
      pendiente: pendingCompanies,
      ruta: "/companies",
      tono: "info" as TonoDeCifra,
    },
    {
      icono: <Handshake className="size-5" />,
      etiqueta: translate("resources.deals.name", { smart_count: 2 }),
      total: totalDeals,
      pendiente: pendingDeals,
      ruta: "/deals",
      tono: "neutro" as TonoDeCifra,
    },
  ];

  return (
    <StatGrid
      className={
        compacto ? "grid-cols-3 gap-2 sm:grid-cols-3" : "lg:grid-cols-3"
      }
    >
      {stats.map((s) => (
        <Link
          key={s.ruta}
          to={s.ruta}
          className="rounded-2xl no-underline transition-transform duration-300 hover:scale-[1.01]"
        >
          <StatCard
            tono={s.tono}
            compacto={compacto}
            icon={s.icono}
            title={s.etiqueta}
            value={s.pendiente ? "—" : formatter.format(s.total ?? 0)}
          />
        </Link>
      ))}
    </StatGrid>
  );
};
