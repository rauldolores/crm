import { Building2, Contact, Handshake } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { Link } from "react-router";

import { Card } from "@/components/ui/card";

const formatter = new Intl.NumberFormat("es-ES");

/**
 * Resumen ejecutivo del tablero: tres cifras clave que enlazan con sus
 * respectivos listados. Solo entidades con lista propia (contactos, empresas
 * y oportunidades); las tareas no tienen listado de escritorio, así que se
 * dejan fuera para no enlazar a una ruta muerta.
 */
export const DashboardStats = () => {
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
    },
    {
      icono: <Building2 className="size-5" />,
      etiqueta: translate("resources.companies.name", { smart_count: 2 }),
      total: totalCompanies,
      pendiente: pendingCompanies,
      ruta: "/companies",
    },
    {
      icono: <Handshake className="size-5" />,
      etiqueta: translate("resources.deals.name", { smart_count: 2 }),
      total: totalDeals,
      pendiente: pendingDeals,
      ruta: "/deals",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <Link key={s.ruta} to={s.ruta} className="group no-underline">
          <Card className="h-full gap-0 overflow-hidden py-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
            <div className="flex items-center gap-3 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {s.icono}
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums">
                  {s.pendiente ? "—" : formatter.format(s.total ?? 0)}
                </p>
                <p className="mt-1.5 truncate text-sm text-muted-foreground">
                  {s.etiqueta}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};
