-- Multi-tenencia: cada fila pertenece a una organización de KontrolIA Auth.
--
-- El aislamiento se apoya en el claim `organization_id` del JWT, que inyecta el
-- hook `kontrolia_auth.custom_access_token_hook`. El cliente no puede falsearlo
-- porque el token va firmado, y `organization_id` lo rellena el valor por
-- defecto de la columna, no la petición.
--
-- Esta migración se aplica sobre tablas vacías: no incluye relleno de datos
-- existentes. Si se ejecuta sobre una instalación con datos, hay que asignar
-- antes la organización a cada fila.

-- 1. Función auxiliar: organización activa de la sesión.
-- `stable` para que el planificador la evalúe una vez por consulta y no una vez
-- por fila, lo que permite que los índices por organization_id se usen.
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb ->> 'organization_id',
    ''
  )::uuid;
$$;

grant all on function public.current_organization_id() to anon;
grant all on function public.current_organization_id() to authenticated;
grant all on function public.current_organization_id() to service_role;

-- 2. Columna organization_id en las tablas con dueño.
alter table public.companies
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.contacts
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.contact_notes
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.deals
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.deal_notes
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.sales
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.tags
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.tasks
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;

-- 3. La unicidad de sales pasa a ser por organización: KontrolIA Auth permite
-- que una persona sea miembro de varias organizaciones, y entonces necesita una
-- ficha de comercial en cada una.
drop index if exists public.uq__sales__user_id;
create unique index uq__sales__organization_id__user_id
    on public.sales using btree (organization_id, user_id);

-- 4. configuration deja de ser un singleton (check (id = 1)) y pasa a tener una
-- fila por organización, para que cada empresa tenga su marca, sus etapas y su
-- moneda.
-- La fila única anterior pertenecía a "la instalación", concepto que ya no
-- existe: no se puede atribuir a ninguna organización. Se elimina para poder
-- añadir la columna como not null; cada organización recibirá la suya al primer
-- acceso, vía provision_crm_access(). Si una instalación con datos llega aquí
-- con configuración personalizada, hay que copiarla antes a mano.
delete from public.configuration;

alter table public.configuration drop constraint if exists configuration_singleton;
alter table public.configuration drop constraint if exists configuration_pkey;
alter table public.configuration drop column if exists id;
alter table public.configuration
    add column organization_id uuid not null default (auth.jwt() ->> 'organization_id')::uuid;
alter table public.configuration
    add constraint configuration_pkey primary key (organization_id);

-- 5. Índices de aislamiento. Sin ellos, el filtro de RLS degenera en un escaneo
-- secuencial de la tabla completa en cuanto haya varias empresas dentro.
create index if not exists companies_organization_id_idx on public.companies (organization_id);
create index if not exists contacts_organization_id_idx on public.contacts (organization_id);
create index if not exists contact_notes_organization_id_idx on public.contact_notes (organization_id);
create index if not exists deals_organization_id_idx on public.deals (organization_id);
create index if not exists deal_notes_organization_id_idx on public.deal_notes (organization_id);
create index if not exists sales_organization_id_idx on public.sales (organization_id);
create index if not exists tags_organization_id_idx on public.tags (organization_id);
create index if not exists tasks_organization_id_idx on public.tasks (organization_id);

-- 6. is_admin() acotada a la organización.
-- Es SECURITY DEFINER y salta el RLS: sin este filtro, un administrador de una
-- organización lo sería en todas aquellas de las que es miembro.
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return exists (
    select 1 from public.sales
    where user_id = auth.uid()
      and administrator = true
      and organization_id = public.current_organization_id()
  );
end;
$$;

-- 7. Fuera los triggers sobre auth.users.
-- auth.users es compartida con el resto del ecosistema KontrolIA: quien se
-- registrara en cualquier otra aplicación aparecía como comercial del CRM.
-- Además un trigger no puede saber la organización, porque en el alta todavía
-- no hay sesión ni claim.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_update_user();

-- 8. Aprovisionamiento al primer acceso, que sí conoce la organización.
CREATE OR REPLACE FUNCTION "public"."provision_crm_access"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  org_id uuid;
  uid uuid;
  datos_usuario record;
  es_el_primero boolean;
