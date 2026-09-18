-- Fusionar dos empresas (crm.merge_companies): contactos, oportunidades,
-- tickets, cotizaciones, contratos, compras y facturas de la perdedora pasan
-- a la ganadora; los datos de ficha se combinan (la ganadora manda, la
-- perdedora rellena lo que falte) y la perdedora se elimina. Igual que
-- crm.merge_contacts, pensada para los duplicados que se acumulan con los
-- años (la misma empresa dada de alta dos veces con nombres distintos).
--
-- La llama /api/empresas/fusionar con la clave de servicio, que comprueba
-- que ambas sean de la organización de la sesión. Ver
-- supabase/schemas/02_functions.sql (fuente de verdad).

create or replace function crm.merge_companies(loser_id bigint, winner_id bigint)
    returns bigint
    language plpgsql security definer
    set search_path = ''
as $$
declare
  winner crm.companies%rowtype;
  loser crm.companies%rowtype;
  winner_affiliate bigint;
  loser_affiliate bigint;
begin
  if loser_id = winner_id then
    raise exception 'Una empresa no se puede fusionar consigo misma';
  end if;
  select * into winner from crm.companies where id = winner_id;
  select * into loser from crm.companies where id = loser_id;
  if winner.id is null or loser.id is null then
    raise exception 'Empresa no encontrada';
  end if;
  if winner.organization_id <> loser.organization_id then
    raise exception 'Las empresas son de organizaciones distintas';
  end if;

  -- 1. Todo lo que apunta a la perdedora pasa a la ganadora. Borrarla sin
  -- esto arrastraría contactos, oportunidades y tickets (on delete cascade)
  -- o dejaría cotizaciones y facturas sin empresa (set null).
  update crm.contacts set company_id = winner_id where company_id = loser_id;
  update crm.deals set company_id = winner_id where company_id = loser_id;
  update crm.tickets set company_id = winner_id where company_id = loser_id;
  update crm.quotes set company_id = winner_id where company_id = loser_id;
  update crm.contracts set company_id = winner_id where company_id = loser_id;
  update crm.purchases set company_id = winner_id where company_id = loser_id;
  update crm.invoices set company_id = winner_id where company_id = loser_id;

  -- 2. Afiliados: la ganadora conserva el suyo. Si no tiene, hereda el de
  -- la perdedora; si las dos tienen, los referidos por el de la perdedora
  -- pasan al de la ganadora y el otro se va con ella (cascade).
  select id into winner_affiliate from crm.affiliates where company_id = winner_id order by id limit 1;
  select id into loser_affiliate from crm.affiliates where company_id = loser_id order by id limit 1;
  if loser_affiliate is not null then
    if winner_affiliate is null then
      update crm.affiliates set company_id = winner_id where company_id = loser_id;
    else
      update crm.companies set referred_by_affiliate_id = winner_affiliate
        where referred_by_affiliate_id = loser_affiliate;
    end if;
  end if;

  -- 3. Ficha: la ganadora manda; lo que le falte lo aporta la perdedora.
  -- Los enlaces de contexto se juntan y los campos personalizados también
  -- (los de la ganadora pisan a los de la perdedora).
  update crm.companies set
    sector = coalesce(winner.sector, loser.sector),
    size = coalesce(winner.size, loser.size),
    linkedin_url = coalesce(winner.linkedin_url, loser.linkedin_url),
    website = coalesce(winner.website, loser.website),
    phone_number = coalesce(winner.phone_number, loser.phone_number),
    address = coalesce(winner.address, loser.address),
    zipcode = coalesce(winner.zipcode, loser.zipcode),
    city = coalesce(winner.city, loser.city),
    state_abbr = coalesce(winner.state_abbr, loser.state_abbr),
    country = coalesce(winner.country, loser.country),
    sales_id = coalesce(winner.sales_id, loser.sales_id),
    description = coalesce(winner.description, loser.description),
    revenue = coalesce(winner.revenue, loser.revenue),
    tax_identifier = coalesce(winner.tax_identifier, loser.tax_identifier),
    tax_regime = coalesce(winner.tax_regime, loser.tax_regime),
    cfdi_use = coalesce(winner.cfdi_use, loser.cfdi_use),
    logo = coalesce(winner.logo, loser.logo),
    lifecycle_stage = coalesce(winner.lifecycle_stage, loser.lifecycle_stage),
    referred_by_affiliate_id = coalesce(winner.referred_by_affiliate_id, loser.referred_by_affiliate_id),
    context_links = (
      coalesce(winner.context_links::jsonb, '[]'::jsonb)
      || coalesce(loser.context_links::jsonb, '[]'::jsonb)
    )::json,
    custom_fields = coalesce(loser.custom_fields, '{}'::jsonb) || coalesce(winner.custom_fields, '{}'::jsonb),
    created_at = least(winner.created_at, loser.created_at)
  where id = winner_id;

  -- 4. Adiós a la perdedora.
  delete from crm.companies where id = loser_id;

  return winner_id;
end;
$$;

revoke all on function crm.merge_companies(bigint, bigint) from public;
grant execute on function crm.merge_companies(bigint, bigint) to service_role;
