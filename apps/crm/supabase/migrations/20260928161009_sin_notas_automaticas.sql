-- Revierte `contact_notes.automatic`, que se añadió el mismo día.
--
-- Existía para una cosa: que una respuesta automática de correo (vacaciones,
-- boletín, rebote) no adelantara `last_seen` ni subiera la temperatura del
-- contacto. Quien la escribía era el webhook de correo entrante
-- (supabase/functions/postmark), y esa integración se retiró: llevaba cinco
-- semanas anunciando un Reply-To que nadie atendía.
--
-- Sin ese webhook no queda nadie que pueda marcar una nota como automática, y
-- una columna que siempre vale `false` con una rama muerta en el disparador
-- es justo el tipo de resto que hizo falta desenterrar hoy. Si algún día
-- vuelve el módulo de canales (ver .product/requirements/REQ-2026-001.md),
-- esto se vuelve a añadir con su escritor.
--
-- No se pierde nada: la columna nunca llegó a tener un solo `true`.
alter table crm.contact_notes drop column if exists automatic;

create or replace function crm.handle_contact_note_created_or_updated()
    returns trigger
    language plpgsql
    security definer
    set search_path to ''
    as $$
begin
  update crm.contacts set last_seen = new.date where contacts.id = new.contact_id and contacts.last_seen < new.date;
  return new;
end;
$$;
