--
-- Triggers
-- This file declares all triggers.
--

-- Auto-populate sales_id from current auth user on insert
create or replace trigger set_company_sales_id_trigger
    before insert on public.companies
    for each row execute function public.set_sales_id_default();

create or replace trigger set_contact_sales_id_trigger
    before insert on public.contacts
    for each row execute function public.set_sales_id_default();

create or replace trigger set_contact_notes_sales_id_trigger
    before insert on public.contact_notes
    for each row execute function public.set_sales_id_default();

create or replace trigger set_deal_sales_id_trigger
    before insert on public.deals
    for each row execute function public.set_sales_id_default();

create or replace trigger set_deal_notes_sales_id_trigger
    before insert on public.deal_notes
    for each row execute function public.set_sales_id_default();

create or replace trigger set_task_sales_id_trigger
    before insert on public.tasks
    for each row execute function public.set_sales_id_default();

-- Auto-fetch company logo from website favicon on save
create or replace trigger company_saved
    before insert or update on public.companies
    for each row execute function public.handle_company_saved();

-- Lowercase contact emails before insert or update (must run before contact_saved)
create or replace trigger "10_lowercase_contact_emails"
    before insert or update on public.contacts
    for each row execute function public.lowercase_email_jsonb();

-- Auto-fetch contact avatar from email on save (runs after lowercase_contact_emails)
create or replace trigger "20_contact_saved"
    before insert or update on public.contacts
    for each row execute function public.handle_contact_saved();

-- Update contact.last_seen when a contact note is created
create or replace trigger on_public_contact_notes_created_or_updated
    after insert on public.contact_notes
    for each row execute function public.handle_contact_note_created_or_updated();

-- Cleanup storage attachments when contact notes are updated or deleted
create or replace trigger on_contact_notes_attachments_updated_delete_note_attachments
    after update on public.contact_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function public.cleanup_note_attachments();

create or replace trigger on_contact_notes_deleted_delete_note_attachments
    after delete on public.contact_notes
    for each row execute function public.cleanup_note_attachments();

-- Cleanup storage attachments when deal notes are updated or deleted
create or replace trigger on_deal_notes_attachments_updated_delete_note_attachments
    after update on public.deal_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function public.cleanup_note_attachments();

create or replace trigger on_deal_notes_deleted_delete_note_attachments
    after delete on public.deal_notes
    for each row execute function public.cleanup_note_attachments();

-- No hay triggers sobre auth.users.
--
-- Antes existían `on_auth_user_created` y `on_auth_user_updated`, que creaban un
-- comercial por cada alta en auth.users. Con multi-tenencia eso es incorrecto por
-- dos motivos: auth.users es compartida con el resto del ecosistema KontrolIA, de
-- modo que quien se registrara en cualquier otra aplicación aparecería como
-- comercial en el CRM; y un trigger no puede saber a qué organización asignarlo,
-- porque en el momento del alta todavía no hay sesión ni claim `organization_id`.
--
-- El alta se hace ahora al primer acceso, mediante public.provision_crm_access(),
-- que sí dispone de la organización activa en el token. Ver 02_functions.sql.

-- Webhooks salientes: avisan cada alta, cambio o baja a las URLs suscritas
-- de la organización (ver public.notify_webhooks en 02_functions.sql).
create trigger notify_webhooks_contacts
    after insert or update or delete on public.contacts
    for each row execute function public.notify_webhooks();
create trigger notify_webhooks_companies
    after insert or update or delete on public.companies
    for each row execute function public.notify_webhooks();
create trigger notify_webhooks_deals
    after insert or update or delete on public.deals
    for each row execute function public.notify_webhooks();
create trigger notify_webhooks_tasks
    after insert or update or delete on public.tasks
    for each row execute function public.notify_webhooks();
create trigger notify_webhooks_contact_notes
    after insert or update or delete on public.contact_notes
    for each row execute function public.notify_webhooks();
create trigger notify_webhooks_deal_notes
    after insert or update or delete on public.deal_notes
    for each row execute function public.notify_webhooks();

-- Automatizaciones: aplican las reglas «cuando pase X, haz Y» de la
-- organización (ver public.run_automations en 02_functions.sql).
create trigger run_automations_contacts
    after insert on public.contacts
    for each row execute function public.run_automations();

create trigger run_automations_deals
    after insert or update on public.deals
    for each row execute function public.run_automations();
