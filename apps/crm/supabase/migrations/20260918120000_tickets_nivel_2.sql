-- Tickets, nivel 2: SLA, enlaces, automatizaciones y fusión.
--
--   SLA        Ajustes → Tickets guarda, por prioridad, las horas objetivo de
--              primera respuesta y de resolución (configuration.config
--              .ticketSla). Al crear un ticket o cambiarle la prioridad, la
--              base calcula first_response_due_at y due_at; la primera nota
--              de una persona sella first_response_at. «Vencido» =
--              abierto y due_at < now().
--   enlaces    deal_id y contract_id: «este ticket es de esta venta / de
--              este contrato».
--   motores    run_automations atiende también tickets (created, closed, con
--              filtro opcional por prioridad); el motor por fecha gana tres
--              disparadores por horas: sin respuesta, sin responsable y
--              vencido. Como ahora hay reglas por horas, el cron pasa de
--              diario a cada hora; renovaciones y cotizaciones siguen siendo
--              idempotentes por automation_runs, así que no se repiten.
--   correo     email_outbox.ticket_id para que las plantillas usen
--              {{ticket.*}} («recibimos tu ticket #123»).
--   fusión     crm.merge_tickets(perdedor, ganador): mueve notas e historial
--              al ganador y cierra el perdedor como duplicado.

alter table crm.tickets
    add column if not exists first_response_due_at timestamp with time zone,
    add column if not exists due_at timestamp with time zone,
    add column if not exists first_response_at timestamp with time zone,
    add column if not exists deal_id bigint references crm.deals (id) on delete set null,
    add column if not exists contract_id bigint references crm.contracts (id) on delete set null;

create index if not exists tickets_due_at_idx
    on crm.tickets (organization_id, due_at) where status <> 'closed';

alter table crm.email_outbox
    add column if not exists ticket_id bigint references crm.tickets (id) on delete set null;

alter table crm.automation_runs
    add column if not exists ticket_id bigint references crm.tickets (id) on delete cascade;

create index if not exists automation_runs_ticket_idx
    on crm.automation_runs (automation_id, ticket_id);

-- Horas objetivo de una prioridad según Ajustes; null si no se configuró.
CREATE OR REPLACE FUNCTION "crm"."ticket_sla_hours"("org" "uuid", "prioridad" "text", "clase" "text") RETURNS integer
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select nullif(c.config -> 'ticketSla' -> prioridad ->> clase, '')::integer
    from crm.configuration c
   where c.organization_id = org;
$$;

-- Antes de escribir: prefijos → categoría, prioridad desde la descripción,
-- SLA, sellos de fechas y cierre.
CREATE OR REPLACE FUNCTION "crm"."handle_ticket_before_write"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  p record;
  horas integer;
begin
  if tg_op = 'INSERT' then
    -- Compatibilidad con el agente de voz y los formularios: el prefijo
    -- «[categoría]» del asunto pasa a la columna, el segundo «[motivo]» a la
    -- descripción si venía vacía, y el asunto queda limpio.
    if new.category is null and new.subject ~ '^\s*\[' then
      select * into p from crm.ticket_subject_prefixes(new.subject);
      new.category := p.categoria;
      if new.description is null and p.motivo is not null then
        new.description := p.motivo;
      end if;
      new.subject := p.limpio;
    end if;
    -- El agente de voz escribe «Prioridad: urgent» en la descripción: si no
    -- vino una prioridad explícita, se toma de ahí.
    if new.priority = 'normal' and new.description ~* 'prioridad:\s*(low|normal|high|urgent)' then
      new.priority := lower((regexp_match(new.description, 'prioridad:\s*(low|normal|high|urgent)', 'i'))[1]);
    end if;
    new.last_activity_at := coalesce(new.last_activity_at, now());
    if new.status = 'closed' then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
  else
    new.updated_at := now();
    if new.status is distinct from old.status
       or new.priority is distinct from old.priority
       or new.category is distinct from old.category
       or new.sales_id is distinct from old.sales_id then
      new.last_activity_at := now();
    end if;
    if new.status = 'closed' and old.status is distinct from 'closed' then
      new.closed_at := now();
    elsif new.status <> 'closed' and old.status = 'closed' then
      -- Reabrir: el cierre anterior deja de valer, el historial lo conserva.
      new.closed_at := null;
      new.resolution := null;
    end if;
  end if;

  -- SLA: se calcula desde la creación, también al cambiar la prioridad
  -- (subir a urgente acorta el plazo, no lo reinicia).
  if tg_op = 'INSERT' or new.priority is distinct from old.priority then
    horas := crm.ticket_sla_hours(new.organization_id, new.priority, 'firstResponseHours');
    new.first_response_due_at := case when horas is null then null
      else coalesce(new.created_at, now()) + (horas || ' hours')::interval end;
    horas := crm.ticket_sla_hours(new.organization_id, new.priority, 'resolutionHours');
    new.due_at := case when horas is null then null
      else coalesce(new.created_at, now()) + (horas || ' hours')::interval end;
  end if;

  return new;
end;
$$;

-- Una nota en el ticket cuenta como actividad; la primera de una persona
-- (sales_id no nulo) es la primera respuesta.
CREATE OR REPLACE FUNCTION "crm"."handle_ticket_note_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update crm.tickets
     set last_activity_at = greatest(last_activity_at, coalesce(new.date, now())),
         updated_at = now(),
         first_response_at = case
           when first_response_at is null and new.sales_id is not null
           then coalesce(new.date, now()) else first_response_at end
   where id = new.ticket_id;
  return new;
end;
$$;

-- Fusionar dos tickets del mismo contacto: el perdedor pasa sus notas e
-- historial al ganador y se cierra como duplicado.
CREATE OR REPLACE FUNCTION "crm"."merge_tickets"("perdedor" bigint, "ganador" bigint, "actor" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  org uuid;
begin
  if perdedor = ganador then
    raise exception 'Un ticket no se puede fusionar consigo mismo';
  end if;
  select t.organization_id into org from crm.tickets t where t.id = ganador;
  if org is null or org is distinct from (select organization_id from crm.tickets where id = perdedor) then
    raise exception 'Los tickets no existen o no son de la misma organización';
  end if;
  if org is distinct from crm.current_organization_id() and crm.current_organization_id() is not null then
    raise exception 'Sin permiso';
  end if;

  update crm.ticket_notes set ticket_id = ganador where ticket_id = perdedor;
  update crm.ticket_events set ticket_id = ganador where ticket_id = perdedor;
  update crm.tickets
     set status = 'closed', resolution = 'duplicate', updated_by = actor,
         description = coalesce(description, '') || E'\n\n' || 'Fusionado en #' || ganador
   where id = perdedor;
  update crm.tickets set last_activity_at = now(), updated_by = actor where id = ganador;
end;
$$;

revoke all on function crm.merge_tickets(bigint, bigint, bigint) from public;
grant execute on function crm.merge_tickets(bigint, bigint, bigint) to authenticated, service_role;

-- La acción de una regla gana el ticket (para el correo con {{ticket.*}}).
drop function if exists crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint, bigint);
create or replace function crm.aplicar_accion_de_automatizacion(
    regla crm.automations,
    contacto bigint,
    oportunidad bigint,
    contrato bigint,
    cotizacion bigint,
    responsable bigint,
    ticket bigint default null
) returns void
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  plantilla bigint;
begin
  if contacto is null then
    return;
  end if;

  if regla.action_type = 'create_task' then
    insert into crm.tasks
      (organization_id, contact_id, text, type, due_date, sales_id)
    values (
      regla.organization_id,
      contacto,
      coalesce(nullif(regla.action_params ->> 'text', ''), regla.name),
      nullif(regla.action_params ->> 'taskType', ''),
      case
        when regla.action_params ->> 'dueInDays' ~ '^[0-9]+$'
        then now() + ((regla.action_params ->> 'dueInDays') || ' days')::interval
        else null
      end,
      responsable
    );

  elsif regla.action_type = 'send_email' then
    plantilla := nullif(regla.action_params ->> 'templateId', '')::bigint;

    if plantilla is not null
       and exists (
         select 1 from crm.email_templates
          where id = plantilla
            and organization_id = regla.organization_id
            and active
       ) then
      insert into crm.email_outbox
        (organization_id, automation_id, template_id, contact_id, deal_id, contract_id, quote_id, ticket_id)
      values (regla.organization_id, regla.id, plantilla, contacto, oportunidad, contrato, cotizacion, ticket);
    end if;
  end if;
end;
$$;

revoke all on function crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint, bigint, bigint) from public;
grant all on function crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint, bigint, bigint) to service_role;

