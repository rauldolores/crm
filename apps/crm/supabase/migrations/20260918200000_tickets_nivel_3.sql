-- Tickets, nivel 3: encuesta de satisfacción y riesgo del cliente.
--
--   encuesta   Cada ticket nace con un enlace público (/encuesta/<token>)
--              con una sola pregunta: ¿cómo fue la atención? (1 a 5) y un
--              comentario opcional. Se manda desde una automatización «se
--              cierra un ticket → correo» con el campo {{ticket.encuesta}};
--              la respuesta se guarda en el ticket y alimenta el informe de
--              soporte (CSAT).
--   riesgo     customer_summary gana los tickets abiertos y vencidos de cada
--              empresa y una bandera at_risk (3 o más abiertos, o alguno
--              vencido): un cliente con contrato y soporte atascado es el
--              primero que se va.

alter table crm.tickets
    add column if not exists survey_token text not null default (
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    ),
    add column if not exists satisfaction_rating smallint
      check (satisfaction_rating between 1 and 5),
    add column if not exists satisfaction_comment text,
    add column if not exists satisfaction_at timestamp with time zone;

create unique index if not exists tickets_survey_token_uk on crm.tickets (survey_token);

-- La vista solo añade columnas al final: create or replace basta.
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
