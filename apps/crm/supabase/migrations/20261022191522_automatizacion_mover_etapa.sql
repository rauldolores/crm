-- Dos añadidos al motor de escrituras de automatizaciones:
--
-- 1. La acción `move_stage` —la misma que el motor por fechas ya tenía para
--    deals:stalled— ahora también funciona sobre deals:created y
--    deals:stage_changed. Vive junto a assign_owner porque, como ella, toca
--    la fila que disparó la regla. Las reglas que mueven se ordenan al
--    final, para que una que mande correo sobre el mismo disparador actúe
--    antes de que la tarjeta cambie de sitio.
--
--    El cambio NO vuelve a disparar las reglas de «cambió de etapa»: lo
--    corta el guardia pg_trigger_depth, para que dos reglas no se muevan la
--    una a la otra sin fin. Por eso mover y mandar correo deben ser reglas
--    hermanas del mismo disparador, no encadenadas.
--
-- 2. Filtro `trigger_params.contacto` = movil | sin_movil: acota la regla
--    según el teléfono del contacto de la oportunidad. Es un hecho leído del
--    teléfono, no un juicio del modelo. Separa a quien se puede intentar por
--    WhatsApp de quien solo tiene fijo y debe pasar directo al correo.

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
  texto_a_juzgar text;
  tiene_movil boolean;
  etapa_destino text;
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
    -- Un contacto recién creado no tiene texto que juzgar: su nota llega
    -- después, en otra transacción. Por eso la interfaz no ofrece condición
    -- para este disparador, y aquí queda null.
    texto_a_juzgar := null;
  elsif tg_table_name = 'deals' then
    etapa := new.stage;
    contacto := new.contact_ids[1];
    oportunidad := new.id;
    texto_a_juzgar := concat_ws(E'\n\n', new.name, new.description);
    -- Si el contacto de la oportunidad tiene un teléfono marcado como móvil.
    -- Es un hecho, no un juicio: no pasa por el modelo. Sirve para separar a
    -- quien se puede intentar por WhatsApp de quien solo tiene fijo, que debe
    -- saltar directo al correo.
    tiene_movil := contacto is not null and exists (
      select 1
        from crm.contacts c,
             jsonb_array_elements(coalesce(c.phone_jsonb, '[]'::jsonb)) as e(v)
       where c.id = contacto
         and e.v ->> 'type' = 'Mobile'
    );
  elsif tg_table_name = 'tickets' then
    contacto := new.contact_id;
    oportunidad := new.deal_id;
    ticket := new.id;
    prioridad := new.priority;
    texto_a_juzgar := concat_ws(E'\n\n', new.subject, new.description);
  end if;

  for regla in
    select * from crm.automations
     where organization_id = org
       and active
       and trigger_resource = tg_table_name
       and trigger_event = evento
     -- Las que mueven de etapa van al final, igual que en el motor por
     -- fechas: así una regla que manda correo sobre el mismo disparador
     -- alcanza a actuar antes de que la tarjeta cambie de sitio.
     order by (action_type = 'move_stage'), id
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
      -- Una oportunidad puede filtrar por si su contacto tiene móvil.
      if tg_table_name = 'deals'
         and nullif(regla.trigger_params ->> 'contacto', '') is not null
         and regla.trigger_params ->> 'contacto'
             is distinct from (case when tiene_movil then 'movil' else 'sin_movil' end) then
        continue;
      end if;

      -- Con condición no se actúa aquí: se encola para que la aplicación le
      -- pregunte al modelo. Sin texto que juzgar la regla no se cumple nunca,
      -- así que no se encola nada (mejor que encolar para responder «no»).
      if nullif(regla.condition_text, '') is not null then
        if nullif(texto_a_juzgar, '') is not null then
          insert into crm.automation_pending
            (organization_id, automation_id, contact_id, deal_id, ticket_id,
             sales_id, texto)
          values
            (org, regla.id, contacto, oportunidad, ticket,
             new.sales_id, texto_a_juzgar);
        end if;
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

      -- Mover de etapa: como assign_owner, toca la fila que disparó la regla,
      -- por eso vive aquí y no en aplicar_accion_de_automatizacion.
      --
      -- Mismo nombre de acción que en el motor por fechas (deals:stalled),
      -- que ya la tenía: es UNA acción que vale en los dos motores, no dos.
      --
      -- El cambio NO vuelve a disparar las reglas de «cambió de etapa»: el
      -- guardia pg_trigger_depth() de arriba corta la reentrada. Es
      -- deliberado (evita bucles entre dos reglas que se muevan la una a la
      -- otra), así que una regla que mueva y otra que mande correo deben ser
      -- hermanas del mismo disparador, no encadenadas.
      elsif regla.action_type = 'move_stage' then
        etapa_destino := nullif(regla.action_params ->> 'stage', '');
        if tg_table_name = 'deals'
           and etapa_destino is not null
           and etapa_destino is distinct from new.stage then
          update crm.deals set stage = etapa_destino where id = new.id;
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
