-- Segundo paso sobre el motor de automatizaciones (el primero es
-- 20261022191522). En produccion hubo ademas un 20261022201120 intermedio,
-- con el mismo disparador pero leyendo new.sales_id, que este corrige: va
-- plegado aqui en vez de repetirse como archivo aparte.
--
-- Disparador «se envió un correo», para que una etapa se mueva COMO
-- CONSECUENCIA de la acción y no antes de ella.
--
-- El problema que arregla: `send_email` no envía, encola. Escribe en
-- crm.email_outbox y el despachador manda después. Así que una regla que
-- mandaba correo y otra que movía la tarjeta, aunque fueran hermanas del
-- mismo disparador, podían dejar la oportunidad en «Correo» con el envío
-- fallando media hora más tarde: la etapa afirmaba algo que no había pasado.
--
-- Ahora la cadena va al derecho: algo encola (una automatización, un envío
-- masivo o el botón de la ficha, da igual cuál), el despachador manda de
-- verdad y pone sent_at, y ENTONCES la regla mueve. Si el envío falla,
-- last_error se llena y la tarjeta se queda donde está.
--
-- Se puede acotar a una plantilla (trigger_params.templateId).
--
-- El responsable va en variable: crm.email_outbox NO tiene sales_id, y
-- plpgsql solo falla al evaluar esa referencia, así que leerla directamente
-- dejaba el error escondido tras el `exception when others`.

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
  -- Responsable de la fila que disparó la regla. En variable y no leyendo
  -- new.sales_id donde haga falta: la cola de correo NO tiene esa columna, y
  -- plpgsql solo falla al evaluarla, así que el error aparecería tarde y lo
  -- escondería el `exception when others` de abajo.
  sales_de_la_fila bigint;
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
  --
  -- El correo va primero porque su evento es un UPDATE, no un alta: la fila
  -- de la cola nace sin enviar y lo que interesa es el momento en que sale
  -- de verdad.
  if tg_table_name = 'email_outbox' then
    if new.sent_at is not null and old.sent_at is null then
      evento := 'sent';
    else
      return null;
    end if;
  elsif tg_op = 'INSERT' then
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
    sales_de_la_fila := new.sales_id;
    -- Un contacto recién creado no tiene texto que juzgar: su nota llega
    -- después, en otra transacción. Por eso la interfaz no ofrece condición
    -- para este disparador, y aquí queda null.
    texto_a_juzgar := null;
  elsif tg_table_name = 'deals' then
    etapa := new.stage;
    contacto := new.contact_ids[1];
    oportunidad := new.id;
    sales_de_la_fila := new.sales_id;
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
    sales_de_la_fila := new.sales_id;
    texto_a_juzgar := concat_ws(E'\n\n', new.subject, new.description);
  elsif tg_table_name = 'email_outbox' then
    -- El correo ya salió: la fila dice a quién y por qué oportunidad. No hay
    -- texto que juzgar (el cuerpo lo pone la plantilla, no una persona), así
    -- que estas reglas no admiten condición.
    contacto := new.contact_id;
    oportunidad := new.deal_id;
    -- La cola no tiene responsable: lo pone el comercial del contacto, que es
    -- quien aparecera en la tarea o en el correo que encadene esta regla.
    select c.sales_id into sales_de_la_fila
      from crm.contacts c where c.id = new.contact_id;
    texto_a_juzgar := null;
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
      -- Un correo enviado puede acotarse a una plantilla: «cuando salga el
      -- primer contacto», no «cuando salga cualquier correo».
      if tg_table_name = 'email_outbox'
         and nullif(regla.trigger_params ->> 'templateId', '') is not null
         and regla.trigger_params ->> 'templateId'
             is distinct from new.template_id::text then
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
             sales_de_la_fila, texto_a_juzgar);
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
        -- Sobre `oportunidad` y no sobre new.id: con el disparador de correo
        -- enviado, la fila que dispara es la de la cola y la oportunidad que
        -- hay que mover es la suya. Para una oportunidad las dos coinciden.
        -- El `is distinct from` va en el where para no escribir un cambio que
        -- no cambia nada (y no ensuciar el historial con un evento vacío).
        if etapa_destino is not null and oportunidad is not null then
          update crm.deals
             set stage = etapa_destino
           where id = oportunidad
             and stage is distinct from etapa_destino;
        end if;

      else
        perform crm.aplicar_accion_de_automatizacion(
          regla, contacto, oportunidad, null, null, sales_de_la_fila, ticket
        );
      end if;

    exception when others then
      null;
    end;
  end loop;

  return null;
end;
$$;

-- Solo UPDATE: la fila de la cola nace sin enviar.
drop trigger if exists run_automations_email_outbox on crm.email_outbox;
create trigger run_automations_email_outbox
    after update on crm.email_outbox
    for each row execute function crm.run_automations();
