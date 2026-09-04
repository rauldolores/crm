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
    c.organization_id,
    c.custom_fields
from crm.companies c
    left join crm.deals d on c.id = d.company_id
    left join crm.contacts co on c.id = co.company_id
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
    )::smallint as lead_score
from crm.contacts co
    left join crm.tasks t on co.id = t.contact_id
    left join crm.companies c on co.company_id = c.id
    left join crm.contact_notes cn on co.id = cn.contact_id
    left join crm.deals d on co.id = any(d.contact_ids) and d.archived_at is null
group by co.id, c.name;

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
