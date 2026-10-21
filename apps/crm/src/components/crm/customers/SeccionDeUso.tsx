import { AlertTriangle } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";

import { cn } from "@/lib/utils";

import type {
  Company,
  Contact,
  Contract,
  CustomerRisk,
  CustomerUsage,
} from "../types";
import {
  agruparUso,
  consumo,
  DIAS_DE_USUARIO_ACTIVO,
  diasDesde,
  fechaCorta,
  nombreDelMes,
  ultimoAcceso,
  usuariosActivos,
  type LimiteDeUso,
} from "./usoDelCliente";

const numero = (valor: number) => valor.toLocaleString("es-MX");

/**
 * Aviso de «en riesgo» puesto por el CRM (nadie de la empresa entra). Solo
 * si la empresa sigue en esa etapa: si una persona la movió, ya no aplica.
 */
export const AvisoDeRiesgo = ({ empresa }: { empresa: Company }) => {
  const translate = useTranslate();
  const { data: marcas } = useGetList<CustomerRisk>("customer_risk", {
    filter: { company_id: empresa.id },
    pagination: { page: 1, perPage: 1 },
  });
  const marca = marcas?.[0];
  if (!marca || empresa.lifecycle_stage !== "at-risk") return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">
          {marca.last_seen_at
            ? translate("crm.customers.usage.at_risk_since", {
                date: fechaCorta(marca.last_seen_at),
              })
            : translate("crm.customers.usage.at_risk_never")}
        </p>
        <p className="text-xs">
          {translate("crm.customers.usage.at_risk_help")}
        </p>
      </div>
    </div>
  );
};

/**
 * Sección «Uso» de la pestaña Cliente (clientes de KONTROLIA): usuarios
 * activos, último acceso y, por producto, el consumo del mes contra lo que
 * incluye el plan, con el mes anterior en chico.
 */
export const SeccionDeUso = ({
  empresa,
  contratos,
}: {
  empresa: Company;
  contratos: Contract[];
}) => {
  const translate = useTranslate();
  const { data: contactos } = useGetList<Contact>("contacts", {
    filter: { company_id: empresa.id },
    pagination: { page: 1, perPage: 500 },
  });
  const { data: filas } = useGetList<CustomerUsage>("customer_usage", {
    filter: { company_id: empresa.id },
    sort: { field: "period_start", order: "DESC" },
    pagination: { page: 1, perPage: 200 },
  });

  const usuarios = usuariosActivos(contactos ?? []);
  const ultimo = ultimoAcceso(contactos ?? []);
  const { mesActual, productos } = agruparUso(filas ?? [], contratos);

  const cuando = (instante: string) => {
    const dias = diasDesde(instante);
    if (dias === 0) return translate("crm.customers.usage.today");
    if (dias === 1) return translate("crm.customers.usage.yesterday");
    return translate("crm.customers.usage.days_ago", { smart_count: dias });
  };

  return (
    <section className="space-y-3">
      <h6 className="text-sm font-semibold">
        {translate("crm.customers.usage.title")}
      </h6>

      <div className="space-y-0.5 text-sm">
        <p>
          {translate("crm.customers.usage.active_users", {
            dias: DIAS_DE_USUARIO_ACTIVO,
            activos: usuarios.activos,
            total: usuarios.total,
          })}
        </p>
        <p>
          {ultimo
            ? translate("crm.customers.usage.last_access", {
                cuando: cuando(ultimo),
                fecha: fechaCorta(ultimo),
              })
            : translate("crm.customers.usage.last_access_never")}
        </p>
        <p className="text-xs text-muted-foreground">
          {translate("crm.customers.usage.users_help")}
        </p>
      </div>

      {!productos.length ? (
        <p className="text-sm text-muted-foreground">
          {translate("crm.customers.usage.no_usage")}
        </p>
      ) : (
        <div className="space-y-3">
          {mesActual && (
            <p className="text-xs text-muted-foreground">
              {translate("crm.customers.usage.month", {
                mes: nombreDelMes(mesActual),
              })}
            </p>
          )}
          {productos.map((producto) => (
            <div
              key={producto.application_slug}
              className="space-y-3 rounded-md border p-3 text-sm"
            >
              <p className="font-medium">{producto.nombre}</p>
              {producto.limites.map((limite) => (
                <FilaDeConsumo key={limite.limit_key} limite={limite} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const FilaDeConsumo = ({ limite }: { limite: LimiteDeUso }) => {
  const translate = useTranslate();

  const texto = (fila: CustomerUsage) => {
    const c = consumo(fila);
    return c.incluido === null
      ? translate("crm.customers.usage.unlimited", { usado: numero(c.usado) })
      : translate("crm.customers.usage.of", {
          usado: numero(c.usado),
          incluido: numero(c.incluido),
        });
  };

  const actual = limite.actual ? consumo(limite.actual) : null;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span>{limite.descripcion}</span>
        <span className="font-medium">
          {limite.actual
            ? texto(limite.actual)
            : translate("crm.customers.usage.no_current")}
          {actual && actual.excedente > 0 && (
            <span className="ml-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              {translate("crm.customers.usage.over", {
                cantidad: numero(actual.excedente),
              })}
            </span>
          )}
        </span>
      </div>
      {actual && actual.porcentaje !== null && (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={actual.porcentaje}
          aria-label={limite.descripcion}
        >
          <div
            className={cn(
              "h-full rounded-full",
              actual.excedente > 0
                ? "bg-amber-500"
                : actual.porcentaje >= 90
                  ? "bg-amber-400"
                  : "bg-primary",
            )}
            style={{ width: `${actual.porcentaje}%` }}
          />
        </div>
      )}
      {limite.anterior && (
        <p className="text-xs text-muted-foreground">
          {translate("crm.customers.usage.previous", {
            mes: nombreDelMes(limite.anterior.period_start),
            texto: texto(limite.anterior),
          })}
        </p>
      )}
    </div>
  );
};
