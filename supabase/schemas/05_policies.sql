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
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_notes enable row level security;
alter table public.deals enable row level security;
alter table public.deal_notes enable row level security;
alter table public.sales enable row level security;
alter table public.tags enable row level security;
alter table public.tasks enable row level security;
alter table public.configuration enable row level security;
alter table public.favicons_excluded_domains enable row level security;

-- Companies
create policy "Companies are scoped to the organization" on public.companies
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Companies are created in the organization" on public.companies
    for insert to authenticated
    with check (organization_id = public.current_organization_id());
create policy "Companies are updated within the organization" on public.companies
    for update to authenticated
    using (organization_id = public.current_organization_id())
    with check (organization_id = public.current_organization_id());
create policy "Companies are deleted within the organization" on public.companies
    for delete to authenticated
    using (organization_id = public.current_organization_id());

-- Contacts
create policy "Contacts are scoped to the organization" on public.contacts
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Contacts are created in the organization" on public.contacts
    for insert to authenticated
    with check (organization_id = public.current_organization_id());
create policy "Contacts are updated within the organization" on public.contacts
    for update to authenticated
    using (organization_id = public.current_organization_id())
    with check (organization_id = public.current_organization_id());
create policy "Contacts are deleted within the organization" on public.contacts
    for delete to authenticated
    using (organization_id = public.current_organization_id());

-- Contact Notes
create policy "Contact notes are scoped to the organization" on public.contact_notes
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Contact notes are created in the organization" on public.contact_notes
    for insert to authenticated
    with check (organization_id = public.current_organization_id());
create policy "Contact notes are updated within the organization" on public.contact_notes
    for update to authenticated
    using (organization_id = public.current_organization_id())
    with check (organization_id = public.current_organization_id());
create policy "Contact notes are deleted within the organization" on public.contact_notes
    for delete to authenticated
    using (organization_id = public.current_organization_id());

-- Deals
create policy "Deals are scoped to the organization" on public.deals
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Deals are created in the organization" on public.deals
    for insert to authenticated
    with check (organization_id = public.current_organization_id());
create policy "Deals are updated within the organization" on public.deals
    for update to authenticated
    using (organization_id = public.current_organization_id())
    with check (organization_id = public.current_organization_id());
create policy "Deals are deleted within the organization" on public.deals
    for delete to authenticated
    using (organization_id = public.current_organization_id());

-- Deal Notes
create policy "Deal notes are scoped to the organization" on public.deal_notes
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Deal notes are created in the organization" on public.deal_notes
    for insert to authenticated
    with check (organization_id = public.current_organization_id());
create policy "Deal notes are updated within the organization" on public.deal_notes
    for update to authenticated
    using (organization_id = public.current_organization_id())
    with check (organization_id = public.current_organization_id());
create policy "Deal notes are deleted within the organization" on public.deal_notes
    for delete to authenticated
    using (organization_id = public.current_organization_id());

-- Sales
-- La escritura sigue reservada a las edge functions (service_role), que son las
-- que dan de alta y desactivan comerciales; aquí solo se acota la lectura.
create policy "Sales are scoped to the organization" on public.sales
    for select to authenticated
    using (organization_id = public.current_organization_id());

-- Tags
create policy "Tags are scoped to the organization" on public.tags
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Tags are created in the organization" on public.tags
    for insert to authenticated
    with check (organization_id = public.current_organization_id());
create policy "Tags are updated within the organization" on public.tags
    for update to authenticated
    using (organization_id = public.current_organization_id())
    with check (organization_id = public.current_organization_id());
create policy "Tags are deleted within the organization" on public.tags
    for delete to authenticated
    using (organization_id = public.current_organization_id());

-- Tasks
create policy "Tasks are scoped to the organization" on public.tasks
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Tasks are created in the organization" on public.tasks
    for insert to authenticated
    with check (organization_id = public.current_organization_id());
create policy "Tasks are updated within the organization" on public.tasks
    for update to authenticated
    using (organization_id = public.current_organization_id())
    with check (organization_id = public.current_organization_id());
create policy "Tasks are deleted within the organization" on public.tasks
    for delete to authenticated
    using (organization_id = public.current_organization_id());

-- Configuration
-- Cada organización tiene su fila. La lectura es para cualquier miembro; la
-- escritura, solo para administradores de esa organización.
create policy "Configuration is scoped to the organization" on public.configuration
    for select to authenticated
    using (organization_id = public.current_organization_id());
create policy "Configuration is created by organization admins" on public.configuration
    for insert to authenticated
    with check (
        organization_id = public.current_organization_id()
        and public.is_admin()
    );
create policy "Configuration is updated by organization admins" on public.configuration
    for update to authenticated
    using (
        organization_id = public.current_organization_id()
        and public.is_admin()
    )
    with check (
        organization_id = public.current_organization_id()
        and public.is_admin()
    );

-- Favicons excluded domains
-- Lista técnica de dominios sin favicon utilizable: no pertenece a ninguna
-- organización, así que se mantiene compartida.
create policy "Enable access for authenticated users only" on public.favicons_excluded_domains to authenticated using (true) with check (true);
