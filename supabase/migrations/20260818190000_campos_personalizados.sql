-- Campos personalizados por organización.
--
-- Las DEFINICIONES (etiqueta, tipo, opciones) viven en configuration.config,
-- que ya es una fila por organización y se edita desde Ajustes; los VALORES de
-- cada ficha van en esta columna JSONB (clave = value del campo). Así una
-- inmobiliaria guarda «superficie» y una escuela «grado» sin migraciones ni
-- código: la base no cambia cuando el usuario define un campo nuevo.

alter table public.contacts
    add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.companies
    add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.deals
    add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- Las vistas resumen exponen la columna (las listas y las fichas leen de
-- ellas). Al reemplazar una vista, Postgres solo admite columnas nuevas al
-- final.

create or replace view public.companies_summary with (security_invoker = on) as
select
    c.id,
    c.created_at,
    c.name,
    c.sector,
    c.size,
    c.linkedin_url,
    c.website,
    c.phone_number,
    c.address,
    c.zipcode,
    c.city,
    c.state_abbr,
    c.sales_id,
    c.context_links,
    c.country,
    c.description,
    c.revenue,
    c.tax_identifier,
    c.logo,
    count(distinct d.id) as nb_deals,
    count(distinct co.id) as nb_contacts,
    c.organization_id,
    c.custom_fields
from public.companies c
    left join public.deals d on c.id = d.company_id
    left join public.contacts co on c.id = co.company_id
group by c.id;

create or replace view public.contacts_summary with (security_invoker = on) as
select
    co.id,
    co.first_name,
    co.last_name,
    co.gender,
    co.title,
    co.background,
    co.avatar,
    co.first_seen,
    co.last_seen,
    co.has_newsletter,
    co.status,
    co.tags,
    co.company_id,
    co.sales_id,
    co.linkedin_url,
    co.email_jsonb,
    co.phone_jsonb,
    (jsonb_path_query_array(co.email_jsonb, '$[*]."email"'))::text as email_fts,
    (jsonb_path_query_array(co.phone_jsonb, '$[*]."number"'))::text as phone_fts,
    c.name as company_name,
    count(distinct t.id) filter (where t.done_date is null) as nb_tasks,
    co.organization_id,
    co.custom_fields
from public.contacts co
    left join public.tasks t on co.id = t.contact_id
    left join public.companies c on co.company_id = c.id
group by co.id, c.name;
