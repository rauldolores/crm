import type { ReactNode } from "react";
import type { InputProps } from "ra-core";
import { useGetIdentity, useListContext, useTranslate } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceInput } from "@/components/admin/reference-input";
import { FilterButton } from "@/components/admin/filter-form";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";

import { Button } from "@/components/ui/button";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { TopToolbar } from "../layout/TopToolbar";
import { DealArchivedList } from "./DealArchivedList";
import { DealCreate } from "./DealCreate";
import { DealEdit } from "./DealEdit";
import { DealEmpty } from "./DealEmpty";
import { DealListContent } from "./DealListContent";
import { DealShow } from "./DealShow";
import { OnlyMineInput } from "./OnlyMineInput";
import { VistasGuardadas } from "../misc/VistasGuardadas";

const DealList = () => {
  const { identity } = useGetIdentity();
  const { dealCategories, dealPipelines } = useConfigurationContext();
  const translate = useTranslate();

  if (!identity) return null;

  const dealFilters = [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="company_id" reference="companies">
      <AutocompleteInput
        label={false}
        placeholder={translate("resources.deals.fields.company_id")}
      />
    </ReferenceInput>,
    <WrapperField source="category" label="resources.deals.fields.category">
      <SelectInput
        source="category"
        label={false}
        emptyText="resources.deals.fields.category"
        choices={dealCategories}
        optionText="label"
        optionValue="value"
      />
    </WrapperField>,
    <OnlyMineInput source="sales_id" alwaysOn />,
  ];

  return (
    <List
      perPage={100}
      filter={{ "archived_at@is": null }}
      filterDefaultValues={{ pipeline: dealPipelines[0]?.value }}
      sort={{ field: "index", order: "DESC" }}
      filters={dealFilters}
      actions={<DealActions />}
      pagination={null}
    >
      <DealLayout />
    </List>
  );
};

/**
 * Pestañas para cambiar de embudo. La selección vive en el filtro de la
 * lista (y por tanto en la URL): recargar o compartir el enlace conserva el
 * embudo activo. No se muestra si la organización solo tiene uno.
 */
const SelectorDeEmbudo = () => {
  const { dealPipelines } = useConfigurationContext();
  const { filterValues, setFilters } = useListContext();
  if (dealPipelines.length <= 1) return null;

  const activo =
    dealPipelines.find((embudo) => embudo.value === filterValues?.pipeline) ??
    dealPipelines[0];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {dealPipelines.map((embudo) => (
        <Button
          key={embudo.value}
          type="button"
          size="sm"
          variant={embudo.value === activo.value ? "default" : "outline"}
          onClick={() =>
            setFilters({ ...filterValues, pipeline: embudo.value })
          }
        >
          {embudo.label}
        </Button>
      ))}
    </div>
  );
};

const DealLayout = () => {
  const location = useLocation();
  const matchCreate = matchPath("/deals/create", location.pathname);
  const matchShow = matchPath("/deals/:id/show", location.pathname);
  const matchEdit = matchPath("/deals/:id", location.pathname);

  const { data, isPending, filterValues } = useListContext();
  // El embudo activo siempre esta en los filtros; no cuenta como "filtro del
  // usuario" o la pantalla de lista vacia no se mostraria nunca.
  const { pipeline: _embudo, ...otrosFiltros } = filterValues ?? {};
  const hasFilters = Object.keys(otrosFiltros).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters)
    return (
      <>
        <DealEmpty>
          <DealShow open={!!matchShow} id={matchShow?.params.id} />
          <DealArchivedList />
        </DealEmpty>
      </>
    );

  return (
    <div className="w-full">
      <SelectorDeEmbudo />
      <DealListContent />
      <DealArchivedList />
      <DealCreate open={!!matchCreate} />
      <DealEdit open={!!matchEdit && !matchCreate} id={matchEdit?.params.id} />
      <DealShow open={!!matchShow} id={matchShow?.params.id} />
    </div>
  );
};

const DealActions = () => (
  <TopToolbar>
    <VistasGuardadas resource="deals" />
    <FilterButton />
    <ExportButton />
    <CreateButton label="resources.deals.action.new" />
  </TopToolbar>
);

/**
 *
 * Used so that label of filters can be inferred for the select display,
 * but not be displayed when showing the input.
 */
const WrapperField = ({ children }: InputProps & { children: ReactNode }) =>
  children;

export default DealList;
