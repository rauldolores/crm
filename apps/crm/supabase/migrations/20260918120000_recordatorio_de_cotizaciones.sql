-- Recordatorio de cotización sin respuesta: «una cotización lleva N días
-- enviada sin que la acepten ni la rechacen → crea una tarea / manda un
-- correo». Mismo motor diario que las renovaciones, misma constancia para
-- no repetir el aviso.
--
-- Aditiva: dos columnas, un índice, y las funciones del motor con un
-- parámetro más (la cotización) para que el correo pueda usar
-- {{cotizacion.*}}.

-- 1. El correo puede salir de una cotización.
alter table crm.email_outbox add column if not exists quote_id bigint;
alter table crm.email_outbox
    add constraint email_outbox_quote_id_fkey
    foreign key (quote_id) references crm.quotes(id) on delete cascade;

-- 2. La constancia también puede ser de una cotización.
alter table crm.automation_runs alter column contract_id drop not null;
alter table crm.automation_runs add column if not exists quote_id bigint;
alter table crm.automation_runs
    add constraint automation_runs_quote_id_fkey
    foreign key (quote_id) references crm.quotes(id) on delete cascade;
-- Índice completo, no parcial: los nulos (constancias de contratos) no
-- chocan entre sí.
create unique index automation_runs_quote_once_uk
    on crm.automation_runs (automation_id, quote_id);

-- 3. La acción común, ahora con la cotización de origen.
create or replace function crm.aplicar_accion_de_automatizacion(
    regla crm.automations,
    contacto bigint,
    oportunidad bigint,
    contrato bigint,
    cotizacion bigint,
    responsable bigint
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
        (organization_id, automation_id, template_id, contact_id, deal_id, contract_id, quote_id)
      values (regla.organization_id, regla.id, plantilla, contacto, oportunidad, contrato, cotizacion);
    end if;
  end if;
end;
$$;

revoke all on function crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint, bigint) from public;
grant all on function crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint, bigint) to service_role;

-- 4. El motor de escrituras pasa «sin cotización».
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
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  org := new.organization_id;
  if org is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    evento := 'created';
  elsif tg_table_name = 'deals' and new.stage is distinct from old.stage then
    evento := 'stage_changed';
  else
    return null;
  end if;

  if tg_table_name = 'deals' then
    etapa := new.stage;
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

      if tg_table_name = 'contacts' then
        contacto := new.id;
      else
        contacto := new.contact_ids[1];
      end if;

      if regla.action_type = 'assign_owner' then
        responsable := nullif(regla.action_params ->> 'salesId', '')::bigint;
        if responsable is not null then
          if tg_table_name = 'contacts' then
            update crm.contacts set sales_id = responsable where id = new.id;
          else
            update crm.deals set sales_id = responsable where id = new.id;
          end if;
        end if;
      else
        perform crm.aplicar_accion_de_automatizacion(
          regla,
          contacto,
          case when tg_table_name = 'deals' then new.id else null end,
          null,
          null,
          new.sales_id
        );
      end if;

    exception when others then
      null;
    end;
  end loop;

  return null;
end;
$$;

-- La firma vieja ya no la llama nadie.
drop function if exists crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint);

-- 5. El motor por fecha: renovaciones y, ahora, cotizaciones sin respuesta.
create or replace function crm.ejecutar_automatizaciones_por_fecha() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  regla crm.automations;
  contrato record;
  cotizacion record;
  contacto bigint;
  dias integer;
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

  return disparadas;
end;
$$;

revoke all on function crm.ejecutar_automatizaciones_por_fecha() from public;
grant all on function crm.ejecutar_automatizaciones_por_fecha() to service_role;
