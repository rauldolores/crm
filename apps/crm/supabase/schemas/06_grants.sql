--
-- Grants
-- This file declares all grants and default privileges for the crm schema.
--

-- Schema usage
grant usage on schema crm to postgres;
grant usage on schema crm to anon;
grant usage on schema crm to authenticated;
grant usage on schema crm to service_role;

-- Function grants
grant all on function crm.cleanup_note_attachments() to anon;
grant all on function crm.cleanup_note_attachments() to authenticated;
grant all on function crm.cleanup_note_attachments() to service_role;

grant all on function crm.get_avatar_for_email(text) to anon;
grant all on function crm.get_avatar_for_email(text) to authenticated;
grant all on function crm.get_avatar_for_email(text) to service_role;

grant all on function crm.get_domain_favicon(text) to anon;
grant all on function crm.get_domain_favicon(text) to authenticated;
grant all on function crm.get_domain_favicon(text) to service_role;

grant all on function crm.get_note_attachments_function_url() to anon;
grant all on function crm.get_note_attachments_function_url() to authenticated;
grant all on function crm.get_note_attachments_function_url() to service_role;

revoke all on function crm.get_user_id_by_email(text) from public;
grant all on function crm.get_user_id_by_email(text) to service_role;

grant all on function crm.handle_company_saved() to anon;
grant all on function crm.handle_company_saved() to authenticated;
grant all on function crm.handle_company_saved() to service_role;

grant all on function crm.handle_contact_note_created_or_updated() to anon;
grant all on function crm.handle_contact_note_created_or_updated() to authenticated;
grant all on function crm.handle_contact_note_created_or_updated() to service_role;

grant all on function crm.handle_contact_saved() to anon;
grant all on function crm.handle_contact_saved() to authenticated;
grant all on function crm.handle_contact_saved() to service_role;



grant all on function crm.current_organization_id() to anon;
grant all on function crm.current_organization_id() to authenticated;
grant all on function crm.current_organization_id() to service_role;

grant all on function crm.provision_crm_access() to authenticated;
grant all on function crm.provision_crm_access() to service_role;

grant all on function crm.is_admin() to anon;
grant all on function crm.is_admin() to authenticated;
grant all on function crm.is_admin() to service_role;

grant all on function crm.lowercase_email_jsonb() to anon;
grant all on function crm.lowercase_email_jsonb() to authenticated;
grant all on function crm.lowercase_email_jsonb() to service_role;

grant all on function crm.merge_contacts(bigint, bigint) to anon;
grant all on function crm.merge_contacts(bigint, bigint) to authenticated;
grant all on function crm.merge_contacts(bigint, bigint) to service_role;

grant all on function crm.set_sales_id_default() to anon;
grant all on function crm.set_sales_id_default() to authenticated;
grant all on function crm.set_sales_id_default() to service_role;

-- Table grants
grant all on table crm.companies to anon;
grant all on table crm.companies to authenticated;
grant all on table crm.companies to service_role;

grant all on table crm.contacts to anon;
grant all on table crm.contacts to authenticated;
grant all on table crm.contacts to service_role;

grant all on table crm.contact_notes to anon;
grant all on table crm.contact_notes to authenticated;
grant all on table crm.contact_notes to service_role;

grant all on table crm.deals to anon;
grant all on table crm.deals to authenticated;
grant all on table crm.deals to service_role;

grant all on table crm.deal_notes to anon;
grant all on table crm.deal_notes to authenticated;
grant all on table crm.deal_notes to service_role;

grant all on table crm.sales to anon;
grant all on table crm.sales to authenticated;
grant all on table crm.sales to service_role;

grant all on table crm.tags to anon;
grant all on table crm.tags to authenticated;
grant all on table crm.tags to service_role;

grant all on table crm.tasks to anon;
grant all on table crm.tasks to authenticated;
grant all on table crm.tasks to service_role;

grant all on table crm.configuration to anon;
grant all on table crm.configuration to authenticated;
grant all on table crm.configuration to service_role;

grant all on table crm.favicons_excluded_domains to anon;
grant all on table crm.favicons_excluded_domains to authenticated;
grant all on table crm.favicons_excluded_domains to service_role;

-- View grants
grant all on table crm.activity_log to anon;
grant all on table crm.activity_log to authenticated;
grant all on table crm.activity_log to service_role;

