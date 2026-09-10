-- Ni la ficha de un contacto ni la de una empresa dejaban ver cuántos
-- tickets tenía levantados: había que ir a /tickets y filtrar a mano. Se
-- añade el conteo a las mismas vistas que ya resumen tareas y oportunidades
-- (contacts_summary.nb_tasks, companies_summary.nb_deals/nb_contacts), para
-- no abrir una consulta aparte por cada ficha.
--
-- "Abierto" se define como status <> 'closed': por ahora los tres estados de
-- ticket (open, in-progress, closed) son fijos de fábrica, sin editor en
-- Ajustes (a diferencia de las etapas de un embudo, que sí declaran cuáles
-- cuentan como ganadas/perdidas). Si en el futuro se vuelven configurables
-- por organización, esta condición tendrá que leer esa configuración en
-- lugar de comparar contra un valor fijo.

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
    -- `create or replace view` solo admite agregar columnas al final: por eso
    -- van aquí y no junto a nb_deals/nb_contacts, con las que encajarían
    -- mejor por significado.
    count(distinct tk.id) as nb_tickets,
    count(distinct tk.id) filter (where tk.status <> 'closed') as nb_tickets_open
from crm.companies c
    left join crm.deals d on c.id = d.company_id
    left join crm.contacts co on c.id = co.company_id
    left join crm.tickets tk on c.id = tk.company_id
group by c.id;

create or replace view crm.contacts_summary with (security_invoker = on) as
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
    co.custom_fields,
    -- Puntaje de interés (0-100): recencia de actividad (0-40) + volumen de
    -- interacciones, notas + tareas completadas (0-30) + oportunidad activa
    -- sin archivar (0-30). Bandas fijas (Caliente/Tibio/Frío), no
    -- configurables por organización: ver LeadScoreBadge.tsx.
    (
        case
            when co.last_seen >= now() - interval '7 days' then 40
            when co.last_seen >= now() - interval '30 days' then 25
            when co.last_seen >= now() - interval '90 days' then 10
            else 0
        end
        + case
            when count(distinct cn.id) + count(distinct t.id) filter (where t.done_date is not null) >= 6 then 30
            when count(distinct cn.id) + count(distinct t.id) filter (where t.done_date is not null) >= 3 then 20
            when count(distinct cn.id) + count(distinct t.id) filter (where t.done_date is not null) >= 1 then 10
            else 0
        end
        + case when bool_or(d.id is not null) then 30 else 0 end
    )::smallint as lead_score,
    -- `create or replace view` solo admite agregar columnas al final: por eso
    -- van aquí y no junto a nb_tasks, con la que encajarían mejor por
    -- significado.
    count(distinct tk.id) as nb_tickets,
    count(distinct tk.id) filter (where tk.status <> 'closed') as nb_tickets_open
from crm.contacts co
    left join crm.tasks t on co.id = t.contact_id
    left join crm.companies c on co.company_id = c.id
    left join crm.contact_notes cn on co.id = cn.contact_id
    left join crm.deals d on co.id = any(d.contact_ids) and d.archived_at is null
    left join crm.tickets tk on co.id = tk.contact_id
group by co.id, c.name;
