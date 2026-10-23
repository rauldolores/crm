-- Al fusionar dos contactos, sus conversaciones de la bandeja pasan al que
-- queda (si no, el borrado del duplicado las dejaba «Sin contacto»).
--
-- Se edita la definición viva en vez de reescribirla entera: merge_contacts
-- es larga y tiene que quedar en el formato exacto de pg_dump (ver
-- 02_functions.sql), y lo único que cambia es una línea.
do $$
declare
  definicion text := pg_get_functiondef('crm.merge_contacts(bigint,bigint)'::regprocedure);
  ancla text := 'UPDATE email_outbox SET contact_id = winner_id WHERE contact_id = loser_id;';
begin
  if position('UPDATE conversations' in definicion) > 0 then
    return;
  end if;
  if position(ancla in definicion) = 0 then
    raise exception 'merge_contacts cambió: no se encontró dónde mover las conversaciones';
  end if;
  execute replace(
    definicion,
    ancla,
    ancla || E'\n  UPDATE conversations SET contact_id = winner_id WHERE contact_id = loser_id;'
  );
end $$;
