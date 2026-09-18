-- Archivar contactos: un contacto viejo (se fue de la empresa, dejó de
-- responder hace años) sale de las listas y de los selectores sin perder su
-- historial, y se puede recuperar. Antes la única salida era borrarlo, con
-- sus notas, tareas y oportunidades detrás.
--
-- Ver supabase/schemas/01_tables.sql y 03_views.sql (fuente de verdad).

alter table crm.contacts add column if not exists archived_at timestamp with time zone;
create index if not exists contacts_archived_at_idx on crm.contacts (organization_id, archived_at);

-- contacts_summary gana archived_at (al final: create or replace view solo
-- admite añadir columnas por el final).
create or replace view crm.contacts_summary with (security_invoker = on) as
with resumen as (
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
        co.status as status_manual,
        co.status_set_at,
        co.archived_at,
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
        count(distinct tk.id) as nb_tickets,
        count(distinct tk.id) filter (where tk.status <> 'closed') as nb_tickets_open,
        co.organization_id,
        co.custom_fields,
        -- Última actividad de cualquier tipo, no solo la última nota.
        greatest(
            co.last_seen,
            max(t.done_date),
            max(d.updated_at),
            max(tk.created_at)
        ) as last_activity,
        -- Puntaje de interés (0-100): recencia de actividad (0-40) + volumen
        -- de interacciones, notas + tareas completadas (0-30) + oportunidad
        -- activa sin archivar (0-30). Bandas fijas (Caliente/Tibio/Frío),
        -- las mismas que LeadScoreBadge.tsx y que la temperatura de abajo.
        (
            case
                when greatest(co.last_seen, max(t.done_date), max(d.updated_at), max(tk.created_at)) >= now() - interval '7 days' then 40
                when greatest(co.last_seen, max(t.done_date), max(d.updated_at), max(tk.created_at)) >= now() - interval '30 days' then 25
                when greatest(co.last_seen, max(t.done_date), max(d.updated_at), max(tk.created_at)) >= now() - interval '90 days' then 10
                else 0
            end
            + case
                when count(distinct cn.id) + count(distinct t.id) filter (where t.done_date is not null) >= 6 then 30
                when count(distinct cn.id) + count(distinct t.id) filter (where t.done_date is not null) >= 3 then 20
                when count(distinct cn.id) + count(distinct t.id) filter (where t.done_date is not null) >= 1 then 10
                else 0
            end
            + case when bool_or(d.id is not null) then 30 else 0 end
        )::smallint as lead_score
    from crm.contacts co
        left join crm.tasks t on co.id = t.contact_id
        left join crm.companies c on co.company_id = c.id
        left join crm.contact_notes cn on co.id = cn.contact_id
        left join crm.deals d on co.id = any(d.contact_ids) and d.archived_at is null
        left join crm.tickets tk on co.id = tk.contact_id
    group by co.id, c.name
)
select
    r.id,
    r.first_name,
    r.last_name,
    r.gender,
    r.title,
    r.background,
    r.avatar,
    r.first_seen,
    r.last_seen,
    r.has_newsletter,
    -- Temperatura: manda la persona (14 días) o un estado de negocio; si no,
    -- el puntaje.
    case
        when r.status_manual is not null
             and r.status_manual not in ('cold', 'warm', 'hot') then r.status_manual
        when coalesce(r.status_set_at >= now() - interval '14 days', false) then r.status_manual
        when r.lead_score >= 70 then 'hot'
        when r.lead_score >= 40 then 'warm'
        else 'cold'
    end as status,
    r.tags,
    r.company_id,
    r.sales_id,
    r.linkedin_url,
    r.email_jsonb,
    r.phone_jsonb,
    r.email_fts,
    r.phone_fts,
    r.company_name,
    r.nb_tasks,
    r.nb_tickets,
    r.nb_tickets_open,
    r.organization_id,
    r.custom_fields,
    r.lead_score,
    r.last_activity,
    -- true cuando la temperatura la puso el puntaje y no una persona: la
    -- ficha lo dice para que nadie se pregunte «¿quién marcó esto?».
    not (
        (r.status_manual is not null and r.status_manual not in ('cold', 'warm', 'hot'))
        or coalesce(r.status_set_at >= now() - interval '14 days', false)
    ) as status_is_automatic,
    r.status_set_at,
    r.archived_at
from resumen r;
