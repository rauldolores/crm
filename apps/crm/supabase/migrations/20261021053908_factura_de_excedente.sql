-- Factura de excedente: cuando KontrolIA Auth cierra un mes de una
-- suscripción manual (por transferencia) y el cliente usó más de lo que su
-- plan incluye, avisa con `usage.overage` (un aviso por mes cerrado,
-- suscripción y límite). Vinqulia arma una factura APARTE para ese producto
-- y ese mes —no se suma a la factura del plan—, PPD, con los mismos ajustes
-- por producto y el mismo modo de revisión que las demás.
--
-- Changed tables:
--   crm.invoices  origin admite 'overage' (excedente de consumo).
--                 + notes: texto informativo que se imprime en el CFDI
--                   («Usado 260, incluido 200, cubierto con créditos 0»).
--                 invoices_contract_period_uk deja fuera a 'overage': un
--                 mismo contrato puede tener en el mismo mes un excedente por
--                 cada límite (páginas, pedimentos…). Su llave es
--                 source_ref = 'kontrolia-auth:overage:<closure_id>', con el
--                 índice completo invoices_origin_source_ref_uk.
--                 Ninguna consulta usa invoices_contract_period_uk en un ON
--                 CONFLICT (el servidor busca y luego inserta, y atrapa el
--                 23505), así que puede ser parcial sin romper nada.
--                 access_status: un excedente nunca renueva el acceso en
--                 KontrolIA Auth ('not_applicable'; lo pone el servidor al
--                 crearla).
-- Security (RLS + policies):
--   Sin cambios. crm.invoices sigue siendo de solo lectura para
--   authenticated; escribe el servidor (service_role).
-- Activities and Permissions:
--   Sin permisos nuevos.

alter table crm.invoices
    drop constraint if exists invoices_origin_check;
alter table crm.invoices
    add constraint invoices_origin_check
        check (origin in ('quote', 'contract', 'card', 'credits', 'manual', 'overage'));

alter table crm.invoices
    add column if not exists notes text;

drop index if exists crm.invoices_contract_period_uk;
create unique index if not exists invoices_contract_period_uk
    on crm.invoices (organization_id, contract_id, period_start, origin)
    where origin <> 'overage';
