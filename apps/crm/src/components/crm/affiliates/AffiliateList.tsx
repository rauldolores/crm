import { Settings } from "lucide-react";
import { Link } from "react-router";
import { CanAccess, useRecordContext, useTranslate } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { SearchInput } from "@/components/admin/search-input";

import { TopToolbar } from "../layout/TopToolbar";
import { AffiliatesConfigPage } from "./AffiliatesConfigPage";
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

export const AffiliateList = () => (
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
