-- Etiquetas también en empresas y oportunidades. Las etiquetas (crm.tags)
-- solo colgaban de los contactos; una empresa «Cliente clave» o una
-- oportunidad «Licitación» no tenían dónde marcarse. Mismo modelo que en
-- contactos: un arreglo de ids de crm.tags en la fila, filtrable con
-- `tags@cs`.
--
-- Ver supabase/schemas/01_tables.sql y 03_views.sql (fuente de verdad).

alter table crm.companies add column if not exists tags bigint[];
alter table crm.deals add column if not exists tags bigint[];

-- El filtro «con esta etiqueta» es una búsqueda de contención en el arreglo.
create index if not exists contacts_tags_idx on crm.contacts using gin (tags);
create index if not exists companies_tags_idx on crm.companies using gin (tags);
create index if not exists deals_tags_idx on crm.deals using gin (tags);

-- companies_summary gana tags (al final: create or replace view solo admite
-- añadir columnas por el final, y este es el orden que tiene la vista en
-- producción).
create or replace view crm.companies_summary with (security_invoker = on) as
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
    c.custom_fields,
    count(distinct tk.id) as nb_tickets,
    count(distinct tk.id) filter (where tk.status <> 'closed') as nb_tickets_open,
    c.tags
from crm.companies c
    left join crm.deals d on c.id = d.company_id
    left join crm.contacts co on c.id = co.company_id
    left join crm.tickets tk on c.id = tk.company_id
group by c.id;