grant all on table crm.companies_summary to anon;
grant all on table crm.companies_summary to authenticated;
grant all on table crm.companies_summary to service_role;

grant all on table crm.contacts_summary to anon;
grant all on table crm.contacts_summary to authenticated;
grant all on table crm.contacts_summary to service_role;

grant all on table crm.init_state to anon;
grant all on table crm.init_state to authenticated;
grant all on table crm.init_state to service_role;

-- Sequence grants
grant all on sequence crm.companies_id_seq to anon;
grant all on sequence crm.companies_id_seq to authenticated;
grant all on sequence crm.companies_id_seq to service_role;

grant all on sequence crm."contactNotes_id_seq" to anon;
grant all on sequence crm."contactNotes_id_seq" to authenticated;
grant all on sequence crm."contactNotes_id_seq" to service_role;

grant all on sequence crm.contacts_id_seq to anon;
grant all on sequence crm.contacts_id_seq to authenticated;
grant all on sequence crm.contacts_id_seq to service_role;

grant all on sequence crm."dealNotes_id_seq" to anon;
grant all on sequence crm."dealNotes_id_seq" to authenticated;
grant all on sequence crm."dealNotes_id_seq" to service_role;

grant all on sequence crm.deals_id_seq to anon;
grant all on sequence crm.deals_id_seq to authenticated;
grant all on sequence crm.deals_id_seq to service_role;

grant all on sequence crm.favicons_excluded_domains_id_seq to anon;
grant all on sequence crm.favicons_excluded_domains_id_seq to authenticated;
grant all on sequence crm.favicons_excluded_domains_id_seq to service_role;

grant all on sequence crm.sales_id_seq to anon;
grant all on sequence crm.sales_id_seq to authenticated;
grant all on sequence crm.sales_id_seq to service_role;

grant all on sequence crm.tags_id_seq to anon;
grant all on sequence crm.tags_id_seq to authenticated;
grant all on sequence crm.tags_id_seq to service_role;

grant all on sequence crm.tasks_id_seq to anon;
grant all on sequence crm.tasks_id_seq to authenticated;
grant all on sequence crm.tasks_id_seq to service_role;

-- Default privileges
alter default privileges for role postgres in schema crm grant all on sequences to postgres;
alter default privileges for role postgres in schema crm grant all on sequences to anon;
alter default privileges for role postgres in schema crm grant all on sequences to authenticated;
alter default privileges for role postgres in schema crm grant all on sequences to service_role;

alter default privileges for role postgres in schema crm grant all on functions to postgres;
alter default privileges for role postgres in schema crm grant all on functions to anon;
alter default privileges for role postgres in schema crm grant all on functions to authenticated;
alter default privileges for role postgres in schema crm grant all on functions to service_role;

alter default privileges for role postgres in schema crm grant all on tables to postgres;
alter default privileges for role postgres in schema crm grant all on tables to anon;
alter default privileges for role postgres in schema crm grant all on tables to authenticated;
alter default privileges for role postgres in schema crm grant all on tables to service_role;

-- Tablas añadidas después de la instalación inicial: grants explícitos.
grant select, insert, update, delete on table crm.saved_views to anon, authenticated, service_role;
grant usage, select on sequence crm.saved_views_id_seq to anon, authenticated, service_role;
grant select, insert, update, delete on table crm.webhooks to anon, authenticated, service_role;
grant usage, select on sequence crm.webhooks_id_seq to anon, authenticated, service_role;
grant select, insert, update, delete on table crm.automations to anon, authenticated, service_role;
grant usage, select on sequence crm.automations_id_seq to anon, authenticated, service_role;
grant select, insert, update, delete on table crm.public_forms to anon, authenticated, service_role;
grant usage, select on sequence crm.public_forms_id_seq to anon, authenticated, service_role;
grant select, insert on table crm.public_form_submissions to anon, authenticated, service_role;
grant usage, select on sequence crm.public_form_submissions_id_seq to anon, authenticated, service_role;
grant select, insert, update, delete on table crm.tickets to anon, authenticated, service_role;
grant usage, select on sequence crm.tickets_id_seq to anon, authenticated, service_role;
grant select, insert, update, delete on table crm.api_keys to anon, authenticated, service_role;
grant usage, select on sequence crm.api_keys_id_seq to anon, authenticated, service_role;
