import {
  RecordContextProvider,
  useGetList,
  useTranslate,
  type Identifier,
} from "ra-core";
import { Link } from "react-router";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";

import { formatLocalizedDate } from "../misc/RelativeDate";
import type { AffiliateAttribution, Company } from "../types";

/**
 * Clientes ligados a un afiliado (companies.referred_by_affiliate_id), con
 * cómo y cuándo llegó cada uno. El "cómo" sale del historial: la fila
 * vigente de crm.affiliate_attributions de esa empresa.
 */
export const AffiliateClients = ({
  afiliadoId,
}: {
  afiliadoId: Identifier;
}) => {
  const translate = useTranslate();
  const { data: empresas, isPending } = useGetList<Company>("companies", {
    filter: { referred_by_affiliate_id: afiliadoId },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "name", order: "ASC" },
  });
  const { data: vigentes } = useGetList<AffiliateAttribution>(
    "affiliate_attributions",
    {
      filter: { affiliate_id: afiliadoId, status: "vigente" },
      pagination: { page: 1, perPage: 200 },
      sort: { field: "created_at", order: "DESC" },
    },
  );

  if (isPending) return null;
  const porEmpresa = new Map(
    (vigentes ?? []).map((fila) => [String(fila.company_id), fila]),
  );

  return (
    <section>
      <p className="text-muted-foreground mb-2 text-sm">
        {translate("crm.affiliates.clients.title")}
        {empresas?.length ? ` (${empresas.length})` : ""}
      </p>
      {!empresas?.length ? (
        <p className="text-sm text-muted-foreground">
          {translate("crm.affiliates.clients.empty")}
        </p>
      ) : (
        <ul className="divide-y rounded-md border text-sm">
          {empresas.map((empresa) => {
            const atribucion = porEmpresa.get(String(empresa.id));
            return (
              <li
                key={empresa.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <Link
                  to={`/companies/${empresa.id}/show`}
                  className="font-medium hover:underline"
                >
                  {empresa.name}
                </Link>
                {atribucion && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary">
                      {translate(
                        `crm.affiliates.clients.source.${atribucion.source}`,
                      )}
                    </Badge>
                    {translate("crm.affiliates.clients.linked_on", {
                      date: formatLocalizedDate(atribucion.created_at),
                    })}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

/**
 * Todo lo que ha pasado con las atribuciones de un afiliado: altas por
 * enlace, ligas manuales, reasignaciones con su motivo y enlaces rechazados
 * por el primer toque. Es la evidencia para aclarar cualquier disputa.
 */
export const AffiliateAttributionHistory = ({
  afiliadoId,
}: {
  afiliadoId: Identifier;
}) => {
  const translate = useTranslate();
  const { data: historial, isPending } = useGetList<AffiliateAttribution>(
    "affiliate_attributions",
    {
      filter: { affiliate_id: afiliadoId },
      pagination: { page: 1, perPage: 50 },
      sort: { field: "created_at", order: "DESC" },
    },
  );

  if (isPending) return null;

  return (
    <section>
      <p className="text-muted-foreground mb-2 text-sm">
        {translate("crm.affiliates.clients.history_title")}
      </p>
      {!historial?.length ? (
        <p className="text-sm text-muted-foreground">
          {translate("crm.affiliates.clients.history_empty")}
        </p>
      ) : (
        <ul className="space-y-3 text-sm">
          {historial.map((fila) => (
            <RecordContextProvider key={fila.id} value={fila}>
              <li className="border-l-2 pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ReferenceField
                    source="company_id"
                    reference="companies"
                    link="show"
                  />
                  <Badge
                    variant={
                      fila.status === "vigente" ? "default" : "secondary"
                    }
                  >
                    {translate(`crm.affiliates.clients.status.${fila.status}`)}
                  </Badge>
                  <span className="text-muted-foreground">
                    {translate(`crm.affiliates.clients.source.${fila.source}`)}
                    {fila.origin_application
                      ? ` · ${fila.origin_application}`
                      : ""}
                    {" · "}
                    {formatLocalizedDate(fila.created_at)}
                  </span>
                  {fila.actor_sales_id != null && (
                    <span className="text-muted-foreground">
                      <ReferenceField
                        source="actor_sales_id"
                        reference="sales"
                        link={false}
                      />
                    </span>
                  )}
                </div>
                {fila.reason && (
                  <p className="text-muted-foreground">
                    {translate("crm.affiliates.clients.reason", {
                      reason: fila.reason,
                    })}
                  </p>
                )}
                {fila.end_reason && (
                  <p className="text-muted-foreground">
                    {translate("crm.affiliates.clients.end_reason", {
                      reason: fila.end_reason,
                    })}
                  </p>
                )}
              </li>
            </RecordContextProvider>
          ))}
        </ul>
      )}
    </section>
  );
};
