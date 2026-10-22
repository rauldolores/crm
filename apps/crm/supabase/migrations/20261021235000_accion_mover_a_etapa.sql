-- Acción de automatización «mover a otra etapa».
--
-- Solo para el disparador «una oportunidad lleva N días en la misma etapa»
-- (deals:stalled), que evalúa el motor por fecha. La regla guarda en
-- action_params la etapa de destino ({"stage": "..."}).
--
-- Se ofrece solo ahí y no en los disparadores de evento (al crear o al
-- cambiar de etapa) porque mover desde crm.run_automations es actualizar
-- crm.deals desde su propio disparador: dos reglas que se muevan entre sí
-- serían un bucle. Desde el motor por fecha no hay bucle: la oportunidad
-- recién movida empieza una estancia nueva y no cumple «N días» hasta pasado
-- ese tiempo.
--
-- El cambio de etapa dispara crm.run_automations, así que las reglas de la
-- etapa nueva actúan solas: la cadencia de prospección se encadena.
--
-- En cada pasada, las reglas que mueven van al final: emparejadas con otra
-- sobre la misma etapa y días («… → enviar correo» y «… → mover»), la de
-- mover no puede adelantarse y dejar sin correo a la oportunidad.
--
-- La función se reemplaza entera. Antes de escribir esta migración se
-- comprobó que la de producción coincidía con la del repo (la que dejó
-- 20261021230000_disparador_dias_en_etapa).

create or replace function crm.ejecutar_automatizaciones_por_fecha() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  regla crm.automations;
  contrato record;
  cotizacion record;
  ticket record;
  oportunidad record;
  contacto bigint;
  dias integer;
  horas integer;
  movidas integer;
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

  -- Oportunidades que llevan N días en la misma etapa sin moverse.
  --
  -- La entrada en la etapa sale del historial (deal_events): el último
  -- «created» o «stage» que la dejó donde está. Una oportunidad anterior al
  -- historial cae en su created_at.
  --
  -- Se filtra por embudo además de por etapa porque los embudos comparten
  -- los nombres internos de etapa (opportunity, won, lost…): sin el embudo,
  -- «7 días en Oportunidad» saltaría en todos a la vez. Una regla sin embudo
  -- (guardada a mano) mira todos.
  --
  -- Una vez por estancia: due_on es el día en que entró. Si sale de la etapa
  -- y vuelve, hay estancia nueva y la regla vuelve a contar.
  --
  -- Las reglas que MUEVEN van al final de la pasada. Lo natural es emparejar
  -- dos reglas sobre la misma etapa y días («3 días en WhatsApp → enviar
  -- correo» y «… → mover a Correo»): si la de mover corriera antes, la
  -- oportunidad ya no estaría en WhatsApp y el correo no saldría.
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'deals'
       and trigger_event = 'stalled'
       and nullif(trigger_params ->> 'stage', '') is not null
     order by (action_type = 'move_stage'), id
  loop
    dias := case
      when regla.trigger_params ->> 'daysInStage' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'daysInStage')::integer
      else 3
    end;

    for oportunidad in
      select d.id, d.contact_ids[1] as contacto, d.sales_id, entrada.desde
        from crm.deals d
        cross join lateral (
          select coalesce(
            (select max(ev.created_at)
               from crm.deal_events ev
              where ev.deal_id = d.id
                and ev.field in ('created', 'stage')
                and ev.new_value = d.stage),
            d.created_at
          ) as desde
        ) entrada
       where d.organization_id = regla.organization_id
         and d.archived_at is null
         and d.stage = regla.trigger_params ->> 'stage'
         and (
           nullif(regla.trigger_params ->> 'pipeline', '') is null
           or d.pipeline = regla.trigger_params ->> 'pipeline'
         )
         and entrada.desde <= now() - (dias || ' days')::interval
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.deal_id = d.id
              and r.due_on = entrada.desde::date
         )
    loop
      begin
        insert into crm.automation_runs
          (organization_id, automation_id, deal_id, due_on)
        values (regla.organization_id, regla.id, oportunidad.id, oportunidad.desde::date);

        if regla.action_type = 'assign_owner' then
          update crm.deals
             set sales_id = nullif(regla.action_params ->> 'salesId', '')::bigint
           where id = oportunidad.id
             and nullif(regla.action_params ->> 'salesId', '') is not null;
        elsif regla.action_type = 'move_stage' then
          -- Solo a una etapa que exista en el embudo de la oportunidad: en una
          -- que no, desaparecería del tablero. El cambio de etapa dispara
          -- crm.run_automations, así que las reglas de la etapa nueva («al
          -- llegar a Correo → tarea de llamar») actúan solas: la cadencia se
          -- encadena. Si el destino no vale no se mueve nada, y el raise
          -- deshace también la ejecución registrada: se reintenta en la
          -- próxima pasada, por si se corrige el embudo.
          update crm.deals d
             set stage = regla.action_params ->> 'stage'
           where d.id = oportunidad.id
             and nullif(regla.action_params ->> 'stage', '') is not null
             and d.stage is distinct from regla.action_params ->> 'stage'
             and exists (
               select 1
                 from crm.configuration c
                cross join lateral jsonb_array_elements(
                  coalesce(
                    (select p -> 'stages'
                       from jsonb_array_elements(c.config -> 'dealPipelines') p
                      where p ->> 'value' = d.pipeline
                      limit 1),
                    -- Configuración anterior a los embudos múltiples: un solo
                    -- embudo, con sus etapas en dealStages.
                    case
                      when coalesce(jsonb_array_length(c.config -> 'dealPipelines'), 0) = 0
                      then c.config -> 'dealStages'
                    end,
                    '[]'::jsonb
                  )
                ) etapa
                where c.organization_id = regla.organization_id
                  and etapa ->> 'value' = regla.action_params ->> 'stage'
             );
          get diagnostics movidas = row_count;
          if movidas = 0 then
            raise exception 'etapa de destino no válida';
          end if;
        else
          perform crm.aplicar_accion_de_automatizacion(
            regla, oportunidad.contacto, oportunidad.id, null, null, oportunidad.sales_id
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
