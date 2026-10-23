-- Empresas cliente, afiliado o las dos cosas, y afiliados más fiables.
--
-- 1. companies.is_client / is_affiliate. Todas las empresas que ya existen
--    quedan como cliente; las que ya tienen afiliado (o solo tienen
--    oportunidades en el embudo de afiliados) quedan como afiliado.
-- 2. companies_summary expone las dos columnas y customer_summary is_client (al final: create or replace
--    view solo admite columnas nuevas al final; el orden de las demás es el
--    de producción, que no coincide con el del esquema declarativo).
-- 3. Módulo Afiliados:
--    - también reacciona al CREAR una oportunidad en la etapa de afiliación
--      completa, y al cambiarla de embudo con la misma etapa (los embudos
--      comparten valores de etapa);
--    - si la oportunidad no tiene contacto, usa el más reciente de su empresa;
--    - si no hay contacto en ningún lado, rechaza la etapa con un mensaje
--      (antes cambiaba de etapa y el afiliado no se creaba, sin aviso);
--    - marca la empresa como afiliado.
--
-- La función crm.gestionar_modulo_afiliados de producción se comprobó idéntica
-- a la del repo antes de reemplazarla.

alter table crm.companies
    add column if not exists is_client boolean not null default true,
    add column if not exists is_affiliate boolean not null default false;

alter table crm.companies
    add constraint companies_client_or_affiliate check (is_client or is_affiliate);

-- Empresas que ya son de afiliados.
update crm.companies c
   set is_affiliate = true
 where exists (select 1 from crm.affiliates a where a.company_id = c.id);

update crm.companies c
   set is_affiliate = true
  from crm.configuration cfg
 where cfg.organization_id = c.organization_id
   and cfg.config -> 'modules' -> 'affiliates' ->> 'pipelineId' is not null
   and exists (
     select 1 from crm.deals d
      where d.company_id = c.id
        and d.pipeline = cfg.config -> 'modules' -> 'affiliates' ->> 'pipelineId');

-- Si TODAS sus oportunidades son del embudo de afiliados, no es cliente.
update crm.companies c
   set is_client = false
  from crm.configuration cfg
 where cfg.organization_id = c.organization_id
   and c.is_affiliate
   and exists (select 1 from crm.deals d where d.company_id = c.id)
   and not exists (
     select 1 from crm.deals d
      where d.company_id = c.id
        and d.pipeline is distinct from cfg.config -> 'modules' -> 'affiliates' ->> 'pipelineId');

create index if not exists companies_is_affiliate_idx
    on crm.companies (organization_id) where is_affiliate;

create or replace view crm.companies_summary with (security_invoker = on) as
select
    c.id,
    c.created_at,
    c.name,
    c.sector,
    c.size,
    c.linkedin_url,
    c.website,
    c.phone_number,
    c.address,
    c.zipcode,
    c.city,
    c.state_abbr,
    c.sales_id,
    c.context_links,
    c.country,
    c.description,
    c.revenue,
    c.tax_identifier,
    c.logo,
    count(distinct d.id) as nb_deals,
    count(distinct co.id) as nb_contacts,
    c.organization_id,
    c.custom_fields,
    count(distinct tk.id) as nb_tickets,
    count(distinct tk.id) filter (where tk.status <> 'closed') as nb_tickets_open,
    c.tags,
    c.referred_by_affiliate_id,
    c.lifecycle_stage,
    c.is_client,
    c.is_affiliate
from crm.companies c
    left join crm.deals d on c.id = d.company_id
    left join crm.contacts co on c.id = co.company_id
    left join crm.tickets tk on c.id = tk.company_id
group by c.id;

-- customer_summary expone is_client (al final) para que la lista de Clientes
-- muestre solo empresas cliente.
create or replace view crm.customer_summary with (security_invoker = on) as
select
    c.id,
    c.organization_id,
    c.name,
    c.lifecycle_stage,
    c.sales_id,
    coalesce(p.nb_purchases, 0) as nb_purchases,
    coalesce(p.total_spent, 0) as total_spent,
    p.first_purchase_on,
    p.last_purchase_on,
    coalesce(k.nb_active_contracts, 0) as nb_active_contracts,
    coalesce(k.recurring_amount, 0) as recurring_amount,
    k.next_renewal_on,
    coalesce(t.open_tickets, 0) as open_tickets,
    coalesce(t.overdue_tickets, 0) as overdue_tickets,
    (coalesce(t.open_tickets, 0) >= 3 or coalesce(t.overdue_tickets, 0) >= 1) as at_risk,
    coalesce(k.nb_recurring_contracts, 0) as nb_recurring_contracts,
    coalesce(k.nb_one_time_contracts, 0) as nb_one_time_contracts,
    coalesce(k.one_time_amount, 0) as one_time_amount,
    coalesce(g.nb_won_deals, 0) as nb_won_deals,
    coalesce(g.won_amount, 0) as won_amount,
    -- De dónde viene la empresa (kontrolia_auth = se sincroniza sola).
    c.source,
    c.external_id,
    -- La lista de Clientes muestra solo empresas cliente: un afiliado que no
    -- compra nada no es un cliente. Va como columna (y no como `where`)
    -- porque la ficha de la empresa también lee de esta vista.
    c.is_client
