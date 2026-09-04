-- Módulo Afiliados: atribución de clientes referidos y cálculo de comisión.
--
-- La atribución se marca en la EMPRESA, no en cada oportunidad, porque la
-- comisión es sobre los pagos de los clientes referenciados: todo lo que ese
-- cliente compre después cuenta, sin repetir el código de referido cada vez.

alter table crm.companies
    add column if not exists referred_by_affiliate_id bigint;

create index if not exists companies_referred_by_affiliate_id_idx
    on crm.companies (referred_by_affiliate_id);

alter table crm.companies
    add constraint companies_referred_by_affiliate_id_fkey
    foreign key (referred_by_affiliate_id) references crm.affiliates(id) on delete set null;

-- Primer toque: una vez atribuido un cliente, no se reasigna a otro afiliado.
-- Sí se permite poner NULL explícitamente, que es la vía para corregir una
-- atribución equivocada.
create or replace function crm.conservar_afiliado_de_referencia() returns trigger
    language plpgsql
    set search_path = ''
    as $$
begin
  if old.referred_by_affiliate_id is not null
     and new.referred_by_affiliate_id is not null
     and new.referred_by_affiliate_id is distinct from old.referred_by_affiliate_id
  then
    new.referred_by_affiliate_id := old.referred_by_affiliate_id;
  end if;
  return new;
end;
$$;

grant all on function crm.conservar_afiliado_de_referencia() to authenticated;
grant all on function crm.conservar_afiliado_de_referencia() to service_role;

create or replace trigger conservar_afiliado_de_referencia_companies
    before update on crm.companies
    for each row execute function crm.conservar_afiliado_de_referencia();

-- Negocio referido y comisión devengada por afiliado. "Ganada" se resuelve
-- contra la configuración de cada organización (dealPipelines[].pipelineStatuses),
-- igual que hace la pantalla de Informes: una etapa "won" en un embudo puede
-- no significar nada en otro.
create or replace view crm.affiliate_commissions with (security_invoker = on) as
select
    a.id as id,
    a.organization_id,
    a.contact_id,
    a.company_id,
    a.referral_code,
    a.commission_percentage,
    a.active,
    count(distinct c.id) as nb_referred_companies,
    count(distinct d.id) filter (where d.es_ganada) as nb_won_deals,
    coalesce(sum(d.amount) filter (where d.es_ganada), 0) as won_amount,
    round(
        coalesce(sum(d.amount) filter (where d.es_ganada), 0)
        * coalesce(a.commission_percentage, 0) / 100.0
    ) as commission_amount
from crm.affiliates a
    left join crm.companies c
        on c.referred_by_affiliate_id = a.id
       and c.organization_id = a.organization_id
    left join lateral (
        select
            deals.id,
            deals.amount,
            coalesce(
                (
                    select embudo -> 'pipelineStatuses' ? deals.stage
                    from crm.configuration cfg
                        cross join lateral jsonb_array_elements(
                            coalesce(cfg.config -> 'dealPipelines', '[]'::jsonb)
                        ) as embudo
                    where cfg.organization_id = deals.organization_id
                      and embudo ->> 'value' = coalesce(deals.pipeline, 'ventas')
                    limit 1
                ),
                false
            ) as es_ganada
        from crm.deals
        where deals.company_id = c.id
          and deals.organization_id = a.organization_id
          and deals.archived_at is null
    ) d on true
group by a.id;

grant select on table crm.affiliate_commissions to anon, authenticated, service_role;
