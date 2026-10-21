import { RefreshCw } from "lucide-react";
import { useGetOne, useTranslate } from "ra-core";
import { Link } from "react-router";

import { findDealLabel } from "../deals/dealUtils";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Contract, Deal } from "../types";
import {
  ajustesDeRenovaciones,
  estadoDeRenovacion,
  hoyComoFecha,
} from "./renovaciones";

const fecha = (valor?: string | null) =>
  valor ? new Date(`${valor}T00:00:00`).toLocaleDateString() : "—";

/**
 * Renglón «Renovación» de un contrato con periodicidad, en la pestaña
 * Cliente: la oportunidad que se abrió sola para la renovación que viene, o
 * el día en que se abrirá. Las oportunidades llegan ya filtradas por
 * contrato desde el panel (una sola consulta para todos).
 */
export const RenovacionDelContrato = ({
  contrato,
  oportunidades,
}: {
  contrato: Contract;
  oportunidades: Deal[];
}) => {
  const translate = useTranslate();
  const { renewals, dealStages } = useConfigurationContext();
  const hoy = hoyComoFecha();
  const estado = estadoDeRenovacion(
    contrato,
    oportunidades.map((oportunidad) => ({
      id: oportunidad.id,
      stage: oportunidad.stage,
      renewal_for: oportunidad.renewal_for,
      archived_at: oportunidad.archived_at,
    })),
    ajustesDeRenovaciones(renewals),
    hoy,
  );
  if (estado.tipo === "no_aplica") return null;

  return (
    <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <RefreshCw className="h-3 w-3" />
      {estado.tipo === "abierta" ? (
        <>
          {translate(
            estado.oportunidad.archived_at
              ? "crm.renewals.contract.archived"
              : "crm.renewals.contract.open",
            {
              stage:
                findDealLabel(dealStages, estado.oportunidad.stage) ??
                estado.oportunidad.stage,
            },
          )}
          <Link
            to={`/deals/${estado.oportunidad.id}/show`}
            className="underline hover:text-foreground"
          >
            {translate("crm.renewals.contract.see_deal")}
          </Link>
        </>
      ) : estado.fecha === hoy ? (
        translate("crm.renewals.contract.opens_soon")
      ) : (
        translate("crm.renewals.contract.opens_on", {
          date: fecha(estado.fecha),
        })
      )}
    </p>
  );
};

/**
 * En la ficha de la oportunidad: de qué contrato es la renovación, con
 * enlace a la empresa (allí está el contrato, en la pestaña Cliente).
 */
export const RenovacionDeLaOportunidad = ({ deal }: { deal: Deal }) => {
  const translate = useTranslate();
  const { data: contrato } = useGetOne<Contract>(
    "contracts",
    { id: deal.contract_id as Contract["id"] },
    { enabled: deal.contract_id != null },
  );
  if (deal.contract_id == null) return null;

  return (
    <div className="m-4 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <RefreshCw className="h-4 w-4 text-muted-foreground" />
      <span>
        {translate("crm.renewals.deal.of_contract", {
          name: contrato?.name ?? "…",
          date: fecha(deal.renewal_for),
        })}
      </span>
      <Link
        to={`/companies/${deal.company_id}/show`}
        className="text-muted-foreground underline hover:text-foreground"
      >
        {translate("crm.renewals.deal.see_company")}
      </Link>
      <span className="w-full text-xs text-muted-foreground">
        {translate("crm.renewals.deal.help")}
      </span>
    </div>
  );
};