from crm.companies c
left join lateral (
    select count(*) as nb_purchases,
           sum(amount) as total_spent,
           min(purchased_on) as first_purchase_on,
           max(purchased_on) as last_purchase_on
      from crm.purchases
     where company_id = c.id and status <> 'cancelled'
) p on true
left join lateral (
    select
        count(*) as nb_active_contracts,
        count(*) filter (where billing_period in ('monthly', 'quarterly', 'yearly'))
            as nb_recurring_contracts,
        count(*) filter (where billing_period is null
                            or billing_period not in ('monthly', 'quarterly', 'yearly'))
            as nb_one_time_contracts,
        sum(amount) filter (where billing_period in ('monthly', 'quarterly', 'yearly'))
            as recurring_amount,
        sum(amount) filter (where billing_period is null
                               or billing_period not in ('monthly', 'quarterly', 'yearly'))
            as one_time_amount,
        min(renews_on) filter (
            where renews_on is not null
              and billing_period in ('monthly', 'quarterly', 'yearly')
        ) as next_renewal_on
      from crm.contracts
     where company_id = c.id and status = 'active'
) k on true
left join lateral (
    select count(*) as nb_won_deals,
           sum(d.amount) as won_amount
      from crm.deals d
     where d.company_id = c.id
       and d.organization_id = c.organization_id
       and d.archived_at is null
       and coalesce(
             (
               select embudo -> 'pipelineStatuses' ? d.stage
                 from crm.configuration cfg
                      cross join lateral jsonb_array_elements(
                        coalesce(cfg.config -> 'dealPipelines', '[]'::jsonb)
                      ) as embudo
                where cfg.organization_id = d.organization_id
                  and embudo ->> 'value' = coalesce(d.pipeline, 'ventas')
                limit 1
             ),
             false
           )
) g on true
left join lateral (
    select count(*) as open_tickets,
           count(*) filter (where due_at < now()) as overdue_tickets
      from crm.tickets
     where company_id = c.id and status <> 'closed'
) t on true;

-- Módulo Afiliados: ¿esta etapa de este embudo es de "afiliación completa"
-- para la organización? Falso si el módulo está apagado o sin configurar.
create or replace function crm.es_etapa_de_afiliacion(org uuid, embudo text, etapa text) returns boolean
    language sql stable security definer
    set search_path = ''
    as $$
  select coalesce((
    select coalesce((c.config -> 'modules' -> 'affiliates' ->> 'active')::boolean, false)
       and c.config -> 'modules' -> 'affiliates' ->> 'pipelineId' = embudo
       and coalesce(c.config -> 'modules' -> 'affiliates' -> 'completionStages', '[]'::jsonb) ? etapa
      from crm.configuration c
     where c.organization_id = org
  ), false)
$$;

revoke all on function crm.es_etapa_de_afiliacion(uuid, text, text) from public, anon, authenticated;
grant all on function crm.es_etapa_de_afiliacion(uuid, text, text) to service_role;

-- Módulo Afiliados: quién se convierte en afiliado al completar una
-- oportunidad. El primer contacto de la oportunidad; si no tiene, el contacto
-- más reciente de su empresa (lo normal es dar de alta la empresa y su
-- contacto y luego la oportunidad, sin acordarse de vincularlo).
create or replace function crm.contacto_para_afiliar(oportunidad crm.deals) returns bigint
    language sql stable security definer
    set search_path = ''
    as $$
  select coalesce(
    oportunidad.contact_ids[1],
    (select co.id
       from crm.contacts co
      where co.company_id = oportunidad.company_id
        and co.organization_id = oportunidad.organization_id
      order by co.last_seen desc nulls last, co.id desc
      limit 1)
  )
$$;

revoke all on function crm.contacto_para_afiliar(crm.deals) from public, anon, authenticated;
grant all on function crm.contacto_para_afiliar(crm.deals) to service_role;

