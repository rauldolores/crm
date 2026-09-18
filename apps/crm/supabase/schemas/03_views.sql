--
-- Views
-- This file declares all views in the crm schema.
--

create or replace view crm.activity_log with (security_invoker = on) as
select
    ('company.' || c.id || '.created') as id,
    'company.created' as type,
    c.created_at as date,
    c.id as company_id,
    c.sales_id,
    to_json(c.*) as company,
    null::json as contact,
    null::json as deal,
    null::json as contact_note,
    null::json as deal_note,
    c.organization_id
from crm.companies c
union all
select
    ('contact.' || co.id || '.created') as id,
    'contact.created' as type,
    co.first_seen as date,
    co.company_id,
    co.sales_id,
    null::json as company,
    to_json(co.*) as contact,
    null::json as deal,
    null::json as contact_note,
    null::json as deal_note,
    co.organization_id
from crm.contacts co
union all
select
    ('contactNote.' || cn.id || '.created') as id,
    'contactNote.created' as type,
    cn.date,
    co.company_id,
    cn.sales_id,
    null::json as company,
    null::json as contact,
    null::json as deal,
    to_json(cn.*) as contact_note,
    null::json as deal_note,
    cn.organization_id
from crm.contact_notes cn
    left join crm.contacts co on co.id = cn.contact_id
union all
select
    ('deal.' || d.id || '.created') as id,
    'deal.created' as type,
    d.created_at as date,
    d.company_id,
    d.sales_id,
    null::json as company,
    null::json as contact,
    to_json(d.*) as deal,
    null::json as contact_note,
    null::json as deal_note,
    d.organization_id
from crm.deals d
union all
select
    ('dealNote.' || dn.id || '.created') as id,
    'dealNote.created' as type,
    dn.date,
    d.company_id,
    dn.sales_id,
    null::json as company,
    null::json as contact,
    null::json as deal,
    null::json as contact_note,
    to_json(dn.*) as deal_note,
    dn.organization_id
from crm.deal_notes dn
    left join crm.deals d on d.id = dn.deal_id;

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
    count(distinct tk.id) as nb_tickets,
    count(distinct tk.id) filter (where tk.status <> 'closed') as nb_tickets_open,
    c.organization_id,
    c.custom_fields,
    c.tags
from crm.companies c
    left join crm.deals d on c.id = d.company_id
    left join crm.contacts co on c.id = co.company_id
    left join crm.tickets tk on c.id = tk.company_id
group by c.id;

-- Resumen de contactos con temperatura automática: ver la migración
-- 20260912120000_temperatura_automatica_del_contacto.sql para el porqué.
-- El estado fijado a mano manda 14 días; «con contrato» y los estados que no
-- son temperaturas no caducan; el resto sale del puntaje.
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

-- Módulo Afiliados: negocio referido y comisión devengada por afiliado.
--
-- "Ganada" no es un estado en la base — cada organización decide qué etapas
-- de cada embudo cuentan como ganadas (config.dealPipelines[].pipelineStatuses,
-- lo mismo que usa la pantalla de Informes). Por eso la vista cruza contra
-- crm.configuration en vez de comparar contra una etapa fija: una etapa
-- llamada "won" en un embudo puede no significar nada en otro.
--
-- La atribución viene de companies.referred_by_affiliate_id (primer toque),
-- así que TODO lo que compre un cliente referido cuenta, no solo la primera
-- oportunidad.
create or replace view crm.affiliate_commissions with (security_invoker = on) as
select
    a.id as id,
    a.organization_id,
    a.contact_id,
    a.company_id,
    a.referral_code,
    a.commission_percentage,
    a.active,
    count(distinct c.id) as nb_referred_companies,
    count(distinct d.id) filter (where d.es_ganada) as nb_won_deals,
    coalesce(sum(d.amount) filter (where d.es_ganada), 0) as won_amount,
    -- Lo que le toca al afiliado. Sin porcentaje configurado todavía, 0:
    -- el negocio referido igual queda visible en las columnas de arriba.
    round(
        coalesce(sum(d.amount) filter (where d.es_ganada), 0)
        * coalesce(a.commission_percentage, 0) / 100.0
    ) as commission_amount