-- Motor de escrituras: contactos, oportunidades y ahora tickets.
create or replace function crm.run_automations() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  org uuid;
  evento text;
  etapa text;
  regla crm.automations;
  contacto bigint;
  responsable bigint;
  oportunidad bigint;
  ticket bigint;
  prioridad text;
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  org := new.organization_id;
  if org is null then
    return null;
  end if;

  -- Cada tabla lee sus propios campos en su rama: plpgsql resuelve todas
  -- las referencias a new.* de una expresión aunque el «and» no llegue a
  -- ellas, y new.stage no existe en un ticket.
  if tg_op = 'INSERT' then
    evento := 'created';
  elsif tg_table_name = 'deals' then
    if new.stage is distinct from old.stage then
      evento := 'stage_changed';
    else
      return null;
    end if;
  elsif tg_table_name = 'tickets' then
    if new.status = 'closed' and old.status is distinct from 'closed' then
      evento := 'closed';
    else
      return null;
    end if;
  else
    return null;
  end if;

  if tg_table_name = 'contacts' then
    contacto := new.id;
  elsif tg_table_name = 'deals' then
    etapa := new.stage;
    contacto := new.contact_ids[1];
    oportunidad := new.id;
  elsif tg_table_name = 'tickets' then
    contacto := new.contact_id;
    oportunidad := new.deal_id;
    ticket := new.id;
    prioridad := new.priority;
  end if;

  for regla in
    select * from crm.automations
     where organization_id = org
       and active
       and trigger_resource = tg_table_name
       and trigger_event = evento
  loop
    begin
      if evento = 'stage_changed'
         and nullif(regla.trigger_params ->> 'stage', '') is not null
         and regla.trigger_params ->> 'stage' is distinct from etapa then
        continue;
      end if;
      -- Un ticket puede filtrar por prioridad («se crea un ticket urgente»).
      if tg_table_name = 'tickets'
         and nullif(regla.trigger_params ->> 'priority', '') is not null
         and regla.trigger_params ->> 'priority' is distinct from prioridad then
        continue;
      end if;

      if regla.action_type = 'assign_owner' then
        responsable := nullif(regla.action_params ->> 'salesId', '')::bigint;
        if responsable is not null then
          if tg_table_name = 'contacts' then
            update crm.contacts set sales_id = responsable where id = new.id;
          elsif tg_table_name = 'tickets' then
            update crm.tickets set sales_id = responsable where id = new.id;
          else
            update crm.deals set sales_id = responsable where id = new.id;
          end if;
        end if;
      else
        perform crm.aplicar_accion_de_automatizacion(
          regla, contacto, oportunidad, null, null, new.sales_id, ticket
        );
      end if;

    exception when others then
      null;
    end;
  end loop;

  return null;
