-- Los acentos se quitan ANTES de convertir a guiones. Sin el translate, la
-- expresión [^a-z0-9] trataba cada letra acentuada como separador y «José
-- Núñez» salía «jos-n-ez». En un producto en español eso tocaba a casi
-- cualquier nombre, y el código va en el enlace que el afiliado reparte.
--
-- Solo afecta a los afiliados nuevos: los códigos ya emitidos no se tocan,
-- porque sus enlaces ya están repartidos.

create or replace function crm.generar_codigo_referido_disponible(
  org uuid,
  contacto bigint
) returns text
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  base text;
  candidato text;
  intento int := 0;
begin
  -- Los acentos se quitan ANTES de convertir a guiones: sin el translate, la
  -- expresión [^a-z0-9] trataba cada letra acentuada como separador y «José
  -- Núñez» salía «jos-n-ez». En un producto en español eso tocaba a casi
  -- cualquier nombre, y el código va en el enlace que el afiliado reparte.
  -- Las dos listas deben medir lo mismo, o translate borra letras sin avisar.
  select regexp_replace(
           lower(translate(
             coalesce(first_name, '') || '-' || coalesce(last_name, ''),
             'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãéèëêíìïîóòöôõúùüûñç',
             'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc'
           )),
           '[^a-z0-9]+', '-', 'g')
    into base
    from crm.contacts
   where id = contacto;

  base := trim(both '-' from coalesce(base, ''));
  if base = '' then
    base := 'afiliado';
  end if;

  loop
    candidato := case when intento = 0 then base else base || '-' || substr(md5(random()::text), 1, 5) end;

    exit when not exists (
      select 1 from crm.affiliates
       where organization_id = org and referral_code = candidato
    );

    intento := intento + 1;
    if intento > 20 then
      -- No debería pasar nunca en la práctica, pero si veinte sufijos
      -- aleatorios chocan, un identificador largo garantiza salir del bucle.
      candidato := 'afiliado-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
      exit;
    end if;
  end loop;

  return candidato;
end;
$$;

grant all on function crm.generar_codigo_referido_disponible(uuid, bigint) to service_role;
