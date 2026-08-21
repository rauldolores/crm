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
import type { Contact, Ticket } from "../types";

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

export const TicketInputs = () => {
  const { ticketStatuses } = useConfigurationContext();
  useHidratarEmpresaDesdeContacto();

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        source="subject"
        label="resources.tickets.fields.subject"
        validate={required()}
        helperText={false}
      />
      <TextInput
        source="description"
        label="resources.tickets.fields.description"
        multiline
        rows={4}
        helperText={false}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <SelectInput
        source="status"
        label="resources.tickets.fields.status"
        choices={ticketStatuses.map((estado) => ({
          id: estado.value,
          name: estado.label,
        }))}
        helperText={false}
      />
    </div>
  );
};
