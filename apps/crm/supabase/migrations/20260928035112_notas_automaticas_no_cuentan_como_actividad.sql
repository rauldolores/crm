-- Una respuesta automática no es un contacto que responde.
--
-- Cuando alguien contesta a un correo enviado desde el CRM, la respuesta se
-- archiva como nota en su ficha y un disparador adelanta `last_seen`. Eso
-- está bien para una persona; el problema es que por ahí entran también las
-- respuestas automáticas («estoy de vacaciones», «recibimos tu mensaje»),
-- los boletines y los rebotes del servidor de correo.
--
-- Y `last_seen` no es decorativo: alimenta la puntuación del contacto
-- (03_views.sql), donde «actividad en los últimos 7 días» vale 40 puntos. Con
-- lo cual un contacto de vacaciones, que no ha leído nada, aparece como el
-- lead más caliente del embudo. Al revés de lo que hace falta.
--
-- La nota se sigue guardando SIEMPRE —perder el mensaje de un cliente sería
-- mucho peor que contarlo mal—, pero marcada; y el disparador ya no adelanta
-- `last_seen` por una nota marcada.
alter table crm.contact_notes
    add column if not exists automatic boolean not null default false;

create or replace function crm.handle_contact_note_created_or_updated()
    returns trigger
    language plpgsql
    security definer
    set search_path to ''
    as $$
begin
  -- Una nota automática (respuesta de vacaciones, boletín, rebote) no es
  -- señal de que el contacto esté vivo: no toca last_seen.
  if coalesce(new.automatic, false) then
    return new;
  end if;
  update crm.contacts set last_seen = new.date where contacts.id = new.contact_id and contacts.last_seen < new.date;
  return new;
end;
$$;
