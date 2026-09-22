-- Resumen de cliente: separar lo recurrente de lo que se cobra una sola vez,
-- y traer lo ganado en oportunidades.
--
-- `recurring_amount` sumaba TODOS los contratos activos, con periodicidad o
-- sin ella, así que un contrato de pago único inflaba el «recurrente» —lo
-- que se supone que entra cada periodo— y podía aparecer como próxima
-- renovación algo que no se renueva. Ahora:
--   · recurring_amount / nb_recurring_contracts → solo con periodicidad.
--   · one_time_amount / nb_one_time_contracts → los de pago único (y los que
--     se guardaron sin periodicidad, que tampoco se renuevan).
--   · next_renewal_on → solo de los recurrentes.
--
-- Y dos columnas nuevas, nb_won_deals / won_amount: lo ganado en el embudo
-- por esa empresa. «Ganada» no es un estado de la base —cada organización
-- decide qué etapas cuentan (config.dealPipelines[].pipelineStatuses)—, así
-- que se resuelve contra crm.configuration igual que en
-- crm.affiliate_commissions.
--
-- Aditiva: las columnas existentes conservan nombre, tipo y orden.

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
    (coalesce(t.open_tickets, 0) >= 3 or coalesce(t.overdue_tickets, 0) >= 1) as at_risk,
    coalesce(k.nb_recurring_contracts, 0) as nb_recurring_contracts,
    coalesce(k.nb_one_time_contracts, 0) as nb_one_time_contracts,
    coalesce(k.one_time_amount, 0) as one_time_amount,
    coalesce(g.nb_won_deals, 0) as nb_won_deals,
    coalesce(g.won_amount, 0) as won_amount
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
    select
        count(*) as nb_active_contracts,
        count(*) filter (where billing_period in ('monthly', 'quarterly', 'yearly'))
            as nb_recurring_contracts,
        count(*) filter (where billing_period is null
                            or billing_period not in ('monthly', 'quarterly', 'yearly'))
            as nb_one_time_contracts,
        sum(amount) filter (where billing_period in ('monthly', 'quarterly', 'yearly'))
            as recurring_amount,
        sum(amount) filter (where billing_period is null
                               or billing_period not in ('monthly', 'quarterly', 'yearly'))
            as one_time_amount,
        min(renews_on) filter (
            where renews_on is not null
              and billing_period in ('monthly', 'quarterly', 'yearly')
        ) as next_renewal_on
      from crm.contracts
     where company_id = c.id and status = 'active'
) k on true
left join lateral (
    select count(*) as nb_won_deals,
           sum(d.amount) as won_amount
      from crm.deals d
     where d.company_id = c.id
       and d.organization_id = c.organization_id
       and d.archived_at is null
       and coalesce(
             (
               select embudo -> 'pipelineStatuses' ? d.stage
                 from crm.configuration cfg
                      cross join lateral jsonb_array_elements(
                        coalesce(cfg.config -> 'dealPipelines', '[]'::jsonb)
                      ) as embudo
                where cfg.organization_id = d.organization_id
                  and embudo ->> 'value' = coalesce(d.pipeline, 'ventas')
                limit 1
             ),
             false
           )
) g on true
left join lateral (
    select count(*) as open_tickets,
           count(*) filter (where due_at < now()) as overdue_tickets
      from crm.tickets
     where company_id = c.id and status <> 'closed'
) t on true;