from crm.affiliates a
    left join crm.companies c
        on c.referred_by_affiliate_id = a.id
       and c.organization_id = a.organization_id
    left join lateral (
        select
            deals.id,
            deals.amount,
            -- ¿Está en una etapa que su propio embudo marca como ganada?
            coalesce(
                (
                    select embudo -> 'pipelineStatuses' ? deals.stage
                    from crm.configuration cfg
                        cross join lateral jsonb_array_elements(
                            coalesce(cfg.config -> 'dealPipelines', '[]'::jsonb)
                        ) as embudo
                    where cfg.organization_id = deals.organization_id
                      and embudo ->> 'value' = coalesce(deals.pipeline, 'ventas')
                    limit 1
                ),
                false
            ) as es_ganada
        from crm.deals
        where deals.company_id = c.id
          and deals.organization_id = a.organization_id
          and deals.archived_at is null
    ) d on true
group by a.id;

create or replace view crm.init_state with (security_invoker = off) as
select count(sub.id) as is_initialized
from (
    select sales.id from crm.sales limit 1
) sub;

-- Todo lo que ha hecho un cliente, en una fila por empresa. Es lo que
-- responde «¿cuánto vale este cliente y qué tiene contratado?» sin recorrer
-- sus compras una por una.
create or replace view crm.customer_summary with (security_invoker = on) as
select
    c.id,
    c.organization_id,
    c.name,
    c.lifecycle_stage,
    c.sales_id,
    coalesce(p.nb_purchases, 0) as nb_purchases,
    coalesce(p.total_spent, 0) as total_spent,
    p.first_purchase_on,
    p.last_purchase_on,
    coalesce(k.nb_active_contracts, 0) as nb_active_contracts,
    coalesce(k.recurring_amount, 0) as recurring_amount,
    k.next_renewal_on,
    coalesce(t.open_tickets, 0) as open_tickets,
    coalesce(t.overdue_tickets, 0) as overdue_tickets,
    (coalesce(t.open_tickets, 0) >= 3 or coalesce(t.overdue_tickets, 0) >= 1) as at_risk
from crm.companies c
left join lateral (
    select count(*) as nb_purchases,
           sum(amount) as total_spent,
           min(purchased_on) as first_purchase_on,
           max(purchased_on) as last_purchase_on
      from crm.purchases
     where company_id = c.id and status <> 'cancelled'
) p on true
left join lateral (
    select count(*) as nb_active_contracts,
           sum(amount) as recurring_amount,
           min(renews_on) filter (where renews_on is not null) as next_renewal_on
      from crm.contracts
     where company_id = c.id and status = 'active'
) k on true
left join lateral (
    select count(*) as open_tickets,
           count(*) filter (where due_at < now()) as overdue_tickets
      from crm.tickets
     where company_id = c.id and status <> 'closed'
) t on true;

-- Línea de tiempo de un contacto: todo lo que le ha pasado, en orden
-- cronológico y con la misma forma, para pintarlo como una sola lista.
--
-- Une las notas (notas simples, llamadas, reuniones, WhatsApp, correos —
-- entrantes y salientes ya se guardan como contact_notes tipificadas), las
-- tareas (una fila al crearse/vencer y otra al completarse), las
-- oportunidades en las que participa (alta y, si se archivó, el archivo),
-- los tickets (apertura y cierre) y las cotizaciones (envío y aceptación o
-- rechazo). Cada fila trae lo mínimo para el resumen de una línea —tipo,
-- fecha, autor, título y texto— y el id de origen para abrir el detalle.
--
-- `kind` es la familia (note, task, deal, ticket, quote) y `type` el matiz
-- dentro de ella (call, task_done, deal_archived, ticket_closed,
-- quote_accepted…); los filtros de la interfaz trabajan con ambos.
create or replace view crm.contact_timeline with (security_invoker = on) as
-- Notas, con su tipificación.
select
    ('note.' || cn.id) as id,
    'note' as kind,
    coalesce(cn.type, 'note') as type,
    cn.id as source_id,
    cn.contact_id,
    co.company_id,
    cn.date,
    cn.sales_id,
    null::text as title,
    cn.text,
    cn.status,
    coalesce(array_length(cn.attachments, 1), 0) as attachment_count,
    null::numeric as amount,
    cn.organization_id
