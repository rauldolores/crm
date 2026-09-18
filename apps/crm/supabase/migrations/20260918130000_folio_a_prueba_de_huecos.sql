-- El folio nunca debe chocar con uno existente aunque la secuencia se haya
-- quedado atrás (una restauración, una limpieza a mano): si el número ya
-- existe, avanza hasta el primero libre y deja la secuencia ahí.
create or replace function crm.next_quote_number(org uuid) returns text
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  anio integer := extract(year from now())::integer;
  siguiente integer;
  folio text;
begin
  insert into crm.quote_sequences (organization_id, year, last_number)
  values (org, anio, 1)
  on conflict (organization_id, year)
    do update set last_number = crm.quote_sequences.last_number + 1
  returning last_number into siguiente;

  loop
    folio := 'COT-' || anio || '-' || lpad(siguiente::text, 4, '0');
    exit when not exists (
      select 1 from crm.quotes where organization_id = org and number = folio
    );
    siguiente := siguiente + 1;
    update crm.quote_sequences set last_number = siguiente
     where organization_id = org and year = anio;
  end loop;

  return folio;
end;
$$;
