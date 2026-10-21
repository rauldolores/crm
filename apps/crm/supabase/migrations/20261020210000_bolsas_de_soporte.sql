-- Bolsas de horas de soporte y el resumen del mes por cliente.
--
-- KontrolIA Auth vende las bolsas como extras de cada app
-- (10-horas-de-soporte-basico, 15-horas-de-soporte-premium) y el extra llega
-- solo al contrato del CRM
-- (crm.contracts.addons). Este catálogo dice qué trae cada extra: minutos al
-- mes y precio de la hora de más. Reglas del dueño (2026-10-20):
--
--   * Básico: 10 h al mes ($3,000/mes). Premium: 15 h ($4,200/mes).
--   * Hora de más: $400 en las dos, autorizada por el cliente ANTES.
--   * Las horas no se acumulan: cada mes empieza de cero.
--   * El mes es el de fecha_atencion, en hora de México.
--
-- New tables:
--   crm.soporte_bolsas   catálogo: slug del extra de Auth → minutos y precio.
--                        Global (sin organization_id): los slugs son los de
--                        KontrolIA Auth, los mismos para todas.
-- New functions:
--   crm.soporte_resumen(company, mes)   bolsa, usados, de más y los que no
--                        consumen de una empresa en un mes. Una sola fuente
--                        para la pantalla, el servicio al cliente y la factura.
--   crm.exigir_autorizacion_de_hora_extra()   disparador: un registro que
--                        pasa de la bolsa necesita quién la autorizó.
-- Security (RLS + policies):
--   soporte_bolsas: lectura para authenticated, escritura solo service_role.
--   soporte_resumen es security invoker: con sesión, RLS acota a la
--   organización; con la clave de servicio, quien llama comprueba la empresa
--   (ver /api/tickets/tiempos/resumen).
-- Activities and Permissions:
--   Sin permisos nuevos.

-- ── Catálogo ─────────────────────────────────────────────────────────────
create table if not exists crm.soporte_bolsas (
    -- slug del extra en KontrolIA Auth.
    slug text primary key
        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    nombre text not null check (length(btrim(nombre)) between 1 and 100),
    minutos_al_mes integer not null check (minutos_al_mes > 0),
    precio_hora_de_mas_centavos integer not null
        check (precio_hora_de_mas_centavos >= 0),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

insert into crm.soporte_bolsas (slug, nombre, minutos_al_mes, precio_hora_de_mas_centavos)
values
    -- El slug es el del extra en KontrolIA Auth (no se puede cambiar allá).
    ('10-horas-de-soporte-basico', 'Soporte Básico', 600, 40000),
    -- Todavía no existe en Auth: al crearlo, usar exactamente este slug.
    ('15-horas-de-soporte-premium', 'Soporte Premium', 900, 40000)
on conflict (slug) do nothing;

alter table crm.soporte_bolsas enable row level security;
drop policy if exists "Support plans are readable" on crm.soporte_bolsas;
create policy "Support plans are readable" on crm.soporte_bolsas
    for select to authenticated using (true);

revoke all on table crm.soporte_bolsas from anon;
revoke all on table crm.soporte_bolsas from authenticated;
grant select on table crm.soporte_bolsas to authenticated;
grant select, insert, update, delete on table crm.soporte_bolsas to service_role;

-- ── Resumen del mes ──────────────────────────────────────────────────────
-- `mes` es cualquier día del mes. La bolsa sale de los extras vigentes ese
-- mes en los contratos de la empresa (mismo criterio que la facturación:
-- fechas del extra y fin del contrato). Si tiene dos bolsas (dos apps), se
-- suman.
create or replace function crm.soporte_resumen(p_company_id bigint, p_mes date)
    returns table (
        mes date,
        bolsas text[],
        minutos_incluidos integer,
        minutos_usados integer,
        minutos_de_mas integer,
        minutos_no_consumen integer,
        precio_hora_de_mas_centavos integer,
        registros integer
    )
    language sql stable
    security invoker
    set search_path = ''
as $$
  with periodo as (
    select date_trunc('month', p_mes)::date as inicio,
           (date_trunc('month', p_mes) + interval '1 month - 1 day')::date as fin
  ),
  bolsa as (
    select array_agg(b.slug order by b.slug) as slugs,
           sum(b.minutos_al_mes)::integer as minutos,
           max(b.precio_hora_de_mas_centavos)::integer as precio
      from crm.contracts c
      cross join periodo p
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(c.addons) = 'array' then c.addons else '[]'::jsonb end
      ) as extra
      join crm.soporte_bolsas b on b.slug = extra ->> 'slug'
     where c.company_id = p_company_id
       and (c.started_on is null or c.started_on <= p.fin)
       and (c.ended_on is null or c.ended_on >= p.inicio)
       and (left(extra ->> 'starts_at', 10) is null or left(extra ->> 'starts_at', 10) <= p.fin::text)
       and (left(extra ->> 'ends_at', 10) is null or left(extra ->> 'ends_at', 10) > p.inicio::text)
  ),
  uso as (
    select coalesce(sum(t.minutos) filter (where t.consume), 0)::integer as usados,
           coalesce(sum(t.minutos) filter (where not t.consume), 0)::integer as no_consumen,
           count(*)::integer as registros
      from crm.soporte_tiempos t, periodo p
     where t.company_id = p_company_id
       and t.fecha_atencion between p.inicio and p.fin
  )
  select p.inicio,
         coalesce(bolsa.slugs, '{}'),
         coalesce(bolsa.minutos, 0),
         uso.usados,
         greatest(uso.usados - coalesce(bolsa.minutos, 0), 0),
         uso.no_consumen,
         bolsa.precio,
         uso.registros
    from periodo p, bolsa, uso;
$$;

revoke all on function crm.soporte_resumen(bigint, date) from public;
grant execute on function crm.soporte_resumen(bigint, date) to authenticated, service_role;

-- ── La hora de más se autoriza antes ─────────────────────────────────────
-- Si la empresa tiene bolsa ese mes y este registro la rebasa, hace falta
-- quién del cliente lo autorizó. Sin bolsa no se exige nada: todavía no se
-- ha decidido cómo se cobra el soporte a quien no la tiene. Corre después
-- de crm.preparar_soporte_tiempo (orden alfabético de los disparadores),
-- con la empresa ya copiada del ticket.
create or replace function crm.exigir_autorizacion_de_hora_extra() returns trigger
    language plpgsql
    set search_path = ''
    as $$
declare
  resumen record;
begin
  if new.corrige_a is not null or not new.consume or new.minutos <= 0
     or new.autorizado_por is not null then
    return new;
  end if;
  select * into resumen from crm.soporte_resumen(new.company_id, new.fecha_atencion);
  if resumen.minutos_incluidos > 0
     and resumen.minutos_usados + new.minutos > resumen.minutos_incluidos then
    raise exception 'Este tiempo pasa de la bolsa del cliente (quedan % min este mes): indica quién del cliente autorizó la hora de más.',
      greatest(resumen.minutos_incluidos - resumen.minutos_usados, 0);
  end if;
  return new;
end;
$$;

drop trigger if exists soporte_tiempos_autorizacion_trigger on crm.soporte_tiempos;
create trigger soporte_tiempos_autorizacion_trigger
    before insert on crm.soporte_tiempos
    for each row execute function crm.exigir_autorizacion_de_hora_extra();
