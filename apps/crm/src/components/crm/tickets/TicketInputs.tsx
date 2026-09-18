import { useEffect } from "react";
import { useGetOne, required } from "ra-core";
import { useFormContext, useWatch } from "react-hook-form";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput.tsx";
import { contactOptionText } from "../misc/ContactOption";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { ticketResolutions } from "../root/defaultConfiguration";
import type { Contact, Sale, Ticket } from "../types";
import { AvisoDeDuplicados } from "./AvisoDeDuplicados";
import { SugerirConIaButton } from "./SugerirConIaButton";

/**
 * Al elegir un contacto se rellena la empresa con la suya, ya que un ticket
 * siempre pertenece a ambos. Solo mientras la persona no haya tocado el
 * campo de empresa a mano: así puede corregirlo si el contacto no tiene
 * empresa o pertenece a otra.
 */
const useHidratarEmpresaDesdeContacto = () => {
  const { control, formState, setValue } = useFormContext<Ticket>();
  const contactId = useWatch({ control, name: "contact_id" });

  const { data: contacto } = useGetOne<Contact>(
    "contacts",
    { id: contactId! },
    { enabled: contactId != null },
  );

  useEffect(() => {
    if (!contacto?.company_id) return;
    if (formState.dirtyFields.company_id) return;
    setValue("company_id", contacto.company_id, { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacto?.company_id]);
};

const aOpciones = (lista: { value: string; label: string }[]) =>
  lista.map((item) => ({ id: item.value, name: item.label }));

export const TicketInputs = ({ esAlta = false }: { esAlta?: boolean }) => {
  const { ticketStatuses, ticketPriorities, ticketCategories, modules } =
    useConfigurationContext();
  const { control } = useFormContext<Ticket>();
  const status = useWatch({ control, name: "status" });
  const companyId = useWatch({ control, name: "company_id" });
  useHidratarEmpresaDesdeContacto();

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        source="subject"
        label="resources.tickets.fields.subject"
        validate={required()}
        helperText={false}
      />
      {esAlta && <AvisoDeDuplicados />}
      <TextInput
        source="description"
        label="resources.tickets.fields.description"
        multiline
        rows={4}
        helperText={false}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReferenceInput source="contact_id" reference="contacts" perPage={10}>
          <AutocompleteInput
            label="resources.tickets.fields.contact_id"
            optionText={contactOptionText}
            validate={required()}
            helperText={false}
          />
        </ReferenceInput>
        <ReferenceInput source="company_id" reference="companies" perPage={10}>
          <AutocompleteCompanyInput
            label="resources.tickets.fields.company_id"
            validate={required()}
          />
        </ReferenceInput>
      </div>
      <SugerirConIaButton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectInput
          source="priority"
          label="resources.tickets.fields.priority"
          choices={aOpciones(ticketPriorities)}
          validate={required()}
          helperText={false}
        />
        <SelectInput
          source="category"
          label="resources.tickets.fields.category"
          choices={aOpciones(ticketCategories)}
          emptyText="resources.tickets.no_category"
          helperText={false}
        />
        <ReferenceInput
          source="sales_id"
          reference="sales"
          filter={{ "disabled@neq": true }}
        >
          <AutocompleteInput
            label="resources.tickets.fields.sales_id"
            optionText={(sale: Sale) => `${sale.first_name} ${sale.last_name}`}
            helperText={false}
          />
        </ReferenceInput>
      </div>
      {/* Enlaces: la oportunidad o el contrato de esta misma empresa del
          que trata el ticket. Se filtran por empresa para no ofrecer los de
          toda la organización. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReferenceInput
          source="deal_id"
          reference="deals"
          filter={companyId ? { company_id: companyId } : {}}
          perPage={20}
        >
          <AutocompleteInput
            label="resources.tickets.fields.deal_id"
            optionText="name"
            helperText={false}
          />
        </ReferenceInput>
        {modules.customers?.active && (
          <ReferenceInput
            source="contract_id"
            reference="contracts"
            filter={companyId ? { company_id: companyId } : {}}
            perPage={20}
          >
            <AutocompleteInput
              label="resources.tickets.fields.contract_id"
              optionText="name"
              helperText={false}
            />
          </ReferenceInput>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectInput
          source="status"
          label="resources.tickets.fields.status"
          choices={aOpciones(ticketStatuses)}
          helperText={false}
        />
        {status === "closed" && (
          <SelectInput
            source="resolution"
            label="resources.tickets.fields.resolution"
            choices={aOpciones(ticketResolutions)}
            validate={required()}
            helperText={false}
          />
        )}
      </div>
    </div>
  );
};
