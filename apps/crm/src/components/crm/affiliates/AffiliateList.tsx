import { Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { CanAccess, useRecordContext, useTranslate } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { SearchInput } from "@/components/admin/search-input";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TopToolbar } from "../layout/TopToolbar";
import { PasosDeAlta } from "../misc/PasosDeAlta";
import { AffiliatesConfigPage } from "./AffiliatesConfigPage";
import { AfiliadosEnProceso } from "./AfiliadosEnProceso";
import { useTotalEnProceso } from "./useAfiliadosEnProceso";
import { useEmbudoDeAfiliados } from "./embudoDeAfiliados";
import type { Affiliate } from "../types";

const AffiliateListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CanAccess resource="configuration" action="edit">
        <Button variant="outline" size="sm" asChild>
          <Link to={AffiliatesConfigPage.path}>
            <Settings className="h-4 w-4 mr-1" />
            {translate("crm.affiliates.config.link")}
          </Link>
        </Button>
      </CanAccess>
    </TopToolbar>
  );
};

const ActiveField = () => {
  const translate = useTranslate();
  const record = useRecordContext<Affiliate>();
  if (!record) return null;
  return (
    <Badge variant={record.active ? "default" : "secondary"}>
      {translate(
        record.active
          ? "crm.affiliates.fields.active"
          : "crm.affiliates.fields.inactive",
      )}
    </Badge>
  );
};

const CommissionField = () => {
  const record = useRecordContext<Affiliate>();
  if (!record) return null;
  return (
    <span>
      {record.commission_percentage != null
        ? `${record.commission_percentage}%`
        : "—"}
    </span>
  );
};

/**
 * Afiliados: los que ya lo son y, en otra pestaña, los que van en camino
 * (su oportunidad sigue en el embudo de afiliados). Las pestañas van fuera
 * de la lista porque, sin afiliados todavía, la lista se sustituye por su
 * mensaje de vacío y se llevaría las pestañas con ella.
 */
export const AffiliateList = () => {
  const translate = useTranslate();
  const [pestana, setPestana] = useState<"afiliados" | "en_proceso">(
    "afiliados",
  );
  const enProceso = useTotalEnProceso();

  return (
    <div className="flex flex-col gap-4">
      <ComoAgregarUnAfiliado />
      <Tabs
        value={pestana}
        onValueChange={(valor) => setPestana(valor as typeof pestana)}
      >
        <TabsList>
          <TabsTrigger value="afiliados">
            {translate("crm.affiliates.tabs.affiliates")}
          </TabsTrigger>
          <TabsTrigger value="en_proceso">
            {translate("crm.affiliates.tabs.in_progress")}
            {enProceso > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {enProceso}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {pestana === "afiliados" ? <ListaDeAfiliados /> : <AfiliadosEnProceso />}
    </div>
  );
};

/** Un afiliado nace de una empresa y una oportunidad: no se crea aquí. */
const ComoAgregarUnAfiliado = () => {
  const translate = useTranslate();
  const { embudo, etapasCompletas } = useEmbudoDeAfiliados();
  const etapas = etapasCompletas
    .map(
      (valor) =>
        embudo?.stages.find((etapa) => etapa.value === valor)?.label ?? valor,
    )
    .join(", ");
  return (
    <PasosDeAlta
      id="afiliados"
      titulo={translate("crm.affiliates.how_to.title")}
      pasos={[
        <>
          {translate("crm.affiliates.how_to.company")}{" "}
          <Link className="text-primary underline" to="/companies/create">
            {translate("crm.affiliates.how_to.company_link")}
          </Link>
        </>,
        <>
          {translate("crm.affiliates.how_to.deal", {
            embudo: embudo?.label ?? "—",
          })}{" "}
          <Link className="text-primary underline" to="/deals/create">
            {translate("crm.affiliates.how_to.deal_link")}
          </Link>
        </>,
        translate("crm.affiliates.how_to.becomes_affiliate", {
          etapas: etapas || "—",
        }),
      ]}
    />
  );
};

const ListaDeAfiliados = () => (
  <List
    perPage={25}
    filters={[<SearchInput source="q" alwaysOn key="q" />]}
    actions={<AffiliateListActions />}
    sort={{ field: "created_at", order: "DESC" }}
  >
    <DataTable>
      <DataTable.Col label="crm.affiliates.fields.contact_id">
        <ReferenceField source="contact_id" reference="contacts" link="show" />
      </DataTable.Col>
      <DataTable.Col label="crm.affiliates.fields.company_id">
        <ReferenceField source="company_id" reference="companies" link="show" />
      </DataTable.Col>
      <DataTable.Col
        source="referral_code"
        label="crm.affiliates.fields.referral_code"
      />
      <DataTable.Col label="crm.affiliates.fields.commission_percentage">
        <CommissionField />
      </DataTable.Col>
      <DataTable.Col label="crm.affiliates.fields.active">
        <ActiveField />
      </DataTable.Col>
    </DataTable>
  </List>
);
