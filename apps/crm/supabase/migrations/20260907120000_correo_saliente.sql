-- Servidor de correo saliente configurable por organización.
--
-- Hasta ahora el CRM enviaba por Postmark con variables de entorno globales:
-- todas las organizaciones compartían proveedor y remitente. Con Vinqulia
-- vendiéndose a varios clientes, cada uno necesita enviar desde su propio
-- dominio y con su propia cuenta.
--
-- El secreto (`api_key`) es reutilizable, no un hash: hay que presentarlo al
-- proveedor en cada envío. Por eso esta tabla no se expone a nadie — sin
-- grants para anon/authenticated, sin políticas RLS, y en la lista de
-- recursos prohibidos del puente /api/datos, que consulta con la clave de
-- servicio y de otro modo la serviría a cualquiera que la pidiese.

create table crm.email_settings (
    organization_id uuid not null primary key default (auth.jwt() ->> 'organization_id')::uuid,
    provider text not null check (provider in ('resend', 'postmark', 'sendgrid')),
    api_key text not null,
    from_email text not null,
    from_name text,
    active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

alter table crm.email_settings enable row level security;

grant select, insert, update, delete on table crm.email_settings to service_role;

-- Imprescindible: los default privileges del esquema crm conceden
-- `grant all on tables` a anon y authenticated a TODA tabla nueva, asi que
-- esta los recibe pese al grant de arriba. Sin revocarlos, la proteccion
-- quedaria colgando solo de que RLS no tenga politicas.
revoke all on table crm.email_settings from anon;
revoke all on table crm.email_settings from authenticated;
