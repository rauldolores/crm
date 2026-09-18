-- Mover una oportunidad en el tablero con una sola llamada (crm.move_deal)
-- y colocar las nuevas arriba de su etapa desde la base (crm.place_new_deal).
--
-- Hasta ahora el navegador reordenaba a mano: leía la columna entera (con
-- tope de 100) y mandaba un PATCH por cada tarjeta que se desplazaba. En un
-- embudo con cientos de oportunidades eso eran cientos de peticiones por
-- arrastre, sin transacción (si una fallaba, los índices quedaban rotos) y
-- con las tarjetas a partir de la 100 fuera del tablero. Ahora la base hace
-- el desplazamiento en una transacción, y el tablero carga hasta 1.000
-- oportunidades abiertas por embudo.
--
-- Ver supabase/schemas/02_functions.sql y 04_triggers.sql (fuente de verdad).

-- p_index es la posición final de la oportunidad en la etapa de destino
-- (0 = arriba); se acota al tamaño de la columna, así que «al final» es
-- cualquier número grande. Solo cuentan las abiertas: las archivadas no
-- están en el tablero y su índice no significa nada.
create or replace function crm.move_deal(
    p_deal_id bigint,
    p_stage text,
    p_index integer,
    p_loss_reason text default null,
    p_actor bigint default null
) returns void
    language plpgsql security definer
    set search_path = ''
as $$
declare
  d record;
  n integer;
  destino integer;
begin
  select id, organization_id, pipeline, stage into d
    from crm.deals where id = p_deal_id for update;
  if not found then
    raise exception 'Oportunidad % no encontrada', p_deal_id;
  end if;

  -- Renumera de 0 en adelante la etapa de origen sin la tarjeta que se
  -- mueve (y la de destino, si es otra). Cada movimiento deja las columnas
  -- contiguas aunque vinieran con huecos, repetidos o sin índice (altas por
  -- API anteriores a crm.place_new_deal), y el orden que ve el usuario es
  -- exactamente el que se guarda.
  with ordenadas as (
    select id,
           row_number() over (partition by stage order by index nulls last, id) - 1 as pos
    from crm.deals
    where organization_id = d.organization_id and pipeline = d.pipeline
      and stage in (d.stage, p_stage) and archived_at is null and id <> d.id
  )
  update crm.deals dl set index = o.pos
    from ordenadas o
    where dl.id = o.id and dl.index is distinct from o.pos;

  select count(*) into n from crm.deals
    where organization_id = d.organization_id and pipeline = d.pipeline
      and stage = p_stage and archived_at is null and id <> d.id;
  destino := greatest(0, least(coalesce(p_index, n), n));

  -- Hace sitio en la posición de destino…
  update crm.deals set index = index + 1
    where organization_id = d.organization_id and pipeline = d.pipeline
      and stage = p_stage and archived_at is null and id <> d.id
      and index >= destino;

  -- …y coloca la tarjeta.
  update crm.deals
    set stage = p_stage,
        index = destino,
        loss_reason = coalesce(p_loss_reason, loss_reason),
        updated_by = p_actor,
        updated_at = now()
    where id = d.id;
end;
$$;

grant execute on function crm.move_deal(bigint, text, integer, text, bigint) to service_role;

-- Una oportunidad nueva entra arriba de su etapa (índice 0) y desplaza a las
-- demás. Antes lo hacía el navegador con un PATCH por tarjeta, y las creadas
-- por la API o el asistente se quedaban sin índice.
create or replace function crm.place_new_deal() returns trigger
    language plpgsql security definer
    set search_path = ''
as $$
begin
  if new.index is null then
    new.index := 0;
  end if;
  if new.archived_at is null then
    update crm.deals set index = index + 1
      where organization_id = new.organization_id and pipeline = new.pipeline
        and stage = new.stage and archived_at is null
        and index >= new.index;
  end if;
  return new;
end;
$$;

create or replace trigger place_new_deal_trigger
    before insert on crm.deals
    for each row execute function crm.place_new_deal();

-- Reordenar tarjetas no es noticia para un sistema externo: un UPDATE que
-- solo cambia el índice (o la marca de tiempo) no encola webhooks.
CREATE OR REPLACE FUNCTION "crm"."notify_webhooks"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  registro jsonb;
  org uuid;
  evento text;
  suscripcion record;
begin
  -- Cascadas dentro de la misma transacción: si una automatización escribe a
  -- raíz de este mismo cambio, no se vuelve a avisar. No protege del bucle
  -- ENTRE sistemas (esa escritura llega en otra transacción, con profundidad
  -- 1 de nuevo): para eso está el filtro de eventos de más abajo.
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  if tg_op = 'DELETE' then
    registro := to_jsonb(old);
  else
    registro := to_jsonb(new);
  end if;

  org := (registro ->> 'organization_id')::uuid;
  if org is null then
    return null;
  end if;

  -- Un UPDATE que deja la fila idéntica no es noticia. Corta el rebote más
  -- típico: el sistema externo reescribe el mismo valor que ya estaba.
  -- Tampoco lo es reordenar una tarjeta del tablero (solo cambia `index`).
  if tg_op = 'UPDATE'
     and (to_jsonb(old) - 'index' - 'updated_at') = (to_jsonb(new) - 'index' - 'updated_at') then
    return null;
  end if;

  evento := tg_table_name || '.' || case tg_op
    when 'INSERT' then 'created'
    when 'UPDATE' then 'updated'
    else 'deleted'
  end;

  -- Solo se encola. El envío, la firma y los reintentos son cosa de
  -- crm.despachar_webhooks(), que corre programado.
  for suscripcion in
    select id from crm.webhooks
    where organization_id = org
      and active
      and (resources = '{}' or tg_table_name = any(resources))
      and (events = '{}' or evento = any(events))
  loop
    insert into crm.webhook_deliveries
      (organization_id, webhook_id, event, resource, payload)
    values (
      org,
      suscripcion.id,
      evento,
      tg_table_name,
      jsonb_build_object(
        'evento', evento,
        'recurso', tg_table_name,
        'fecha', now(),
        'datos', registro
      )
    );
  end loop;

  return null;
end;
$$;
