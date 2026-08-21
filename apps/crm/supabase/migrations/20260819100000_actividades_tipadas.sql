-- Actividades tipadas: hoy todo contacto con el cliente se registra como
-- «nota», sin distinguir una llamada de una reunión o un WhatsApp. Tipificar
-- da un historial de relación real (y datos para futuros informes).
--
-- `deal_notes.type` ya existía en el esquema pero ninguna pantalla lo usaba
-- (columna muerta desde el fork). Se reaprovecha, se rellenan sus filas
-- existentes y se replica en `contact_notes`, que no la tenía.
alter table public.contact_notes
    add column if not exists type text;

update public.contact_notes set type = 'note' where type is null;
update public.deal_notes set type = 'note' where type is null;

alter table public.contact_notes alter column type set default 'note';
alter table public.contact_notes alter column type set not null;

alter table public.deal_notes alter column type set default 'note';
alter table public.deal_notes alter column type set not null;
