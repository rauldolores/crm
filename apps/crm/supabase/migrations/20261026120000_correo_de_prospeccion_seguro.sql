-- Correo de prospección seguro: baja de un clic, freno cuando el contacto ya
-- contestó, sin duplicados por dirección y un límite diario con
-- calentamiento. Todo lo decide el despachador (/api/correos/despachar), el
-- único punto por donde sale un correo de la cola.

-- A qué dirección salió de verdad: es lo que permite no mandar la misma
-- plantilla dos veces a una dirección que comparten varios contactos, y dar
-- de baja exactamente la dirección que recibió el correo.
alter table crm.email_outbox add column if not exists sent_to text;
-- Un correo que ya no debe salir (baja, repetido, el contacto ya contestó)
-- no es un fallo: se cancela, con su motivo.
alter table crm.email_outbox add column if not exists cancelled_at timestamp with time zone;
alter table crm.email_outbox add column if not exists cancel_reason text;
-- El enlace de baja de cada correo. Aleatorio y de un solo correo: no deja
-- adivinar el de otro ni dar de baja a nadie más.
alter table crm.email_outbox add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists email_outbox_unsubscribe_token_idx
    on crm.email_outbox (unsubscribe_token);
create index if not exists email_outbox_enviados_a_idx
    on crm.email_outbox (organization_id, sent_to, template_id)
    where sent_at is not null;

-- Los pendientes ya no incluyen los cancelados.
drop index if exists crm.email_outbox_pendientes_idx;
create index email_outbox_pendientes_idx
    on crm.email_outbox (next_attempt_at)
    where sent_at is null and cancelled_at is null;

-- Direcciones que no quieren correos comerciales de la organización. Por
-- dirección y no por contacto: varias fichas pueden compartirla.
create table if not exists crm.email_suppressions (
    organization_id uuid not null,
    email text not null,
    reason text not null default 'unsubscribe' check (reason in ('unsubscribe', 'manual')),
    -- El correo desde cuyo enlace se dio de baja, si fue así.
    outbox_id bigint references crm.email_outbox(id) on delete set null,
    created_at timestamp with time zone not null default now(),
    primary key (organization_id, email)
);

alter table crm.email_suppressions enable row level security;

-- Solo lectura: la escribe la ruta pública de baja, con la clave de servicio.
create policy "Email suppressions are scoped to the organization" on crm.email_suppressions
    for select to authenticated
    using (organization_id = crm.current_organization_id());

grant select on table crm.email_suppressions to authenticated;
grant select, insert, update, delete on table crm.email_suppressions to service_role;
revoke all on table crm.email_suppressions from anon;

-- Cuántos correos comerciales salen como mucho en 24 horas, y si se llega a
-- ese máximo poco a poco (un dominio nuevo que manda cientos el primer día
-- acaba en spam).
alter table crm.email_settings add column if not exists daily_limit integer not null default 200
    check (daily_limit between 1 and 100000);
alter table crm.email_settings add column if not exists warmup boolean not null default true;

-- El aviso al despachador ya no cuenta los cancelados: si no, una cola con
-- solo correos cancelados lo despertaría cada minuto para nada.
create or replace function crm.despachar_correos() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  pendientes integer;
  destino text;
  secreto text;
begin
  select count(*) into pendientes
    from crm.email_outbox
   where sent_at is null
     and cancelled_at is null
     and attempts < max_attempts
     and next_attempt_at <= now();

  if pendientes = 0 then
    return 0;
  end if;

  select value into destino from crm.internal_settings where key = 'app_url';
  select value into secreto from crm.internal_settings where key = 'dispatch_secret';

  if destino is null or secreto is null then
    return 0;
  end if;

  perform net.http_post(
    url := rtrim(destino, '/') || '/api/correos/despachar',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Vinqulia-Despacho', secreto
    ),
    timeout_milliseconds := 30000
  );

  return pendientes;
end;
$$;
