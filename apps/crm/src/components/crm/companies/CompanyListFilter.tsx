import { Building, Tag, Truck, Users } from "lucide-react";
import {
  FilterLiveForm,
  useGetIdentity,
  useGetList,
  useTranslate,
} from "ra-core";
import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";

import { FilterCategory } from "../filters/FilterCategory";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { getTranslatedCompanySizeLabel } from "./getTranslatedCompanySizeLabel";
import { sizes } from "./sizes";

export const CompanyListFilter = () => {
  const { identity } = useGetIdentity();
  const { companySectors } = useConfigurationContext();
  const translate = useTranslate();
  const { data: etiquetas } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });
  const translatedSizes = sizes.map((size) => ({
    ...size,
    name: getTranslatedCompanySizeLabel(size, translate),
  }));
  return (
    <div className="w-52 min-w-52 flex flex-col gap-8">
      <FilterLiveForm>
        <SearchInput source="q" />
      </FilterLiveForm>

      <FilterCategory
        icon={<Building className="h-4 w-4" />}
        label="resources.companies.fields.size"
      >
        {translatedSizes.map((size) => (
          <ToggleFilterButton
            className="w-full justify-between"
            label={size.name}
            key={size.name}
            value={{ size: size.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory
        icon={<Truck className="h-4 w-4" />}
        label="resources.companies.fields.sector"
      >
        {companySectors.map((sector) => (
          <ToggleFilterButton
            className="w-full justify-between"
            label={sector.label}
            key={sector.value}
            value={{ sector: sector.value }}
          />
        ))}
      </FilterCategory>

      <FilterCategory
        icon={<Users className="h-4 w-4" />}
        label="resources.companies.fields.sales_id"
      >
        <ToggleFilterButton
          className="w-full justify-between"
          label={translate("crm.common.me")}
          value={{ sales_id: identity?.id }}
        />
      </FilterCategory>

      {!!etiquetas?.length && (
        <FilterCategory
          icon={<Tag className="h-4 w-4" />}
          label="resources.contacts.filters.tags"
        >
          {etiquetas.map((etiqueta) => (
            <ToggleFilterButton
              className="w-full justify-between"
              key={etiqueta.id}
              label={
                <Badge
                  variant="secondary"
                  className="rounded-full border-transparent text-black text-xs font-normal cursor-pointer"
                  style={{ backgroundColor: etiqueta.color }}
                >
                  {etiqueta.name}
                </Badge>
              }
              value={{ "tags@cs": `{${etiqueta.id}}` }}
            />
          ))}
        </FilterCategory>
      )}
    </div>
  );
};