end;
$$;

drop trigger if exists run_automations_tickets on crm.tickets;
create trigger run_automations_tickets
    after insert or update on crm.tickets
    for each row execute function crm.run_automations();

-- Motor por fecha: renovaciones, cotizaciones y ahora tickets por horas.
create or replace function crm.ejecutar_automatizaciones_por_fecha() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  regla crm.automations;
  contrato record;
  cotizacion record;
  ticket record;
  contacto bigint;
  dias integer;
  horas integer;
  disparadas integer := 0;
begin
  -- Renovaciones de contratos (módulo Clientes).
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'contracts'
       and trigger_event = 'renewal_due'
  loop
    dias := case
      when regla.trigger_params ->> 'daysBefore' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'daysBefore')::integer
      else 30
    end;

    for contrato in
      select k.id, k.company_id, k.renews_on, k.sales_id
        from crm.contracts k
       where k.organization_id = regla.organization_id
         and k.status = 'active'
         and k.renews_on is not null
         and k.renews_on >= current_date
         and k.renews_on <= current_date + dias
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.contract_id = k.id
              and r.due_on = k.renews_on
         )
    loop
      begin
        select c.id into contacto
          from crm.contacts c
         where c.company_id = contrato.company_id
           and c.organization_id = regla.organization_id
         order by c.last_seen desc nulls last, c.id
         limit 1;

        insert into crm.automation_runs
          (organization_id, automation_id, contract_id, due_on)
        values (regla.organization_id, regla.id, contrato.id, contrato.renews_on);

        perform crm.aplicar_accion_de_automatizacion(
          regla, contacto, null, contrato.id, null, contrato.sales_id
        );
        disparadas := disparadas + 1;
      exception when others then
        null;
      end;
    end loop;
  end loop;

  -- Cotizaciones enviadas (o vistas) que llevan N días sin respuesta y
  -- siguen vigentes. Una sola vez por regla y cotización: si el cliente no
  -- contesta al recordatorio, la siguiente regla (con más días) es la que
  -- vuelve a avisar, no esta.
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'quotes'
       and trigger_event = 'unanswered'
  loop
    dias := case
      when regla.trigger_params ->> 'daysAfter' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'daysAfter')::integer
      else 3
    end;

    for cotizacion in
      select q.id, q.deal_id, q.company_id, q.contact_id, q.sales_id, q.sent_at
        from crm.quotes q
       where q.organization_id = regla.organization_id
         and q.status in ('sent', 'viewed')
         and q.sent_at is not null
         and q.sent_at <= now() - (dias || ' days')::interval
         and (q.valid_until is null or q.valid_until >= current_date)
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.quote_id = q.id
         )
    loop
      begin
        contacto := cotizacion.contact_id;
        if contacto is null and cotizacion.company_id is not null then
          select c.id into contacto
            from crm.contacts c
           where c.company_id = cotizacion.company_id
             and c.organization_id = regla.organization_id
           order by c.last_seen desc nulls last, c.id
           limit 1;
        end if;

        insert into crm.automation_runs
          (organization_id, automation_id, quote_id, due_on)
        values (regla.organization_id, regla.id, cotizacion.id, current_date);

        perform crm.aplicar_accion_de_automatizacion(
          regla, contacto, cotizacion.deal_id, null, cotizacion.id, cotizacion.sales_id
        );
        disparadas := disparadas + 1;
      exception when others then
        null;
      end;
    end loop;
  end loop;

  -- Tickets abiertos: sin respuesta, sin responsable o vencidos desde hace
  -- N horas. Una sola vez por regla y ticket.
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'tickets'
       and trigger_event in ('unanswered', 'unassigned', 'overdue')
  loop
    horas := case
      when regla.trigger_params ->> 'hoursAfter' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'hoursAfter')::integer
      else 4
    end;

    for ticket in
      select t.id, t.contact_id, t.deal_id, t.sales_id
        from crm.tickets t
       where t.organization_id = regla.organization_id
         and t.status <> 'closed'
         and (
           (regla.trigger_event = 'unanswered' and t.first_response_at is null
              and t.created_at <= now() - (horas || ' hours')::interval)
           or (regla.trigger_event = 'unassigned' and t.sales_id is null
              and t.created_at <= now() - (horas || ' hours')::interval)
           or (regla.trigger_event = 'overdue' and t.due_at is not null
              and t.due_at <= now() - (horas || ' hours')::interval)
         )
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.ticket_id = t.id
         )
    loop
      begin
        insert into crm.automation_runs
          (organization_id, automation_id, ticket_id, due_on)
        values (regla.organization_id, regla.id, ticket.id, current_date);

        if regla.action_type = 'assign_owner' then
          update crm.tickets
             set sales_id = nullif(regla.action_params ->> 'salesId', '')::bigint
           where id = ticket.id
             and nullif(regla.action_params ->> 'salesId', '') is not null;
        else
          perform crm.aplicar_accion_de_automatizacion(
            regla, ticket.contact_id, ticket.deal_id, null, null, ticket.sales_id, ticket.id
          );
        end if;
        disparadas := disparadas + 1;
      exception when others then
        null;
      end;
    end loop;
  end loop;

  return disparadas;
end;
$$;

revoke all on function crm.ejecutar_automatizaciones_por_fecha() from public;
grant all on function crm.ejecutar_automatizaciones_por_fecha() to service_role;

-- De diario a cada hora: las reglas de tickets se miden en horas. Las de
-- renovaciones y cotizaciones no se repiten (automation_runs).
select cron.unschedule('automatizaciones-por-fecha');
select cron.schedule(
  'automatizaciones-por-fecha',
  '5 * * * *',
  $$select crm.ejecutar_automatizaciones_por_fecha();$$
);

-- Datos existentes: SLA según la configuración actual (si la hay) y primera
-- respuesta a partir de la primera nota de una persona.
update crm.tickets t
   set first_response_at = (
     select min(n.date) from crm.ticket_notes n
      where n.ticket_id = t.id and n.sales_id is not null and n.date > t.created_at
   )
 where t.first_response_at is null;
