--
-- Row Level Security
-- Este archivo declara las políticas RLS de todas las tablas.
--
-- Modelo de aislamiento: cada fila pertenece a una organización, y un usuario
-- solo ve y modifica las filas de la organización activa de su sesión. Esa
-- organización llega en el claim `organization_id` del JWT, que emite el hook
-- de KontrolIA Auth; el cliente no puede falsearla porque el token va firmado.
--
-- Dentro de una organización no hay restricciones adicionales: cualquier
-- miembro ve todos los datos de su empresa. El aislamiento fuerte es entre
-- organizaciones, no entre compañeros de equipo.
--

-- Enable RLS on all tables
alter table crm.companies enable row level security;
alter table crm.contacts enable row level security;
alter table crm.contact_notes enable row level security;
alter table crm.deals enable row level security;
alter table crm.deal_notes enable row level security;
alter table crm.sales enable row level security;
alter table crm.automations enable row level security;
alter table crm.public_forms enable row level security;
alter table crm.public_form_submissions enable row level security;
alter table crm.saved_views enable row level security;
alter table crm.webhooks enable row level security;
alter table crm.api_keys enable row level security;
alter table crm.tags enable row level security;
alter table crm.tasks enable row level security;
alter table crm.configuration enable row level security;
alter table crm.favicons_excluded_domains enable row level security;
alter table crm.tickets enable row level security;

-- Companies
create policy "Companies are scoped to the organization" on crm.companies
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Companies are created in the organization" on crm.companies
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Companies are updated within the organization" on crm.companies
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Companies are deleted within the organization" on crm.companies
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Contacts
create policy "Contacts are scoped to the organization" on crm.contacts
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Contacts are created in the organization" on crm.contacts
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Contacts are updated within the organization" on crm.contacts
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Contacts are deleted within the organization" on crm.contacts
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Contact Notes
create policy "Contact notes are scoped to the organization" on crm.contact_notes
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Contact notes are created in the organization" on crm.contact_notes
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Contact notes are updated within the organization" on crm.contact_notes
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Contact notes are deleted within the organization" on crm.contact_notes
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Deals
create policy "Deals are scoped to the organization" on crm.deals
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Deals are created in the organization" on crm.deals
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Deals are updated within the organization" on crm.deals
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Deals are deleted within the organization" on crm.deals
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Deal Notes
create policy "Deal notes are scoped to the organization" on crm.deal_notes
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Deal notes are created in the organization" on crm.deal_notes
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Deal notes are updated within the organization" on crm.deal_notes
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Deal notes are deleted within the organization" on crm.deal_notes
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Sales
-- La escritura sigue reservada a las edge functions (service_role), que son las
-- que dan de alta y desactivan comerciales; aquí solo se acota la lectura.
create policy "Sales are scoped to the organization" on crm.sales
    for select to authenticated
    using (organization_id = crm.current_organization_id());

-- Tags
create policy "Automations are scoped to the organization" on crm.automations
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Automations are created in the organization" on crm.automations
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Automations are updated within the organization" on crm.automations
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Automations are deleted within the organization" on crm.automations
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

create policy "Webhooks are scoped to the organization" on crm.webhooks
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Webhooks are created in the organization" on crm.webhooks
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Webhooks are updated within the organization" on crm.webhooks
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Webhooks are deleted within the organization" on crm.webhooks
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Como configuration: cualquiera de la organización puede ver que existen,
-- pero solo un administrador puede crear, activar/desactivar o borrar una
-- clave, porque una clave de API da acceso a los datos como si fuera un
-- miembro más.
create policy "Api keys are scoped to the organization" on crm.api_keys
    for select to authenticated
    using (organization_id = crm.current_organization_id() and crm.is_admin());
create policy "Api keys are created by organization admins" on crm.api_keys
    for insert to authenticated
    with check (organization_id = crm.current_organization_id() and crm.is_admin());
create policy "Api keys are updated by organization admins" on crm.api_keys
    for update to authenticated
    using (organization_id = crm.current_organization_id() and crm.is_admin())
    with check (organization_id = crm.current_organization_id() and crm.is_admin());
create policy "Api keys are deleted by organization admins" on crm.api_keys
    for delete to authenticated
    using (organization_id = crm.current_organization_id() and crm.is_admin());

create policy "Public forms are scoped to the organization" on crm.public_forms
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Public forms are created in the organization" on crm.public_forms
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Public forms are updated within the organization" on crm.public_forms
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Public forms are deleted within the organization" on crm.public_forms
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

create policy "Public form submissions are scoped to the organization" on crm.public_form_submissions
    for select to authenticated
    using (organization_id = crm.current_organization_id());

create policy "Saved views are scoped to the organization" on crm.saved_views
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Saved views are created in the organization" on crm.saved_views
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Saved views are updated within the organization" on crm.saved_views
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Saved views are deleted within the organization" on crm.saved_views
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

create policy "Tags are scoped to the organization" on crm.tags
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Tags are created in the organization" on crm.tags
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Tags are updated within the organization" on crm.tags
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Tags are deleted within the organization" on crm.tags
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Tasks
create policy "Tasks are scoped to the organization" on crm.tasks
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Tasks are created in the organization" on crm.tasks
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Tasks are updated within the organization" on crm.tasks
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Tasks are deleted within the organization" on crm.tasks
    for delete to authenticated
    using (organization_id = crm.current_organization_id());

-- Configuration
-- Cada organización tiene su fila. La lectura es para cualquier miembro; la
-- escritura, solo para administradores de esa organización.
create policy "Configuration is scoped to the organization" on crm.configuration
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Configuration is created by organization admins" on crm.configuration
    for insert to authenticated
    with check (
        organization_id = crm.current_organization_id()
        and crm.is_admin()
    );
create policy "Configuration is updated by organization admins" on crm.configuration
    for update to authenticated
    using (
        organization_id = crm.current_organization_id()
        and crm.is_admin()
    )
    with check (
        organization_id = crm.current_organization_id()
        and crm.is_admin()
    );

-- Favicons excluded domains
-- Lista técnica de dominios sin favicon utilizable: no pertenece a ninguna
-- organización, así que se mantiene compartida.
create policy "Enable access for authenticated users only" on crm.favicons_excluded_domains to authenticated using (true) with check (true);

-- Tickets
create policy "Tickets are scoped to the organization" on crm.tickets
    for select to authenticated
    using (organization_id = crm.current_organization_id());
create policy "Tickets are created in the organization" on crm.tickets
    for insert to authenticated
    with check (organization_id = crm.current_organization_id());
create policy "Tickets are updated within the organization" on crm.tickets
    for update to authenticated
    using (organization_id = crm.current_organization_id())
    with check (organization_id = crm.current_organization_id());
create policy "Tickets are deleted within the organization" on crm.tickets
    for delete to authenticated
    using (organization_id = crm.current_organization_id());
