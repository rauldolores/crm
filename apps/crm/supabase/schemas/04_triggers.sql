--
-- Triggers
-- This file declares all triggers, sobre tablas del esquema crm.
--

-- Auto-populate sales_id from current auth user on insert
create or replace trigger set_company_sales_id_trigger
    before insert on crm.companies
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_contact_sales_id_trigger
    before insert on crm.contacts
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_contact_notes_sales_id_trigger
    before insert on crm.contact_notes
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_deal_sales_id_trigger
    before insert on crm.deals
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_deal_notes_sales_id_trigger
    before insert on crm.deal_notes
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_task_sales_id_trigger
    before insert on crm.tasks
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_ticket_sales_id_trigger
    before insert on crm.tickets
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_ticket_notes_sales_id_trigger
    before insert on crm.ticket_notes
    for each row execute function crm.set_sales_id_default();

create or replace trigger set_affiliates_sales_id_trigger
    before insert on crm.affiliates
    for each row execute function crm.set_sales_id_default();

-- Auto-fetch company logo from website favicon on save
create or replace trigger company_saved
    before insert or update on crm.companies
    for each row execute function crm.handle_company_saved();

-- Lowercase contact emails before insert or update (must run before contact_saved)
create or replace trigger "10_lowercase_contact_emails"
    before insert or update on crm.contacts
    for each row execute function crm.lowercase_email_jsonb();

-- Auto-fetch contact avatar from email on save (runs after lowercase_contact_emails)
create or replace trigger "20_contact_saved"
    before insert or update on crm.contacts
    for each row execute function crm.handle_contact_saved();

-- Update contact.last_seen when a contact note is created
create or replace trigger on_public_contact_notes_created_or_updated
    after insert on crm.contact_notes
    for each row execute function crm.handle_contact_note_created_or_updated();

-- Cleanup storage attachments when contact notes are updated or deleted
create or replace trigger on_contact_notes_attachments_updated_delete_note_attachments
    after update on crm.contact_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function crm.cleanup_note_attachments();

create or replace trigger on_contact_notes_deleted_delete_note_attachments
    after delete on crm.contact_notes
    for each row execute function crm.cleanup_note_attachments();

-- Cleanup storage attachments when deal notes are updated or deleted
create or replace trigger on_deal_notes_attachments_updated_delete_note_attachments
    after update on crm.deal_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function crm.cleanup_note_attachments();

create or replace trigger on_deal_notes_deleted_delete_note_attachments
    after delete on crm.deal_notes
    for each row execute function crm.cleanup_note_attachments();

-- Cleanup storage attachments when ticket notes are updated or deleted
create or replace trigger on_ticket_notes_attachments_updated_delete_note_attachments
    after update on crm.ticket_notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function crm.cleanup_note_attachments();

create or replace trigger on_ticket_notes_deleted_delete_note_attachments
    after delete on crm.ticket_notes
    for each row execute function crm.cleanup_note_attachments();

-- No hay triggers sobre auth.users.
--
-- Antes existían `on_auth_user_created` y `on_auth_user_updated`, que creaban un
-- comercial por cada alta en auth.users. Con multi-tenencia eso es incorrecto por
-- dos motivos: auth.users es compartida con el resto del ecosistema KontrolIA, de
-- modo que quien se registrara en cualquier otra aplicación aparecería como
-- comercial en el CRM; y un trigger no puede saber a qué organización asignarlo,
-- porque en el momento del alta todavía no hay sesión ni claim `organization_id`.
--
-- El alta se hace ahora al primer acceso, mediante crm.provision_crm_access(),
-- que sí dispone de la organización activa en el token. Ver 02_functions.sql.

-- Webhooks salientes: avisan cada alta, cambio o baja a las URLs suscritas
-- de la organización (ver crm.notify_webhooks en 02_functions.sql).
create trigger notify_webhooks_contacts
    after insert or update or delete on crm.contacts
    for each row execute function crm.notify_webhooks();
create trigger notify_webhooks_companies
    after insert or update or delete on crm.companies
    for each row execute function crm.notify_webhooks();
create trigger notify_webhooks_deals
    after insert or update or delete on crm.deals
    for each row execute function crm.notify_webhooks();
create trigger notify_webhooks_tasks
    after insert or update or delete on crm.tasks
    for each row execute function crm.notify_webhooks();
create trigger notify_webhooks_contact_notes
    after insert or update or delete on crm.contact_notes
    for each row execute function crm.notify_webhooks();
create trigger notify_webhooks_deal_notes
    after insert or update or delete on crm.deal_notes
    for each row execute function crm.notify_webhooks();
create trigger notify_webhooks_tickets
    after insert or update or delete on crm.tickets
    for each row execute function crm.notify_webhooks();
create trigger notify_webhooks_ticket_notes
    after insert or update or delete on crm.ticket_notes
    for each row execute function crm.notify_webhooks();

-- Automatizaciones: aplican las reglas «cuando pase X, haz Y» de la
-- organización (ver crm.run_automations en 02_functions.sql).
create trigger run_automations_contacts
    after insert on crm.contacts
    for each row execute function crm.run_automations();

create trigger run_automations_deals
    after insert or update on crm.deals
    for each row execute function crm.run_automations();

-- Módulo Afiliados: ver crm.gestionar_modulo_afiliados en 02_functions.sql.
-- Trigger propio (no reusa run_automations) para que el módulo entero pueda
-- apagarse por organización sin tocar el motor de automatizaciones que usan
-- todas las demás.
create trigger gestionar_modulo_afiliados_deals
    after update on crm.deals
    for each row execute function crm.gestionar_modulo_afiliados();
