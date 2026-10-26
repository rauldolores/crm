import { LOCALE } from "../misc/RelativeDate";
import { useMutation } from "@tanstack/react-query";
import { isValid } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  InfiniteListBase,
  ShowBase,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
  useUpdate,
} from "ra-core";
import { DeleteButton } from "@/components/admin/delete-button";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { FichaHero } from "../misc/Patrones";
import { NoteCreate } from "../notes/NoteCreate";
import { NotesIterator } from "../notes/NotesIterator";
import { HistorialDeOportunidad } from "./HistorialDeOportunidad";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { etiquetaDeProyecto } from "../proyectos/proyectos";
import type { Deal } from "../types";
import { DatosDeContacto } from "./DatosDeContacto";
import { findDealLabel, formatISODateString } from "./dealUtils";
import { CamposPersonalizadosField } from "../misc/CamposPersonalizados";
import { TagsListEdit } from "../contacts/TagsListEdit";
import { probabilidadDeEtapa } from "./probabilidad";
import { SeccionDeCotizaciones } from "../cotizaciones/SeccionDeCotizaciones";
import { RenovacionDeLaOportunidad } from "../renovaciones/RenovacionDelContrato";

export const DealShow = ({ open, id }: { open: boolean; id?: string }) => {
  const redirect = useRedirect();
  const handleClose = () => {
    redirect("list", "deals");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="lg:max-w-4xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <ShowBase id={id}>
            <DealShowContent />
          </ShowBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const DealShowContent = () => {
  const translate = useTranslate();
  const {
    dealStages,
    dealCategories,
    projects,
    dealLossReasons,
    dealPipelines,
    currency,
  } = useConfigurationContext();
  const record = useRecordContext<Deal>();
  if (!record) return null;
  const embudo =
    dealPipelines.find((candidato) => candidato.value === record.pipeline) ??
    dealPipelines[0];

  return (
    <>
      <div className="space-y-2">
        {record.archived_at ? <ArchivedTitle /> : null}
        <div className="flex-1">
          {/* El aspa de cerrar del diálogo cae en la esquina: las acciones
              le dejan sitio. */}
          <FichaHero
            className="mb-6"
            avatar={
              <ReferenceField
                source="company_id"
                reference="companies"
                link="show"
              >
                <CompanyAvatar />
              </ReferenceField>
            }
            badge={translate("resources.deals.forcedCaseName")}
            title={record.name}
            subtitle={
              <ReferenceField
                source="company_id"
                reference="companies"
                link="show"
              >
                <TextField source="name" />
              </ReferenceField>
            }
            action={
              <div className={record.archived_at ? "" : "pr-10"}>
                <div className="flex gap-2">
                  {record.archived_at ? (
                    <>
                      <UnarchiveButton record={record} />
                      <DeleteButton />
                    </>
                  ) : (
                    <>
                      <ArchiveButton record={record} />
                      <EditButton />
                    </>
                  )}
                </div>
              </div>
            }
          />

          <div className="flex gap-8 m-4">
            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.deals.fields.expected_closing_date")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {record.expected_closing_date &&
                  isValid(new Date(record.expected_closing_date))
                    ? formatISODateString(record.expected_closing_date)
                    : translate("resources.deals.invalid_date")}
                </span>
                {record.expected_closing_date &&
                new Date(record.expected_closing_date) < new Date() ? (
                  <Badge variant="destructive">
                    {translate("crm.common.past")}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.deals.fields.amount")}
              </span>
              <span className="text-sm">
                {(record.amount ?? 0).toLocaleString(LOCALE, {
                  notation: "compact",
                  style: "currency",
                  currency,
                  currencyDisplay: "narrowSymbol",
                  minimumSignificantDigits: 3,
                })}
              </span>
            </div>

            {record.project && (
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("crm.projects.field_one")}
                </span>
                <span className="text-sm">
                  {etiquetaDeProyecto(projects, record.project)}
                </span>
              </div>
            )}

            {record.category && (
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("resources.deals.fields.category")}
                </span>
                <span className="text-sm">
                  {dealCategories.find((c) => c.value === record.category)
                    ?.label ?? record.category}
                </span>
              </div>
            )}

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.deals.fields.stage")}
              </span>
              <span className="text-sm">
                {findDealLabel(dealStages, record.stage)}
                {record.loss_reason && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {dealLossReasons.find((m) => m.value === record.loss_reason)
                      ?.label ?? record.loss_reason}
                  </span>
                )}
              </span>
            </div>

            {embudo && (
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("resources.deals.fields.probability")}
                </span>
                <span className="text-sm tabular-nums">
                  {probabilidadDeEtapa(embudo, record.stage)} %
                </span>
              </div>
            )}
          </div>

          <RenovacionDeLaOportunidad deal={record} />

          <div className="m-4">
            <DatosDeContacto deal={record} />
          </div>

          {record.description && (
            <div className="m-4 whitespace-pre-line">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.deals.fields.description")}
              </span>
              <p className="text-sm leading-6">{record.description}</p>
            </div>
          )}

          <div className="m-4">
            <span className="text-xs text-muted-foreground tracking-wide">
              {translate("resources.tags.name", { smart_count: 2 })}
            </span>
            <div className="mt-1">
              <TagsListEdit resource="deals" />
            </div>
          </div>

          <div className="m-4">
            <CamposPersonalizadosField entidad="deal" />
          </div>

          <div className="m-4">
            <Separator className="mb-4" />
            <SeccionDeCotizaciones oportunidad={record} />
          </div>

          <div className="m-4">
            <Separator className="mb-4" />
            <h3 className="mb-2 text-sm font-medium">
              {translate("resources.deals.history.title")}
            </h3>
            <HistorialDeOportunidad dealId={record.id} />
          </div>

          <div className="m-4">
            <Separator className="mb-4" />
            <InfiniteListBase
              resource="deal_notes"
              filter={{ deal_id: record.id }}
              sort={{ field: "date", order: "DESC" }}
              perPage={25}
              disableSyncWithLocation
              storeKey={false}
              empty={<NoteCreate reference={"deals"} />}
            >
              <NotesIterator reference="deals" />
            </InfiniteListBase>
          </div>
        </div>
      </div>
    </>
  );
};

const ArchivedTitle = () => {
  const translate = useTranslate();
  return (
    <div className="bg-orange-500 px-6 py-4">
      <h3 className="text-lg font-bold text-white">
        {translate("resources.deals.archived.title")}
      </h3>
    </div>
  );
};

const ArchiveButton = ({ record }: { record: Deal }) => {
  const translate = useTranslate();
  const [update] = useUpdate();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();
  const handleClick = () => {
    update(
      "deals",
      {
        id: record.id,
        data: { archived_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          redirect("list", "deals");
          notify("resources.deals.archived.success", {
            type: "info",
            undoable: false,
          });
          refresh();
        },
        onError: () => {
          notify("resources.deals.archived.error", {
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <Archive className="w-4 h-4" />
      {translate("resources.deals.archived.action")}
    </Button>
  );
};

const UnarchiveButton = ({ record }: { record: Deal }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const { mutate } = useMutation({
    mutationFn: () => dataProvider.unarchiveDeal(record),
    onSuccess: () => {
      redirect("list", "deals");
      notify("resources.deals.unarchived.success", {
        type: "info",
        undoable: false,
      });
      refresh();
    },
    onError: () => {
      notify("resources.deals.unarchived.error", {
        type: "error",
      });
    },
  });

  const handleClick = () => {
    mutate();
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <ArchiveRestore className="w-4 h-4" />
      {translate("resources.deals.unarchived.action")}
    </Button>
  );
};
