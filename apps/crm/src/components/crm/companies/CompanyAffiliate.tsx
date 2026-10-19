import { useMutation } from "@tanstack/react-query";
import { CircleX, Handshake } from "lucide-react";
import {
  CanAccess,
  Form,
  required,
  useDataProvider,
  useGetList,
  useNotify,
  useRecordContext,
  useRefresh,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useState } from "react";

import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { AsideSection } from "../misc/AsideSection";
import { formatLocalizedDate } from "../misc/RelativeDate";
import type { CrmDataProvider } from "../providers/supabase/dataProvider";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { AffiliateAttribution, Company } from "../types";

type Accion = "link" | "change" | "remove";

/**
 * Afiliado del cliente, en la ficha de la empresa. Ligarlo, cambiarlo o
 * quitarlo es cosa de administradores: decide a quién le toca la comisión.
 * Sólo aparece con el módulo Afiliados activo.
 */
export const CompanyAffiliate = () => {
  const record = useRecordContext<Company>();
  const translate = useTranslate();
  const config = useConfigurationContext();
  const [accion, setAccion] = useState<Accion | null>(null);

  const { data: vigentes } = useGetList<AffiliateAttribution>(
    "affiliate_attributions",
    {
      filter: { company_id: record?.id, status: "vigente" },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "created_at", order: "DESC" },
    },
    { enabled: !!record?.referred_by_affiliate_id },
  );

  if (!record || !config.modules.affiliates?.active) return null;
  const afiliadoId = record.referred_by_affiliate_id ?? null;
  const vigente = vigentes?.[0];

  return (
    <AsideSection title={translate("crm.affiliates.company.title")}>
      {afiliadoId ? (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1">
            <Handshake className="w-4 h-4" />
            <ReferenceField
              source="referred_by_affiliate_id"
              reference="affiliates"
              link="show"
            />
          </div>
          {vigente && (
            <span className="text-muted-foreground">
              {translate(`crm.affiliates.clients.source.${vigente.source}`)} ·{" "}
              {translate("crm.affiliates.clients.linked_on", {
                date: formatLocalizedDate(vigente.created_at),
              })}
            </span>
          )}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">
          {translate("crm.affiliates.company.none")}
        </span>
      )}

      <CanAccess resource="configuration" action="edit">
        <div className="flex gap-2 mt-1">
          {afiliadoId ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-6"
                onClick={() => setAccion("change")}
              >
                {translate("crm.affiliates.company.change")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-destructive"
                onClick={() => setAccion("remove")}
              >
                {translate("crm.affiliates.company.remove")}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-6"
              onClick={() => setAccion("link")}
            >
              {translate("crm.affiliates.company.link")}
            </Button>
          )}
        </div>
      </CanAccess>

      {accion && (
        <AsignarAfiliadoDialog
          accion={accion}
          empresa={record}
          onClose={() => setAccion(null)}
        />
      )}
    </AsideSection>
  );
};

const AsignarAfiliadoDialog = ({
  accion,
  empresa,
  onClose,
}: {
  accion: Accion;
  empresa: Company;
  onClose: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [afiliadoId, setAfiliadoId] = useState<Identifier | null>(null);
  const [motivo, setMotivo] = useState("");

  // Cambiar o quitar un afiliado existente exige motivo (la base lo
  // rechaza sin él); ligar una empresa sin afiliado, no.
  const pideMotivo = accion !== "link";
  const pideAfiliado = accion !== "remove";
  const listo =
    (!pideAfiliado || afiliadoId != null) &&
    (!pideMotivo || motivo.trim().length > 0);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      dataProvider.asignarAfiliado(
        empresa.id,
        pideAfiliado ? afiliadoId : null,
        motivo.trim() || undefined,
      ),
    onSuccess: () => {
      notify(
        accion === "remove"
          ? "crm.affiliates.company.removed"
          : "crm.affiliates.company.saved",
        { type: "success" },
      );
      refresh();
      onClose();
    },
    onError: (error: Error) => notify(error.message, { type: "error" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="md:min-w-lg">
        <DialogHeader>
          <DialogTitle>
            {translate(`crm.affiliates.company.dialog_title_${accion}`)}
          </DialogTitle>
          {accion === "change" && (
            <DialogDescription>
              {translate("crm.affiliates.company.dialog_intro_change")}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {pideAfiliado && (
            <Form>
              <ReferenceInput
                source="affiliate_id"
                reference="affiliates"
                filter={{
                  active: true,
                  ...(empresa.referred_by_affiliate_id
                    ? { "id@neq": empresa.referred_by_affiliate_id }
                    : {}),
                }}
              >
                <AutocompleteInput
                  label="crm.affiliates.company.affiliate"
                  optionText="referral_code"
                  validate={required()}
                  onChange={setAfiliadoId}
                  helperText={false}
                />
              </ReferenceInput>
            </Form>
          )}
          {pideMotivo && (
            <div className="space-y-2">
              <Label htmlFor="motivo-afiliado">
                {translate("crm.affiliates.company.reason")}
              </Label>
              <Textarea
                id="motivo-afiliado"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {translate("crm.affiliates.company.reason_help")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            <CircleX />
            {translate("ra.action.cancel")}
          </Button>
          <Button onClick={() => mutate()} disabled={!listo || isPending}>
            {translate("crm.affiliates.company.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
