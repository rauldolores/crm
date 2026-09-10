import { useRecordContext, useTranslate } from "ra-core";
import { EditButton } from "@/components/admin/edit-button";
import { DeleteButton } from "@/components/admin";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { ShowButton } from "@/components/admin/show-button";

import { AddTask } from "../tasks/AddTask";
import { TasksIterator } from "../tasks/TasksIterator";
import { TicketsIterator } from "../tickets/TicketsIterator";
import { TagsListEdit } from "./TagsListEdit";
import { ContactStatusSelector } from "./ContactInputs";
import { ContactPersonalInfo } from "./ContactPersonalInfo";
import { ContactBackgroundInfo } from "./ContactBackgroundInfo";
import { AsideSection } from "../misc/AsideSection";
import { CamposPersonalizadosField } from "../misc/CamposPersonalizados";
import type { Contact } from "../types";
import { ContactMergeButton } from "./ContactMergeButton";
import { ExportVCardButton } from "./ExportVCardButton";
import { EnviarCorreoButton } from "./EnviarCorreoButton";
import { EnviarWhatsAppButton } from "./EnviarWhatsAppButton";

export const ContactAside = ({ link = "edit" }: { link?: "edit" | "show" }) => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();

  if (!record) return null;

  return (
    <div className="hidden sm:block w-92 min-w-92 text-sm">
      <div className="mb-4 -ml-1">
        {link === "edit" ? (
          <EditButton label="resources.contacts.action.edit" />
        ) : (
          <ShowButton label="resources.contacts.action.show" />
        )}
      </div>

      <AsideSection title={translate("resources.notes.fields.status")}>
        <ContactStatusSelector />
      </AsideSection>

      <AsideSection
        title={translate("resources.contacts.field_categories.personal_info")}
      >
        <ContactPersonalInfo />
      </AsideSection>

      <AsideSection
        title={translate("resources.contacts.field_categories.background_info")}
      >
        <ContactBackgroundInfo />
      </AsideSection>

      <CamposPersonalizadosField entidad="contact" />

      <AsideSection
        title={translate("resources.tags.name", { smart_count: 2 })}
      >
        <TagsListEdit />
      </AsideSection>

      <AsideSection
        title={translate("resources.tasks.name", { smart_count: 2 })}
      >
        <ReferenceManyField
          target="contact_id"
          reference="tasks"
          sort={{ field: "due_date", order: "ASC" }}
          perPage={1000}
        >
          <TasksIterator />
        </ReferenceManyField>
        <AddTask />
      </AsideSection>

      <AsideSection
        title={translate("resources.tickets.name", { smart_count: 2 })}
      >
        {record.nb_tickets ? (
          <p className="text-xs text-muted-foreground mb-1">
            {translate("resources.tickets.open_of_total", {
              open: record.nb_tickets_open ?? 0,
              total: record.nb_tickets,
            })}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {translate("resources.tickets.empty.title")}
          </p>
        )}
        <ReferenceManyField
          target="contact_id"
          reference="tickets"
          sort={{ field: "created_at", order: "DESC" }}
          perPage={5}
        >
          <TicketsIterator />
        </ReferenceManyField>
      </AsideSection>

      {/*
        Antes estas acciones solo se mostraban con link="show" (la barra
        lateral tal como la usa ContactEdit), así que enviar un correo o un
        WhatsApp solo aparecía después de entrar a editar el contacto — la
        ficha de solo lectura (ContactShow, el caso normal) se quedaba sin
        ellas. Se muestran siempre: son consultas, no cambian nada.
      */}
      <div className="mt-6 pt-6 border-t hidden sm:flex flex-col gap-2 items-start">
        <EnviarCorreoButton />
        <EnviarWhatsAppButton />
        <ExportVCardButton />
        <ContactMergeButton />
      </div>

      {link !== "edit" && (
        <div className="mt-6 pt-6 border-t hidden sm:flex flex-col gap-2 items-start">
          <DeleteButton
            className="h-6 cursor-pointer hover:bg-destructive/10! text-destructive! border-destructive! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40"
            size="sm"
          />
        </div>
      )}
    </div>
  );
};
