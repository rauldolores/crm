-- Temperatura automática del contacto.
--
-- El estado (frío / templado / caliente) era un campo manual que se ponía
-- desde una nota y nadie volvía a tocar: un contacto marcado «caliente» en
-- marzo seguía caliente en septiembre sin una sola llamada. Un campo que no
-- se actualiza no sirve para filtrar ni para el panel.
--
-- Ahora la temperatura sale de la actividad real, con el mismo puntaje que
-- ya calculaba contacts_summary (recencia + interacciones + oportunidad
-- abierta), y se enfría sola con el tiempo porque se calcula al leer, no
-- con un proceso nocturno:
--
--   caliente  puntaje >= 70   (hablaste con él esta semana Y hay una venta
--                              abierta, o seis interacciones recientes)
--   templado  puntaje >= 40   (actividad este mes, o algo de actividad más
--                              una oportunidad)
--   frío      el resto
--
-- Lo que pone una persona sigue mandando, pero con caducidad: un estado
-- fijado a mano se respeta 14 días y luego vuelve a calcularse. Así el
-- vendedor puede decir «este está caliente aunque no haya notas» sin que
-- ese juicio se quede fosilizado. «Con contrato» y cualquier otro estado
-- que no sea una temperatura (los que una organización añada en Ajustes)
-- son hechos de negocio, no temperaturas: no caducan nunca.
--
-- La recencia deja de mirar solo last_seen (que únicamente movían las
-- notas) y considera la última actividad de cualquier tipo: nota, tarea
-- completada, oportunidad tocada o ticket.

alter table crm.contacts
    add column if not exists status_set_at timestamp with time zone;

-- Sella cuándo una persona fijó el estado. Se dispara solo si el estado
-- cambia de verdad, para que guardar una ficha sin tocarlo no renueve la
-- caducidad de 14 días.
CREATE OR REPLACE FUNCTION "crm"."stamp_contact_status_set_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.status is not null and new.status_set_at is null then
      new.status_set_at := now();
    end if;
  elsif new.status is distinct from old.status then
    new.status_set_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_crm_contacts_status_set on crm.contacts;
create trigger on_crm_contacts_status_set
    before insert or update of status on crm.contacts
    for each row execute function crm.stamp_contact_status_set_at();

-- Los estados existentes se dejan sin sello: pasan a automáticos desde ya,
-- salvo «con contrato» y los personalizados, que se conservan tal cual.

-- drop + create, no "create or replace": en producción la vista tiene las
-- columnas de tickets al final (se añadieron por migración) y el esquema
-- declarativo las tiene antes; Postgres no deja reordenar columnas al
-- reemplazar. Los grants se vuelven a dar abajo (ver 06_grants.sql).
drop view if exists crm.contacts_summary;

create view crm.contacts_summary with (security_invoker = on) as
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
    r.status_set_at
from resumen r;

grant all on table crm.contacts_summary to anon;
grant all on table crm.contacts_summary to authenticated;
grant all on table crm.contacts_summary to service_role;