begin
  org_id := public.current_organization_id();
  uid := auth.uid();

  if org_id is null or uid is null then
    return;
  end if;

  -- Se crea vacía a propósito: los valores por defecto viven en
  -- defaultConfiguration.ts y el frontend los aplica cuando esta fila no trae
  -- claves. Duplicarlos aquí daría dos fuentes de verdad.
  insert into public.configuration (organization_id, config)
  values (org_id, '{}'::jsonb)
  on conflict (organization_id) do nothing;

  if exists (
    select 1 from public.sales
    where organization_id = org_id and user_id = uid
  ) then
    return;
  end if;

  select not exists (
    select 1 from public.sales where organization_id = org_id
  ) into es_el_primero;

  select email, raw_user_meta_data
    into datos_usuario
  from auth.users
  where id = uid;

  insert into public.sales
    (organization_id, first_name, last_name, email, user_id, administrator)
  values (
    org_id,
    coalesce(
      datos_usuario.raw_user_meta_data ->> 'first_name',
      datos_usuario.raw_user_meta_data -> 'custom_claims' ->> 'first_name',
      'Pending'
    ),
    coalesce(
      datos_usuario.raw_user_meta_data ->> 'last_name',
      datos_usuario.raw_user_meta_data -> 'custom_claims' ->> 'last_name',
      'Pending'
    ),
    datos_usuario.email,
    uid,
    es_el_primero
  )
  on conflict (organization_id, user_id) do nothing;
end;
$$;

grant all on function public.provision_crm_access() to authenticated;
grant all on function public.provision_crm_access() to service_role;

-- 9. Políticas RLS: se sustituyen las permisivas `using (true)` por el filtro
-- por organización.
drop policy if exists "Enable read access for authenticated users" on public.companies;
drop policy if exists "Enable insert for authenticated users only" on public.companies;
drop policy if exists "Enable update for authenticated users only" on public.companies;
drop policy if exists "Company Delete Policy" on public.companies;

drop policy if exists "Enable read access for authenticated users" on public.contacts;
drop policy if exists "Enable insert for authenticated users only" on public.contacts;
drop policy if exists "Enable update for authenticated users only" on public.contacts;
drop policy if exists "Contact Delete Policy" on public.contacts;

drop policy if exists "Enable read access for authenticated users" on public.contact_notes;
drop policy if exists "Enable insert for authenticated users only" on public.contact_notes;
drop policy if exists "Contact Notes Update policy" on public.contact_notes;
drop policy if exists "Contact Notes Delete Policy" on public.contact_notes;

drop policy if exists "Enable read access for authenticated users" on public.deals;
drop policy if exists "Enable insert for authenticated users only" on public.deals;
drop policy if exists "Enable update for authenticated users only" on public.deals;
drop policy if exists "Deals Delete Policy" on public.deals;

drop policy if exists "Enable read access for authenticated users" on public.deal_notes;
drop policy if exists "Enable insert for authenticated users only" on public.deal_notes;
drop policy if exists "Deal Notes Update Policy" on public.deal_notes;
drop policy if exists "Deal Notes Delete Policy" on public.deal_notes;

drop policy if exists "Enable read access for authenticated users" on public.sales;

drop policy if exists "Enable read access for authenticated users" on public.tags;
drop policy if exists "Enable insert for authenticated users only" on public.tags;
drop policy if exists "Enable update for authenticated users only" on public.tags;
drop policy if exists "Enable delete for authenticated users only" on public.tags;

drop policy if exists "Enable read access for authenticated users" on public.tasks;
drop policy if exists "Enable insert for authenticated users only" on public.tasks;
drop policy if exists "Task Update Policy" on public.tasks;
drop policy if exists "Task Delete Policy" on public.tasks;

drop policy if exists "Enable read for authenticated" on public.configuration;
drop policy if exists "Enable insert for admins" on public.configuration;
drop policy if exists "Enable update for admins" on public.configuration;

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

create policy "Sales are scoped to the organization" on public.sales
    for select to authenticated
    using (organization_id = public.current_organization_id());

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
