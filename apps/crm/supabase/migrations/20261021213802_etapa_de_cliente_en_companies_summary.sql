-- La ficha de empresa lee de crm.companies_summary (dataProvider:
-- getOne("companies") -> companies_summary) y el panel de cliente deja
-- cambiar la etapa del ciclo de vida ahí mismo. La columna no estaba en la
-- vista: el cambio se guardaba bien en crm.companies, pero al refrescar, el
-- registro recargado ya no traía el campo y el selector se pintaba vacío.
--
-- El orden de las columnas es el que ya tiene la vista en la base, no el del
-- archivo del esquema (difieren desde antes): `create or replace view` exige
-- respetar nombre y posición de las existentes y solo admite columnas nuevas
-- al final.
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
    c.lifecycle_stage
from crm.companies c
    left join crm.deals d on c.id = d.company_id
    left join crm.contacts co on c.id = co.company_id
    left join crm.tickets tk on c.id = tk.company_id
group by c.id;
