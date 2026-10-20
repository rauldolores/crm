-- Renovar el acceso al pagar: cuando la factura de un contrato por
-- transferencia de KontrolIA Auth queda PAGADA, Vinqulia le pide a
-- KontrolIA Auth que extienda la vigencia de esa suscripción por el periodo
-- de la factura (POST /api/platform/subscriptions/renew, con la clave de
-- integración kpk_live_… en KONTROLIA_PLATFORM_API_KEY, solo servidor).
--
-- Regla del dueño: el acceso se renueva cuando la factura se PAGA, no cuando
-- se timbra. Los cobros con tarjeta no aplican: KontrolIA Auth ya renovó al
-- cobrar.
--
-- Changed tables:
--   crm.invoices   + access_status (not_applicable | pending | renewed |
--                    error | skipped), access_renewed_until, access_error,
--                    access_attempts, access_updated_at,
--                    access_next_attempt_at (cuándo lo reintenta solo el
--                    proceso de cada hora; nulo = ya no se reintenta solo),
--                    payment_reference (referencia del pago registrado a mano
--                    con «Registrar pago»).
--   crm.contracts  + in_grace, grace_until: la suscripción venció sin pago y
--                    KontrolIA Auth le da días de gracia (llegan en la foto).
-- Security (RLS + policies):
--   Sin cambios. crm.invoices sigue siendo de solo lectura para
--   authenticated (escribe el servidor) y el puente /api/datos la sirve de
--   solo lectura. in_grace y grace_until son campos protegidos en el puente
--   (los escribe solo la integración con KontrolIA Auth).
-- Activities and Permissions:
--   Sin permisos nuevos. «Reintentar» la renovación y «Registrar pago»
--   exigen ser administrador de la organización en el CRM, como el resto de
--   /api/facturacion/facturas/:id.

alter table crm.invoices
    add column if not exists access_status text,
    add column if not exists access_renewed_until timestamp with time zone,
    add column if not exists access_error text,
    add column if not exists access_attempts integer not null default 0,
    add column if not exists access_updated_at timestamp with time zone,
    add column if not exists access_next_attempt_at timestamp with time zone,
    add column if not exists payment_reference text;

alter table crm.invoices
    drop constraint if exists invoices_access_status_check;
alter table crm.invoices
    add constraint invoices_access_status_check
        check (access_status is null or access_status in (
            'not_applicable', 'pending', 'renewed', 'error', 'skipped'));

-- Lo que revisa el proceso de cada hora: pendientes y con error.
create index if not exists invoices_access_status_idx
    on crm.invoices (organization_id, access_status);

-- Los cobros con tarjeta y de créditos que ya existían: KontrolIA Auth
-- renovó al cobrar, no hay nada que pedirle.
update crm.invoices
   set access_status = 'not_applicable'
 where access_status is null
   and origin in ('card', 'credits');

alter table crm.contracts
    add column if not exists in_grace boolean not null default false,
    add column if not exists grace_until timestamp with time zone;