from crm.contact_notes cn
    join crm.contacts co on co.id = cn.contact_id
union all
-- Tareas: cuándo se crearon o vencen…
select
    ('task.' || t.id),
    'task',
    'task',
    t.id,
    t.contact_id,
    co.company_id,
    t.due_date,
    t.sales_id,
    t.type,
    t.text,
    null,
    0,
    null,
    t.organization_id
from crm.tasks t
    join crm.contacts co on co.id = t.contact_id
where t.due_date is not null
union all
-- …y cuándo se completaron.
select
    ('task_done.' || t.id),
    'task',
    'task_done',
    t.id,
    t.contact_id,
    co.company_id,
    t.done_date,
    t.sales_id,
    t.type,
    t.text,
    null,
    0,
    null,
    t.organization_id
from crm.tasks t
    join crm.contacts co on co.id = t.contact_id
where t.done_date is not null
union all
-- Oportunidades en las que participa el contacto: alta…
select
    ('deal.' || d.id),
    'deal',
    'deal',
    d.id,
    co.id,
    d.company_id,
    d.created_at,
    d.sales_id,
    d.name,
    d.description,
    d.stage,
    0,
    d.amount::numeric,
    d.organization_id
from crm.deals d
    join crm.contacts co on co.id = any (d.contact_ids)
union all
-- …cambios de etapa (crm.deal_events): el texto es la etapa nueva y
-- `status` la anterior, para que la interfaz diga «de X a Y»…
select
    ('deal_stage.' || e.id),
    'deal',
    'deal_stage',
    d.id,
    co.id,
    d.company_id,
    e.created_at,
    e.sales_id,
    d.name,
    e.new_value,
    e.old_value,
    0,
    d.amount::numeric,
    e.organization_id
from crm.deal_events e
    join crm.deals d on d.id = e.deal_id
    join crm.contacts co on co.id = any (d.contact_ids)
where e.field = 'stage'
union all
-- …y archivo (ganada o perdida, según la etapa con la que se archivó).
select
    ('deal_archived.' || d.id),
    'deal',
    'deal_archived',
    d.id,
    co.id,
    d.company_id,
    d.archived_at,
    d.sales_id,
    d.name,
    d.loss_reason,
    d.stage,
    0,
    d.amount::numeric,
    d.organization_id
from crm.deals d
    join crm.contacts co on co.id = any (d.contact_ids)
where d.archived_at is not null
union all
-- Tickets: apertura…
select
    ('ticket.' || tk.id),
    'ticket',
    'ticket',
    tk.id,
    tk.contact_id,
    tk.company_id,
    tk.created_at,
    tk.sales_id,
    tk.subject,
    tk.description,
    tk.status,
    0,
    null,
    tk.organization_id
from crm.tickets tk
union all
-- …y cierre.
select
    ('ticket_closed.' || tk.id),
    'ticket',
    'ticket_closed',
    tk.id,
    tk.contact_id,
    tk.company_id,
    tk.closed_at,
    tk.sales_id,
    tk.subject,
    tk.resolution,
    tk.status,
    0,
    null,
    tk.organization_id
from crm.tickets tk
where tk.closed_at is not null
union all
-- Cotizaciones enviadas…
select
    ('quote.' || q.id),
    'quote',
    'quote',
    q.id,
    q.contact_id,
    q.company_id,
    q.sent_at,
    q.sales_id,
    coalesce(q.title, q.number),
    q.number,
    q.status,
    0,
    q.total,
    q.organization_id
from crm.quotes q
where q.contact_id is not null and q.sent_at is not null
union all
-- …aceptadas o rechazadas.
select
    ('quote_decided.' || q.id),
    'quote',
    case when q.accepted_at is not null then 'quote_accepted' else 'quote_rejected' end,
    q.id,
    q.contact_id,
    q.company_id,
    coalesce(q.accepted_at, q.rejected_at),
    q.sales_id,
    coalesce(q.title, q.number),
    coalesce(q.accepted_by_name, q.rejection_reason),
    q.status,
    0,
    q.total,
    q.organization_id
from crm.quotes q
where q.contact_id is not null
  and (q.accepted_at is not null or q.rejected_at is not null);
