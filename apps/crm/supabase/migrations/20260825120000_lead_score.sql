-- Puntaje de interés (lead score) por contacto.
--
-- Se calcula al vuelo en la vista resumen, sin columna ni trigger nuevos:
-- combina recencia de actividad, volumen de interacciones (notas + tareas
-- completadas) y si tiene una oportunidad activa (no archivada). Bandas
-- fijas (Caliente/Tibio/Frío), no configurables por organización.
--
-- Al reemplazar una vista, Postgres solo admite columnas nuevas al final.

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
    )::smallint as lead_score
from crm.contacts co
    left join crm.tasks t on co.id = t.contact_id
    left join crm.companies c on co.company_id = c.id
    left join crm.contact_notes cn on co.id = cn.contact_id
    left join crm.deals d on co.id = any(d.contact_ids) and d.archived_at is null
group by co.id, c.name;