-- Módulo Afiliados: no deja llevar una oportunidad a la etapa de "afiliación
-- completa" si no hay a quién hacer afiliado (ni contacto en la oportunidad
-- ni en su empresa). Antes la etapa cambiaba y el afiliado simplemente no se
-- creaba, sin aviso. El mensaje llega tal cual a la pantalla.
create or replace function crm.exigir_contacto_para_afiliar() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
begin
  -- Los embudos comparten los valores de etapa: pasar de embudo con la
  -- misma etapa también cuenta como llegar a ella.
  if tg_op = 'UPDATE'
     and old.stage is not distinct from new.stage
     and old.pipeline is not distinct from new.pipeline then
    return new;
  end if;

  if crm.es_etapa_de_afiliacion(new.organization_id, new.pipeline, new.stage)
     and crm.contacto_para_afiliar(new) is null then
    raise exception 'Para activar al afiliado, la oportunidad necesita un contacto: vincula uno o dalo de alta en su empresa.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function crm.exigir_contacto_para_afiliar() from public, anon, authenticated;
grant all on function crm.exigir_contacto_para_afiliar() to service_role;

-- Módulo Afiliados: cuando una oportunidad llega (al crearse o al cambiar de
-- etapa) a una de las etapas de "afiliación completa" del embudo configurado,
-- da de alta (o refresca) como afiliado al contacto de crm.contacto_para_afiliar
-- y marca su empresa como afiliado (sin quitarle lo de cliente: puede ser las
-- dos cosas).
--
-- Todo el cuerpo va protegido con manejo de excepciones: si el módulo está
-- apagado para la organización, si falta configurarlo, o si algo falla, esta
-- función no debe impedir jamás que se guarde el cambio de etapa del deal.
-- Así "cada módulo es independiente, se activa o desactiva sin afectar el
-- sistema" es literal, no solo una intención. (Lo único que sí bloquea es
-- crm.exigir_contacto_para_afiliar, a propósito y antes de guardar.)
create or replace function crm.gestionar_modulo_afiliados() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  org uuid;
  cfg jsonb;
  contacto bigint;
  empresa bigint;
  codigo text;
  comision numeric;
begin
  -- Los embudos comparten los valores de etapa: pasar de embudo con la
  -- misma etapa también cuenta como llegar a ella.
  if tg_op = 'UPDATE'
     and old.stage is not distinct from new.stage
     and old.pipeline is not distinct from new.pipeline then
    return null;
  end if;

  org := new.organization_id;
  if org is null then
    return null;
  end if;

  begin
    if not crm.es_etapa_de_afiliacion(org, new.pipeline, new.stage) then
      return null;
    end if;

    contacto := crm.contacto_para_afiliar(new);
    if contacto is null then
      return null;
    end if;

    -- La empresa de la oportunidad; la del contacto solo si la oportunidad
    -- no tuviera (deals.company_id es obligatorio en el formulario).
    empresa := coalesce(
      new.company_id,
      (select company_id from crm.contacts where id = contacto)
    );
    if empresa is null then
      return null;
    end if;

    select config -> 'modules' -> 'affiliates' into cfg
      from crm.configuration
     where organization_id = org;

    codigo := crm.generar_codigo_referido_disponible(org, contacto);
    -- Tasa del programa: la configurada en el módulo, o 15%.
    comision := coalesce((cfg ->> 'defaultCommission')::numeric, 15);

    insert into crm.affiliates (organization_id, contact_id, company_id, deal_id, referral_code, commission_percentage)
    values (org, contacto, empresa, new.id, codigo, comision)
    on conflict (organization_id, contact_id) do update
      set company_id = excluded.company_id,
          deal_id = excluded.deal_id,
          updated_at = now();
      -- Ni referral_code ni commission_percentage se tocan en el conflicto:
      -- si el contacto ya era afiliado conserva su código y la tasa que se
      -- le haya negociado.

    update crm.companies
       set is_affiliate = true
     where id = empresa
       and organization_id = org
       and not is_affiliate;
  exception when others then
    null;
  end;

  return null;
end;
$$;

grant all on function crm.gestionar_modulo_afiliados() to authenticated;
grant all on function crm.gestionar_modulo_afiliados() to service_role;

drop trigger if exists gestionar_modulo_afiliados_deals on crm.deals;
create trigger gestionar_modulo_afiliados_deals
    after insert or update on crm.deals
    for each row execute function crm.gestionar_modulo_afiliados();

drop trigger if exists exigir_contacto_para_afiliar_deals on crm.deals;
create trigger exigir_contacto_para_afiliar_deals
    before insert or update of stage, pipeline on crm.deals
    for each row execute function crm.exigir_contacto_para_afiliar();
