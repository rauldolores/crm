-- Mover una oportunidad (crm.move_deal) y dar de alta una nueva
-- (crm.place_new_deal) escriben solo esa fila.
--
-- Antes, cada movimiento renumeraba de 0 en adelante las dos etapas
-- implicadas, y cada alta desplazaba la etapa entera. Con 6.700 tarjetas en
-- «Por contactar», sacar una (desde el tablero o con un resultado de «Mi
-- día») reescribía 6.701 filas en ~1 s, y cada alta 6.700 en ~2,8 s,
-- disparando por cada fila los disparadores de las oportunidades
-- (historial, automatizaciones, webhooks). Medido en producción dentro de
-- una transacción deshecha: ahora es 1 fila en 20-60 ms y 0 filas
-- desplazadas por alta.
--
-- El índice nuevo se elige entre los de las vecinas; puede ser negativo
-- (arriba de todo es «uno menos que la primera»). Solo cuando no queda
-- hueco entre dos tarjetas se renumera la etapa de destino
-- (crm.renumerar_etapa), igual que antes.
--
-- De paso, move_deal deja de poder ejecutarse como anon/authenticated: no
-- comprueba tenencia y solo la llaman el servidor y los trabajos de la base.
--
-- Ver supabase/schemas/02_functions.sql (fuente de verdad).

-- Renumera de 0 en adelante las abiertas de una etapa dejando libre la
-- posición p_hueco, sin contar la oportunidad p_excluir. Solo escribe las
-- filas cuyo índice cambia. Es el último recurso de crm.move_deal y
-- crm.place_new_deal: cuando no queda hueco entre dos tarjetas, cuando hay
-- repetidos o índices nulos (altas por API anteriores a crm.place_new_deal)
-- o cuando el índice se saldría del rango de smallint.
create or replace function crm.renumerar_etapa(
    p_organization_id uuid,
    p_pipeline text,
    p_stage text,
    p_hueco integer,
    p_excluir bigint default null
) returns void
    language plpgsql security definer
    set search_path = ''
as $$
begin
  with ordenadas as (
    select id,
           row_number() over (order by index nulls last, id) - 1 as pos
    from crm.deals
    where organization_id = p_organization_id and pipeline = p_pipeline
      and stage = p_stage and archived_at is null
      and id is distinct from p_excluir
  ), nuevas as (
    select id, case when pos < p_hueco then pos else pos + 1 end as pos
    from ordenadas
  )
  update crm.deals dl set index = nv.pos
    from nuevas nv
    where dl.id = nv.id and dl.index is distinct from nv.pos;
end;
$$;

revoke all on function crm.renumerar_etapa(uuid, text, text, integer, bigint)
  from public, anon, authenticated;

-- Mover una oportunidad en el tablero en una sola transacción (la llama
-- /api/oportunidades/mover con la clave de servicio; ver la migración
-- 20260918210000).
-- p_index es la posición final de la oportunidad en la etapa de destino
-- (0 = arriba); se acota al tamaño de la columna, así que «al final» es
-- cualquier número grande. Solo cuentan las abiertas: las archivadas no
-- están en el tablero y su índice no significa nada.
--
-- Solo se escribe la tarjeta que se mueve: el índice nuevo se elige entre
-- los de sus vecinas (uno menos que la primera, uno más que la última, o el
-- punto medio entre dos). Los huecos que deja en su etapa de origen no
-- importan, porque el tablero ordena por índice. Antes se renumeraban las
-- dos columnas enteras en cada movimiento: con 6.700 tarjetas en una etapa,
-- cada arrastre o resultado de «Mi día» reescribía miles de filas y
-- disparaba por cada una los disparadores de las oportunidades.
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
  hay_nulos boolean;
  anterior integer;
  siguiente integer;
  nuevo integer;
begin
  select id, organization_id, pipeline, stage into d
    from crm.deals where id = p_deal_id for update;
  if not found then
    raise exception 'Oportunidad % no encontrada', p_deal_id;
  end if;

  -- Dos movimientos a la vez en el mismo embudo elegirían el mismo índice.
  perform pg_advisory_xact_lock(
    hashtextextended(d.organization_id::text || ':' || d.pipeline, 0));

  select count(*), coalesce(bool_or(index is null), false)
    into n, hay_nulos
    from crm.deals
    where organization_id = d.organization_id and pipeline = d.pipeline
      and stage = p_stage and archived_at is null and id <> d.id;
  destino := greatest(0, least(coalesce(p_index, n), n));

  -- Las vecinas que quedarán arriba y abajo de la tarjeta.
  if destino > 0 then
    select index into anterior from crm.deals
      where organization_id = d.organization_id and pipeline = d.pipeline
        and stage = p_stage and archived_at is null and id <> d.id
      order by index nulls last, id
      offset destino - 1 limit 1;
  end if;
  if destino < n then
    select index into siguiente from crm.deals
      where organization_id = d.organization_id and pipeline = d.pipeline
        and stage = p_stage and archived_at is null and id <> d.id
      order by index nulls last, id
      offset destino limit 1;
  end if;

  if n = 0 then
    nuevo := 0;
  elsif not hay_nulos and destino = 0 and siguiente > -32768 then
    nuevo := siguiente - 1;
  elsif not hay_nulos and destino = n and anterior < 32767 then
    nuevo := anterior + 1;
  elsif not hay_nulos and siguiente - anterior >= 2 then
    nuevo := anterior + (siguiente - anterior) / 2;
  else
    perform crm.renumerar_etapa(
      d.organization_id, d.pipeline, p_stage, destino, d.id);
    nuevo := destino;
  end if;

  update crm.deals
    set stage = p_stage,
        index = nuevo,
        loss_reason = coalesce(p_loss_reason, loss_reason),
        updated_by = p_actor,
        updated_at = now()
    where id = d.id;
end;
$$;

-- Solo la llaman el servidor (clave de servicio) y los trabajos de la base:
-- no comprueba tenencia, así que no puede quedar abierta a anon/authenticated.
revoke all on function crm.move_deal(bigint, text, integer, text, bigint)
  from public, anon, authenticated;
grant execute on function crm.move_deal(bigint, text, integer, text, bigint) to service_role;

-- Una oportunidad nueva entra arriba de su etapa. Sin índice o con índice 0
-- (lo que manda el formulario) toma uno menos que la primera, sin tocar las
-- demás; antes se desplazaba la etapa entera en cada alta. Con otro índice
-- explícito se le hace sitio desplazando las que van detrás.
create or replace function crm.place_new_deal() returns trigger
    language plpgsql security definer
    set search_path = ''
as $$
declare
  primero integer;
begin
  if new.archived_at is not null then
    new.index := coalesce(new.index, 0);
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.organization_id::text || ':' || new.pipeline, 0));

  if coalesce(new.index, 0) = 0 then
    select min(index) into primero from crm.deals
      where organization_id = new.organization_id and pipeline = new.pipeline
        and stage = new.stage and archived_at is null;
    if primero is null then
      new.index := 0;
    elsif primero > -32768 then
      new.index := primero - 1;
    else
      perform crm.renumerar_etapa(
        new.organization_id, new.pipeline, new.stage, 0);
      new.index := 0;
    end if;
  else
    update crm.deals set index = index + 1
      where organization_id = new.organization_id and pipeline = new.pipeline
        and stage = new.stage and archived_at is null
        and index >= new.index;
  end if;
  return new;
end;
$$;
