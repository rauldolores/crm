-- Línea de tiempo del contacto: vista crm.contact_timeline e índices para
-- que el historial de un contacto con años de notas siga siendo barato.
-- Ver supabase/schemas/03_views.sql y 01_tables.sql (fuente de verdad).

create index if not exists contact_notes_contact_id_date_idx on crm.contact_notes (contact_id, date desc);
create index if not exists deal_notes_deal_id_date_idx on crm.deal_notes (deal_id, date desc);
create index if not exists tasks_contact_id_idx on crm.tasks (contact_id);
create index if not exists tickets_contact_id_idx on crm.tickets (contact_id);
create index if not exists quotes_contact_id_idx on crm.quotes (contact_id);

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

grant all on table crm.contact_timeline to anon;
grant all on table crm.contact_timeline to authenticated;
grant all on table crm.contact_timeline to service_role;
