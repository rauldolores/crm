import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShowBase, useNotify, useShowContext, useTranslate } from "ra-core";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Affiliate } from "../types";

export const AffiliateShow = () => (
  <ShowBase>
    <AffiliateShowContent />
  </ShowBase>
);

const AffiliateShowContent = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const { record, isPending } = useShowContext<Affiliate>();
  const config = useConfigurationContext();
  const [copiado, setCopiado] = useState(false);

  if (isPending || !record) return null;

  const plantilla = config.modules.affiliates?.urlTemplate as
    | string
    | undefined;
  const urlDeReferido = plantilla
    ? plantilla.replace("{id}", record.referral_code)
    : null;

  const copiar = async () => {
    if (!urlDeReferido) return;
    await navigator.clipboard.writeText(urlDeReferido);
    setCopiado(true);
    notify("crm.common.copied", { type: "info" });
  };

  return (
    <div className="mt-2 flex pb-2 gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={record.active ? "default" : "secondary"}>
                  {translate(
                    record.active
                      ? "crm.affiliates.fields.active"
                      : "crm.affiliates.fields.inactive",
                  )}
                </Badge>
                <h5 className="text-xl">{record.referral_code}</h5>
              </div>
              <EditButton />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">
                  {translate("crm.affiliates.fields.contact_id")}
                </p>
                <ReferenceField
                  source="contact_id"
                  reference="contacts"
                  link="show"
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">
                  {translate("crm.affiliates.fields.company_id")}
                </p>
                <ReferenceField
                  source="company_id"
                  reference="companies"
                  link="show"
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">
                  {translate("crm.affiliates.fields.commission_percentage")}
                </p>
                <p>
                  {record.commission_percentage != null
                    ? `${record.commission_percentage}%`
                    : "—"}
                </p>
              </div>
              {record.kontrolia_auth_user_id && (
                <div>
                  <p className="text-muted-foreground mb-1">
                    {translate("crm.affiliates.fields.kontrolia_auth_user_id")}
                  </p>
                  <p className="font-mono text-xs">
                    {record.kontrolia_auth_user_id}
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <p className="text-muted-foreground mb-1 text-sm">
              {translate("crm.affiliates.fields.referral_url")}
            </p>
            {urlDeReferido ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                  {urlDeReferido}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={copiar}
                >
                  {copiado ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {translate("crm.common.copy")}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {translate("crm.affiliates.fields.referral_url_not_configured")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
