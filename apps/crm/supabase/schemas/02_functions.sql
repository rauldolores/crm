--
-- Functions
-- This file declares all PL/pgSQL functions in the crm schema.
--

CREATE OR REPLACE FUNCTION "crm"."cleanup_note_attachments"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    DECLARE
      payload jsonb;
      request_headers jsonb;
      auth_header text;
    BEGIN
      request_headers := coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
      );
      auth_header := request_headers ->> 'authorization';

      IF auth_header IS NULL OR auth_header = '' THEN
        IF TG_OP = 'DELETE' THEN
          RETURN OLD;
        END IF;

        RETURN NEW;
      END IF;

      payload := jsonb_build_object(
        'old_record', OLD,
        'record', NEW,
        'type', TG_OP
      );

      PERFORM net.http_post(
        url := crm.get_note_attachments_function_url(),
        body := payload,
        params := '{}'::jsonb,
        headers := jsonb_build_object(
          'Content-Type',
          'application/json',
          'Authorization',
          auth_header
        ),
        timeout_milliseconds := 10000
      );

      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;

      RETURN NEW;
    END;
    $$;

CREATE OR REPLACE FUNCTION "crm"."get_avatar_for_email"("email" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
declare email_hash text;
declare gravatar_url text;
declare gravatar_status int8;
declare email_domain text;
declare favicon_url text;
declare domain_status int8;

begin
    -- Try to fetch a gravatar image
    email_hash = encode(extensions.digest(email, 'sha256'), 'hex');
    gravatar_url = concat('https://www.gravatar.com/avatar/', email_hash, '?d=404');

    select status from extensions.http_get(gravatar_url) into gravatar_status;

    if gravatar_status = 200 then
        return gravatar_url;
    end if;

    -- Fallback to email's domain favicon if not excluded
    email_domain = split_part(email, '@', 2);
    return get_domain_favicon(email_domain);
exception
    when others then
        return 'ERROR';
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."get_domain_favicon"("domain_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
declare domain_status int8;

begin
    if exists (select from favicons_excluded_domains as fav where fav.domain = domain_name) then
        return null;
    end if;

    return concat(
        'https://favicon.show/',
        (regexp_matches(domain_name, '^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)', 'i'))[1]
    );
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."get_note_attachments_function_url"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
    DECLARE
      issuer text;
      function_url text;
    BEGIN
      issuer := coalesce(
        nullif(current_setting('request.jwt.claim.iss', true), ''),
        (
          coalesce(
            nullif(current_setting('request.jwt.claims', true), ''),
            '{}'
          )::jsonb ->> 'iss'
        )
      );
      issuer := nullif(issuer, '');
      IF issuer IS NOT NULL THEN
        issuer := rtrim(issuer, '/');
        IF right(issuer, 8) = '/auth/v1' THEN
          function_url :=
            left(issuer, length(issuer) - 8) || '/functions/v1/delete_note_attachments';

          IF function_url LIKE 'http://127.0.0.1:%' THEN
            RETURN replace(
              function_url,
              'http://127.0.0.1:',
              'http://host.docker.internal:'
            );
          END IF;

          IF function_url LIKE 'http://localhost:%' THEN
            RETURN replace(
              function_url,
              'http://localhost:',
              'http://host.docker.internal:'
            );
          END IF;

          RETURN function_url;
        END IF;
      END IF;

      RETURN 'http://host.docker.internal:54321/functions/v1/delete_note_attachments';
    END;
    $$;

CREATE OR REPLACE FUNCTION "crm"."get_user_id_by_email"("email" "text") RETURNS TABLE("id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'crm'
    AS $_$
BEGIN
  RETURN QUERY SELECT au.id FROM auth.users au WHERE au.email = $1;
END;
$_$;

CREATE OR REPLACE FUNCTION "crm"."handle_company_saved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
declare company_logo text;

begin
    if new.logo is not null then
        return new;
    end if;

    company_logo = get_domain_favicon(new.website);
    if company_logo is null then
        return new;
    end if;

    new.logo = concat('{"src":"', company_logo, '","title":"Company favicon"}');
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."ticket_subject_prefixes"("asunto" "text", OUT "categoria" "text", OUT "motivo" "text", OUT "limpio" "text") RETURNS record
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
declare
  resto text := asunto;
  m text[];
  n int := 0;
begin
  categoria := null;
  motivo := null;
  loop
    m := regexp_match(resto, '^\s*\[([^\]]+)\]\s*');
    exit when m is null or n >= 6;
    n := n + 1;
    if n = 1 then
      categoria := lower(btrim(m[1]));
    elsif n = 2 then
      motivo := btrim(m[1]);
    end if;
    resto := substr(resto, length((regexp_match(resto, '^\s*\[[^\]]+\]\s*'))[1]) + 1);
  end loop;
  limpio := coalesce(nullif(btrim(resto), ''), asunto);
end;
$$;

-- Horas objetivo de una prioridad según Ajustes; null si no se configuró.
CREATE OR REPLACE FUNCTION "crm"."ticket_sla_hours"("org" "uuid", "prioridad" "text", "clase" "text") RETURNS integer
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select nullif(c.config -> 'ticketSla' -> prioridad ->> clase, '')::integer
    from crm.configuration c
   where c.organization_id = org;
$$;

CREATE OR REPLACE FUNCTION "crm"."handle_ticket_before_write"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  p record;
  horas integer;
begin
  if tg_op = 'INSERT' then
    -- Compatibilidad con el agente de voz y los formularios: el prefijo
    -- «[categoría]» del asunto pasa a la columna, el segundo «[motivo]» a la
    -- descripción si venía vacía, y el asunto queda limpio.
    if new.category is null and new.subject ~ '^\s*\[' then
      select * into p from crm.ticket_subject_prefixes(new.subject);
      new.category := p.categoria;
      if new.description is null and p.motivo is not null then
        new.description := p.motivo;
      end if;
      new.subject := p.limpio;
    end if;
    -- El agente de voz escribe «Prioridad: urgent» en la descripción: si no
    -- vino una prioridad explícita, se toma de ahí.
    if new.priority = 'normal' and new.description ~* 'prioridad:\s*(low|normal|high|urgent)' then
      new.priority := lower((regexp_match(new.description, 'prioridad:\s*(low|normal|high|urgent)', 'i'))[1]);
    end if;
    new.last_activity_at := coalesce(new.last_activity_at, now());
    if new.status = 'closed' then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
  else
    new.updated_at := now();
    if new.status is distinct from old.status
       or new.priority is distinct from old.priority
       or new.category is distinct from old.category
       or new.sales_id is distinct from old.sales_id then
      new.last_activity_at := now();
    end if;
    if new.status = 'closed' and old.status is distinct from 'closed' then
      new.closed_at := now();
    elsif new.status <> 'closed' and old.status = 'closed' then
      -- Reabrir: el cierre anterior deja de valer, el historial lo conserva.
      new.closed_at := null;
      new.resolution := null;
    end if;
  end if;

  -- SLA: se calcula desde la creación, también al cambiar la prioridad
  -- (subir a urgente acorta el plazo, no lo reinicia).
  if tg_op = 'INSERT' or new.priority is distinct from old.priority then
    horas := crm.ticket_sla_hours(new.organization_id, new.priority, 'firstResponseHours');
    new.first_response_due_at := case when horas is null then null
      else coalesce(new.created_at, now()) + (horas || ' hours')::interval end;
    horas := crm.ticket_sla_hours(new.organization_id, new.priority, 'resolutionHours');
    new.due_at := case when horas is null then null
      else coalesce(new.created_at, now()) + (horas || ' hours')::interval end;
  end if;

  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."log_ticket_events"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor bigint := new.updated_by;
begin
  if tg_op = 'INSERT' then
    insert into crm.ticket_events (organization_id, ticket_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, coalesce(actor, new.sales_id), 'created', null, new.status);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into crm.ticket_events (organization_id, ticket_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'status', old.status, new.status);
  end if;
  if new.priority is distinct from old.priority then
    insert into crm.ticket_events (organization_id, ticket_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'priority', old.priority, new.priority);
  end if;
  if new.category is distinct from old.category then
    insert into crm.ticket_events (organization_id, ticket_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'category', old.category, new.category);
  end if;
  if new.sales_id is distinct from old.sales_id then
    insert into crm.ticket_events (organization_id, ticket_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'sales_id', old.sales_id::text, new.sales_id::text);
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."log_deal_events"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor bigint := new.updated_by;
begin
  if tg_op = 'INSERT' then
    insert into crm.deal_events (organization_id, deal_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, coalesce(actor, new.sales_id), 'created', null, new.stage);
    return new;
  end if;

  if new.stage is distinct from old.stage then
    insert into crm.deal_events (organization_id, deal_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'stage', old.stage, new.stage);
  end if;
  if new.amount is distinct from old.amount then
    insert into crm.deal_events (organization_id, deal_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'amount', old.amount::text, new.amount::text);
  end if;
  if new.sales_id is distinct from old.sales_id then
    insert into crm.deal_events (organization_id, deal_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'sales_id', old.sales_id::text, new.sales_id::text);
  end if;
  if old.archived_at is null and new.archived_at is not null then
    insert into crm.deal_events (organization_id, deal_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'archived', null, new.stage);
  elsif old.archived_at is not null and new.archived_at is null then
    insert into crm.deal_events (organization_id, deal_id, sales_id, field, old_value, new_value)
    values (new.organization_id, new.id, actor, 'unarchived', null, new.stage);
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."handle_ticket_note_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update crm.tickets
     set last_activity_at = greatest(last_activity_at, coalesce(new.date, now())),
         updated_at = now(),
         first_response_at = case
           when first_response_at is null and new.sales_id is not null
           then coalesce(new.date, now()) else first_response_at end
   where id = new.ticket_id;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."stamp_contact_status_set_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.status is not null and new.status_set_at is null then
      new.status_set_at := now();
    end if;
  elsif new.status is distinct from old.status then
    new.status_set_at := now();
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."handle_contact_note_created_or_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update crm.contacts set last_seen = new.date where contacts.id = new.contact_id and contacts.last_seen < new.date;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."handle_contact_saved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$declare contact_avatar text;
declare emails_length int8;
declare item jsonb;

begin
    if new.avatar is not null then
        return new;
    end if;

    select coalesce(jsonb_array_length(new.email_jsonb), 0) into emails_length;

    if emails_length = 0 then
        return new;
    end if;

    for item in select jsonb_array_elements(new.email_jsonb)
    loop
        select crm.get_avatar_for_email(item->>'email') into contact_avatar;
        if (contact_avatar is not null) then
            exit;
        end if;
    end loop;

    if contact_avatar is null then
        return new;
    end if;

    new.avatar = concat('{"src":"', contact_avatar, '"}');
    return new;
end;$$;

-- Devuelve la organización activa del usuario, o null si el token no la trae.
-- Es `stable` para que el planificador la evalúe una vez por consulta en lugar
-- de una vez por fila, que es la diferencia entre un índice usable y un escaneo
-- secuencial en tablas grandes.
create or replace function crm.current_organization_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb ->> 'organization_id',
    ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION "crm"."provision_crm_access"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  org_id uuid;
  uid uuid;
  datos_usuario record;
  es_el_primero boolean;
begin
  org_id := crm.current_organization_id();
  uid := auth.uid();

  -- Sin organizacion activa o sin sesion no hay nada que aprovisionar. Se sale
  -- en silencio en lugar de fallar: la funcion se invoca en cada acceso.
  if org_id is null or uid is null then
    return;
  end if;

  -- Configuracion de la organizacion. Se crea vacia a proposito: los valores
  -- por defecto viven en defaultConfiguration.ts y el frontend los aplica
  -- cuando esta fila no trae claves. Duplicarlos aqui daria dos fuentes de
  -- verdad que se desincronizarian.
  insert into crm.configuration (organization_id, config)
  values (org_id, '{}'::jsonb)
  on conflict (organization_id) do nothing;

  if exists (
    select 1 from crm.sales
    where organization_id = org_id and user_id = uid
  ) then
    return;
  end if;

  -- El primer usuario que entra en una organizacion es su administrador.
  select not exists (
    select 1 from crm.sales where organization_id = org_id
  ) into es_el_primero;

  select email, raw_user_meta_data
    into datos_usuario
  from auth.users
  where id = uid;

  insert into crm.sales
    (organization_id, first_name, last_name, email, user_id, administrator)
  values (
    org_id,
    coalesce(
      datos_usuario.raw_user_meta_data ->> 'first_name',
      datos_usuario.raw_user_meta_data -> 'custom_claims' ->> 'first_name',
      'Pending'
    ),
    coalesce(
      datos_usuario.raw_user_meta_data ->> 'last_name',
      datos_usuario.raw_user_meta_data -> 'custom_claims' ->> 'last_name',
      'Pending'
    ),
    datos_usuario.email,
    uid,
    es_el_primero
  )
  on conflict (organization_id, user_id) do nothing;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  -- El filtro por organización es obligatorio: la función es SECURITY DEFINER
  -- y salta el RLS, así que sin él un administrador de una organización lo
  -- sería en todas aquellas de las que es miembro.
  return exists (
    select 1 from crm.sales
    where user_id = auth.uid()
      and administrator = true
      and organization_id = crm.current_organization_id()
  );
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."merge_contacts"("loser_id" bigint, "winner_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
DECLARE
  winner_contact contacts%ROWTYPE;
  loser_contact contacts%ROWTYPE;
  deal_record RECORD;
  merged_emails jsonb;
  merged_phones jsonb;
  merged_tags bigint[];
  winner_emails jsonb;
  loser_emails jsonb;
  winner_phones jsonb;
  loser_phones jsonb;
  email_map jsonb;
  phone_map jsonb;
BEGIN
  -- Fetch both contacts
  SELECT * INTO winner_contact FROM contacts WHERE id = winner_id;
  SELECT * INTO loser_contact FROM contacts WHERE id = loser_id;

  IF winner_contact IS NULL OR loser_contact IS NULL THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;

  -- 1. Reassign tasks from loser to winner
  UPDATE tasks SET contact_id = winner_id WHERE contact_id = loser_id;

  -- 2. Reassign contact notes from loser to winner
  UPDATE contact_notes SET contact_id = winner_id WHERE contact_id = loser_id;

  -- 3. Update deals - replace loser with winner in contact_ids array
  FOR deal_record IN
    SELECT id, contact_ids
    FROM deals
    WHERE contact_ids @> ARRAY[loser_id]
  LOOP
    UPDATE deals
    SET contact_ids = (
      SELECT ARRAY(
        SELECT DISTINCT unnest(
          array_remove(deal_record.contact_ids, loser_id) || ARRAY[winner_id]
        )
      )
    )
    WHERE id = deal_record.id;
  END LOOP;

  -- 3b. Everything else that points at the loser: tickets, quotes and queued
  -- emails move to the winner (deleting the loser would cascade over them or
  -- orphan them); the affiliate profile moves only if the winner has none.
  UPDATE tickets SET contact_id = winner_id WHERE contact_id = loser_id;
  UPDATE quotes SET contact_id = winner_id WHERE contact_id = loser_id;
  UPDATE email_outbox SET contact_id = winner_id WHERE contact_id = loser_id;
  UPDATE conversations SET contact_id = winner_id WHERE contact_id = loser_id;
  IF NOT EXISTS (SELECT 1 FROM affiliates WHERE contact_id = winner_id) THEN
    UPDATE affiliates SET contact_id = winner_id WHERE contact_id = loser_id;
  END IF;

  -- 4. Merge contact data

  -- Get email arrays
  winner_emails := COALESCE(winner_contact.email_jsonb, '[]'::jsonb);
  loser_emails := COALESCE(loser_contact.email_jsonb, '[]'::jsonb);

  -- Merge emails with deduplication by email address
  -- Build a map of email -> email object, then convert back to array
  email_map := '{}'::jsonb;

  -- Add winner emails to map
  IF jsonb_array_length(winner_emails) > 0 THEN
    FOR i IN 0..jsonb_array_length(winner_emails)-1 LOOP
      email_map := email_map || jsonb_build_object(
        winner_emails->i->>'email',
        winner_emails->i
      );
    END LOOP;
  END IF;

  -- Add loser emails to map (won't overwrite existing keys)
  IF jsonb_array_length(loser_emails) > 0 THEN
    FOR i IN 0..jsonb_array_length(loser_emails)-1 LOOP
      IF NOT email_map ? (loser_emails->i->>'email') THEN
        email_map := email_map || jsonb_build_object(
          loser_emails->i->>'email',
          loser_emails->i
        );
      END IF;
    END LOOP;
  END IF;

  -- Convert map back to array
  merged_emails := (SELECT jsonb_agg(value) FROM jsonb_each(email_map));
  merged_emails := COALESCE(merged_emails, '[]'::jsonb);

  -- Get phone arrays
  winner_phones := COALESCE(winner_contact.phone_jsonb, '[]'::jsonb);
  loser_phones := COALESCE(loser_contact.phone_jsonb, '[]'::jsonb);

  -- Merge phones with deduplication by number
  phone_map := '{}'::jsonb;

  -- Add winner phones to map
  IF jsonb_array_length(winner_phones) > 0 THEN
    FOR i IN 0..jsonb_array_length(winner_phones)-1 LOOP
      phone_map := phone_map || jsonb_build_object(
        winner_phones->i->>'number',
        winner_phones->i
      );
    END LOOP;
  END IF;

  -- Add loser phones to map (won't overwrite existing keys)
  IF jsonb_array_length(loser_phones) > 0 THEN
    FOR i IN 0..jsonb_array_length(loser_phones)-1 LOOP
      IF NOT phone_map ? (loser_phones->i->>'number') THEN
        phone_map := phone_map || jsonb_build_object(
          loser_phones->i->>'number',
          loser_phones->i
        );
      END IF;
    END LOOP;
  END IF;

  -- Convert map back to array
  merged_phones := (SELECT jsonb_agg(value) FROM jsonb_each(phone_map));
  merged_phones := COALESCE(merged_phones, '[]'::jsonb);

  -- Merge tags (remove duplicates)
  merged_tags := ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(winner_contact.tags, ARRAY[]::bigint[]) ||
      COALESCE(loser_contact.tags, ARRAY[]::bigint[])
    )
  );

  -- 5. Update winner with merged data
  UPDATE contacts SET
    avatar = COALESCE(winner_contact.avatar, loser_contact.avatar),
    gender = COALESCE(winner_contact.gender, loser_contact.gender),
    first_name = COALESCE(winner_contact.first_name, loser_contact.first_name),
    last_name = COALESCE(winner_contact.last_name, loser_contact.last_name),
    title = COALESCE(winner_contact.title, loser_contact.title),
    company_id = COALESCE(winner_contact.company_id, loser_contact.company_id),
    email_jsonb = merged_emails,
    phone_jsonb = merged_phones,
    linkedin_url = COALESCE(winner_contact.linkedin_url, loser_contact.linkedin_url),
    background = COALESCE(winner_contact.background, loser_contact.background),
    has_newsletter = COALESCE(winner_contact.has_newsletter, loser_contact.has_newsletter),
    first_seen = LEAST(COALESCE(winner_contact.first_seen, loser_contact.first_seen), COALESCE(loser_contact.first_seen, winner_contact.first_seen)),
    last_seen = GREATEST(COALESCE(winner_contact.last_seen, loser_contact.last_seen), COALESCE(loser_contact.last_seen, winner_contact.last_seen)),
    sales_id = COALESCE(winner_contact.sales_id, loser_contact.sales_id),
    tags = merged_tags
  WHERE id = winner_id;

  -- 6. Delete loser contact
  DELETE FROM contacts WHERE id = loser_id;

  RETURN winner_id;
END;
$$;

-- Fusionar dos empresas: lo que apunta a la perdedora pasa a la ganadora,
-- la ficha se combina y la perdedora se elimina (la llama
-- /api/empresas/fusionar; ver la migración 20260918220000).
create or replace function crm.merge_companies(loser_id bigint, winner_id bigint)
    returns bigint
    language plpgsql security definer
    set search_path = ''
as $$
declare
  winner crm.companies%rowtype;
  loser crm.companies%rowtype;
  winner_affiliate bigint;
  loser_affiliate bigint;
  afiliado_final bigint;
begin
  if loser_id = winner_id then
    raise exception 'Una empresa no se puede fusionar consigo misma';
  end if;
  select * into winner from crm.companies where id = winner_id;
  select * into loser from crm.companies where id = loser_id;
  if winner.id is null or loser.id is null then
    raise exception 'Empresa no encontrada';
  end if;
  if winner.organization_id <> loser.organization_id then
    raise exception 'Las empresas son de organizaciones distintas';
  end if;

  -- La fusión mueve atribuciones a propósito: se autoriza para toda la
  -- transacción (ver crm.conservar_afiliado_de_referencia).
  perform set_config('crm.cambio_de_afiliado_autorizado', 'on', true);

  -- 1. Todo lo que apunta a la perdedora pasa a la ganadora. Borrarla sin
  -- esto arrastraría contactos, oportunidades y tickets (on delete cascade)
  -- o dejaría cotizaciones y facturas sin empresa (set null).
  update crm.contacts set company_id = winner_id where company_id = loser_id;
  update crm.deals set company_id = winner_id where company_id = loser_id;
  update crm.tickets set company_id = winner_id where company_id = loser_id;
  -- Los tiempos de soporte no se editan, salvo para seguir a su ticket a la
  -- ganadora (ver crm.soporte_tiempos_inmutables). Van después de los tickets.
  update crm.soporte_tiempos set company_id = winner_id where company_id = loser_id;
  update crm.quotes set company_id = winner_id where company_id = loser_id;
  update crm.contracts set company_id = winner_id where company_id = loser_id;
  update crm.purchases set company_id = winner_id where company_id = loser_id;
  update crm.invoices set company_id = winner_id where company_id = loser_id;
  update crm.contract_events set company_id = winner_id where company_id = loser_id;
  -- Si la ganadora ya tiene afiliado, la atribución vigente de la perdedora
  -- termina aquí: una empresa sólo puede tener una vigente.
  if winner.referred_by_affiliate_id is not null then
    update crm.affiliate_attributions
       set status = 'reemplazada', ended_at = now(), end_reason = 'Fusión de empresas'
     where company_id = loser_id and status = 'vigente';
  end if;
  update crm.affiliate_attributions set company_id = winner_id where company_id = loser_id;

  -- 2. Afiliados: la ganadora conserva el suyo. Si no tiene, hereda el de
  -- la perdedora; si las dos tienen, los referidos por el de la perdedora
  -- pasan al de la ganadora y el otro se va con ella (cascade).
  select id into winner_affiliate from crm.affiliates where company_id = winner_id order by id limit 1;
  select id into loser_affiliate from crm.affiliates where company_id = loser_id order by id limit 1;
  if loser_affiliate is not null then
    if winner_affiliate is null then
      update crm.affiliates set company_id = winner_id where company_id = loser_id;
    else
      update crm.companies set referred_by_affiliate_id = winner_affiliate
        where referred_by_affiliate_id = loser_affiliate;
      update crm.affiliate_attributions set affiliate_id = winner_affiliate
        where affiliate_id = loser_affiliate;
    end if;
  end if;

  -- 3. Ficha: la ganadora manda; lo que le falte lo aporta la perdedora.
  -- Los enlaces de contexto se juntan y los campos personalizados también
  -- (los de la ganadora pisan a los de la perdedora).
  update crm.companies set
    sector = coalesce(winner.sector, loser.sector),
    size = coalesce(winner.size, loser.size),
    linkedin_url = coalesce(winner.linkedin_url, loser.linkedin_url),
    website = coalesce(winner.website, loser.website),
    phone_number = coalesce(winner.phone_number, loser.phone_number),
    address = coalesce(winner.address, loser.address),
    zipcode = coalesce(winner.zipcode, loser.zipcode),
    city = coalesce(winner.city, loser.city),
    state_abbr = coalesce(winner.state_abbr, loser.state_abbr),
    country = coalesce(winner.country, loser.country),
    sales_id = coalesce(winner.sales_id, loser.sales_id),
    description = coalesce(winner.description, loser.description),
    revenue = coalesce(winner.revenue, loser.revenue),
    tax_identifier = coalesce(winner.tax_identifier, loser.tax_identifier),
    tax_regime = coalesce(winner.tax_regime, loser.tax_regime),
    cfdi_use = coalesce(winner.cfdi_use, loser.cfdi_use),
    logo = coalesce(winner.logo, loser.logo),
    lifecycle_stage = coalesce(winner.lifecycle_stage, loser.lifecycle_stage),
    referred_by_affiliate_id = coalesce(winner.referred_by_affiliate_id, loser.referred_by_affiliate_id),
    context_links = (
      coalesce(winner.context_links::jsonb, '[]'::jsonb)
      || coalesce(loser.context_links::jsonb, '[]'::jsonb)
    )::json,
    custom_fields = coalesce(loser.custom_fields, '{}'::jsonb) || coalesce(winner.custom_fields, '{}'::jsonb),
    created_at = least(winner.created_at, loser.created_at)
  where id = winner_id;

  -- 3b. Historial: si las dos traían atribución distinta, la de la
  -- perdedora deja de estar vigente (ganó la de la ganadora).
  select referred_by_affiliate_id into afiliado_final from crm.companies where id = winner_id;
  update crm.affiliate_attributions
     set status = 'reemplazada',
         ended_at = now(),
         end_reason = 'Fusión de empresas'
   where company_id = winner_id
     and status = 'vigente'
     and affiliate_id is distinct from afiliado_final;

  -- 4. Adiós a la perdedora.
  delete from crm.companies where id = loser_id;

  -- 5. Si la perdedora llegaba de una integración (KontrolIA Auth) y la
  -- ganadora no, la ganadora hereda el vínculo: si no, el siguiente aviso
  -- volvería a crear la empresa. Va después del borrado por el índice único
  -- (organization_id, source, external_id).
  if winner.external_id is null and loser.external_id is not null then
    update crm.companies
       set source = loser.source, external_id = loser.external_id
     where id = winner_id;
  end if;

  perform set_config('crm.cambio_de_afiliado_autorizado', 'off', true);
  return winner_id;
end;
$$;

revoke all on function crm.merge_companies(bigint, bigint) from public;
grant execute on function crm.merge_companies(bigint, bigint) to service_role;

-- Fusionar dos tickets del mismo contacto: el perdedor pasa sus notas e
-- historial al ganador y se cierra como duplicado.
CREATE OR REPLACE FUNCTION "crm"."merge_tickets"("perdedor" bigint, "ganador" bigint, "actor" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  org uuid;
begin
  if perdedor = ganador then
    raise exception 'Un ticket no se puede fusionar consigo mismo';
  end if;
  select t.organization_id into org from crm.tickets t where t.id = ganador;
  if org is null or org is distinct from (select organization_id from crm.tickets where id = perdedor) then
    raise exception 'Los tickets no existen o no son de la misma organización';
  end if;
  if org is distinct from crm.current_organization_id() and crm.current_organization_id() is not null then
    raise exception 'Sin permiso';
  end if;

  update crm.ticket_notes set ticket_id = ganador where ticket_id = perdedor;
  update crm.ticket_events set ticket_id = ganador where ticket_id = perdedor;
  update crm.tickets
     set status = 'closed', resolution = 'duplicate', updated_by = actor,
         description = coalesce(description, '') || E'\n\n' || 'Fusionado en #' || ganador
   where id = perdedor;
  update crm.tickets set last_activity_at = now(), updated_by = actor where id = ganador;
end;
$$;

revoke all on function crm.merge_tickets(bigint, bigint, bigint) from public;
grant execute on function crm.merge_tickets(bigint, bigint, bigint) to authenticated, service_role;

-- Mover una oportunidad en el tablero en una sola transacción (la llama
-- /api/oportunidades/mover con la clave de servicio; ver la migración
-- 20260918210000).
-- p_index es la posición final de la oportunidad en la etapa de destino
-- (0 = arriba); se acota al tamaño de la columna, así que «al final» es
-- cualquier número grande. Solo cuentan las abiertas: las archivadas no
-- están en el tablero y su índice no significa nada.
create or replace function crm.move_deal(
    p_deal_id bigint,
    p_stage text,
    p_index integer,
    p_loss_reason text default null,
    p_actor bigint default null
) returns void
    language plpgsql security definer
    set search_path = ''
as $$
declare
  d record;
  n integer;
  destino integer;
begin
  select id, organization_id, pipeline, stage into d
    from crm.deals where id = p_deal_id for update;
  if not found then
    raise exception 'Oportunidad % no encontrada', p_deal_id;
  end if;

  -- Renumera de 0 en adelante la etapa de origen sin la tarjeta que se
  -- mueve (y la de destino, si es otra). Cada movimiento deja las columnas
  -- contiguas aunque vinieran con huecos, repetidos o sin índice (altas por
  -- API anteriores a crm.place_new_deal), y el orden que ve el usuario es
  -- exactamente el que se guarda.
  with ordenadas as (
    select id,
           row_number() over (partition by stage order by index nulls last, id) - 1 as pos
    from crm.deals
    where organization_id = d.organization_id and pipeline = d.pipeline
      and stage in (d.stage, p_stage) and archived_at is null and id <> d.id
  )
  update crm.deals dl set index = o.pos
    from ordenadas o
    where dl.id = o.id and dl.index is distinct from o.pos;

  select count(*) into n from crm.deals
    where organization_id = d.organization_id and pipeline = d.pipeline
      and stage = p_stage and archived_at is null and id <> d.id;
  destino := greatest(0, least(coalesce(p_index, n), n));

  -- Hace sitio en la posición de destino…
  update crm.deals set index = index + 1
    where organization_id = d.organization_id and pipeline = d.pipeline
      and stage = p_stage and archived_at is null and id <> d.id
      and index >= destino;

  -- …y coloca la tarjeta.
  update crm.deals
    set stage = p_stage,
        index = destino,
        loss_reason = coalesce(p_loss_reason, loss_reason),
        updated_by = p_actor,
        updated_at = now()
    where id = d.id;
end;
$$;

grant execute on function crm.move_deal(bigint, text, integer, text, bigint) to service_role;

-- Una oportunidad nueva entra arriba de su etapa (índice 0) y desplaza a las
-- demás. Antes lo hacía el navegador con un PATCH por tarjeta, y las creadas
-- por la API o el asistente se quedaban sin índice.
create or replace function crm.place_new_deal() returns trigger
    language plpgsql security definer
    set search_path = ''
as $$
begin
  if new.index is null then
    new.index := 0;
  end if;
  if new.archived_at is null then
    update crm.deals set index = index + 1
      where organization_id = new.organization_id and pipeline = new.pipeline
        and stage = new.stage and archived_at is null
        and index >= new.index;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "crm"."lowercase_email_jsonb"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
BEGIN
  IF NEW.email_jsonb IS NOT NULL THEN
    NEW.email_jsonb = COALESCE((
      SELECT jsonb_agg(
        jsonb_set(elem, '{email}', to_jsonb(LOWER(elem->>'email')))
      )
      FROM jsonb_array_elements(NEW.email_jsonb) AS elem
    ), '[]'::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "crm"."set_sales_id_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
BEGIN
  IF NEW.sales_id IS NULL THEN
    -- La organizacion forma parte de la busqueda: una misma persona puede
    -- tener ficha en varias, y sin este filtro `SELECT INTO` se quedaba con
    -- una cualquiera de ellas, pudiendo firmar la fila con el comercial de
    -- otro inquilino.
    SELECT id INTO NEW.sales_id
      FROM sales
     WHERE user_id = auth.uid()
       AND organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "crm"."notify_webhooks"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  registro jsonb;
  org uuid;
  evento text;
  suscripcion record;
begin
  -- Cascadas dentro de la misma transacción: si una automatización escribe a
  -- raíz de este mismo cambio, no se vuelve a avisar. No protege del bucle
  -- ENTRE sistemas (esa escritura llega en otra transacción, con profundidad
  -- 1 de nuevo): para eso está el filtro de eventos de más abajo.
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  if tg_op = 'DELETE' then
    registro := to_jsonb(old);
  else
    registro := to_jsonb(new);
  end if;

  org := (registro ->> 'organization_id')::uuid;
  if org is null then
    return null;
  end if;

  -- Un UPDATE que deja la fila idéntica no es noticia. Corta el rebote más
  -- típico: el sistema externo reescribe el mismo valor que ya estaba.
  -- Tampoco lo es reordenar una tarjeta del tablero (solo cambia `index`).
  if tg_op = 'UPDATE'
     and (to_jsonb(old) - 'index' - 'updated_at') = (to_jsonb(new) - 'index' - 'updated_at') then
    return null;
  end if;

  evento := tg_table_name || '.' || case tg_op
    when 'INSERT' then 'created'
    when 'UPDATE' then 'updated'
    else 'deleted'
  end;

  -- Solo se encola. El envío, la firma y los reintentos son cosa de
  -- crm.despachar_webhooks(), que corre programado.
  for suscripcion in
    select id from crm.webhooks
    where organization_id = org
      and active
      and (resources = '{}' or tg_table_name = any(resources))
      and (events = '{}' or evento = any(events))
  loop
    insert into crm.webhook_deliveries
      (organization_id, webhook_id, event, resource, payload)
    values (
      org,
      suscripcion.id,
      evento,
      tg_table_name,
      jsonb_build_object(
        'evento', evento,
        'recurso', tg_table_name,
        'fecha', now(),
        'datos', registro
      )
    );
  end loop;

  return null;
end;
$$;

GRANT ALL ON FUNCTION "crm"."notify_webhooks"() TO "authenticated";
GRANT ALL ON FUNCTION "crm"."notify_webhooks"() TO "service_role";

-- Cierra los envíos que ya contestaron: pg_net es asíncrono y deja la
-- respuesta en net._http_response, así que hay que ir a buscarla.
create or replace function crm.reconciliar_webhooks() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  entrega record;
  respuesta record;
  cerradas integer := 0;
begin
  for entrega in
    select id, net_request_id, attempts, max_attempts
    from crm.webhook_deliveries
    where net_request_id is not null and delivered_at is null
  loop
    select status_code, error_msg, timed_out
      into respuesta
      from net._http_response
     where id = entrega.net_request_id;

    -- Todavía en vuelo: pg_net aún no ha escrito la respuesta.
    continue when not found;

    if respuesta.status_code between 200 and 299 then
      update crm.webhook_deliveries
         set delivered_at = now(),
             net_request_id = null,
             last_status_code = respuesta.status_code,
             last_error = null
       where id = entrega.id;
    else
      -- Espera creciente: 1, 3, 9, 27 y 81 minutos.
      update crm.webhook_deliveries
         set net_request_id = null,
             last_status_code = respuesta.status_code,
             last_error = coalesce(
               respuesta.error_msg,
               case when respuesta.timed_out then 'timeout' else null end,
               'HTTP ' || coalesce(respuesta.status_code::text, '?')
             ),
             next_attempt_at = now() + (interval '1 minute' * power(3, entrega.attempts))
       where id = entrega.id;
    end if;

    cerradas := cerradas + 1;
  end loop;

  return cerradas;
end;
$$;

grant all on function crm.reconciliar_webhooks() to service_role;

-- Firma y envía lo que toca. Lo ejecuta pg_cron cada minuto (ver la
-- programación en la migración que lo introdujo).
create or replace function crm.despachar_webhooks(lote integer default 50)
returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  entrega record;
  cuerpo text;
  firma text;
  peticion bigint;
  enviadas integer := 0;
begin
  perform crm.reconciliar_webhooks();

  for entrega in
    select d.id, d.payload, d.event, d.event_id, d.attempts, w.url, w.secret
      from crm.webhook_deliveries d
      join crm.webhooks w on w.id = d.webhook_id
     where d.delivered_at is null
       and d.net_request_id is null
       and d.attempts < d.max_attempts
       and d.next_attempt_at <= now()
       and w.active
     order by d.next_attempt_at
     limit lote
     for update of d skip locked
  loop
    begin
      -- Se firma exactamente el texto que sale por el cable: pg_net serializa
      -- el jsonb con ::text, comprobado byte a byte contra su propia cola.
      cuerpo := entrega.payload::text;
      firma := encode(
        extensions.hmac(cuerpo, entrega.secret, 'sha256'),
        'hex'
      );

      peticion := net.http_post(
        url := entrega.url,
        body := entrega.payload,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Vinqulia-Evento', entrega.event,
          'X-Vinqulia-Evento-Id', entrega.event_id::text,
          'X-Vinqulia-Intento', (entrega.attempts + 1)::text,
          'X-Vinqulia-Firma', firma
        )
      );

      update crm.webhook_deliveries
         set attempts = attempts + 1,
             net_request_id = peticion,
             -- Si la respuesta no llega nunca, el siguiente ciclo lo reintenta
             -- en vez de dejarlo colgado para siempre.
             next_attempt_at = now() + (interval '1 minute' * power(3, attempts + 1))
       where id = entrega.id;

      enviadas := enviadas + 1;
    exception when others then
      update crm.webhook_deliveries
         set attempts = attempts + 1,
             last_error = sqlerrm,
             next_attempt_at = now() + (interval '1 minute' * power(3, attempts + 1))
       where id = entrega.id;
    end;
  end loop;

  return enviadas;
end;
$$;

grant all on function crm.despachar_webhooks(integer) to service_role;

-- 3. La acción de una regla, común a los dos motores.
--
-- create_task y send_email son iguales venga la regla de un contacto, una
-- oportunidad o un contrato; solo cambia de dónde sale el contacto y qué se
-- adjunta al correo. assign_owner no está aquí: toca la fila que disparó la
-- regla y solo tiene sentido en el motor de escrituras.
create or replace function crm.aplicar_accion_de_automatizacion(
    regla crm.automations,
    contacto bigint,
    oportunidad bigint,
    contrato bigint,
    cotizacion bigint,
    responsable bigint,
    ticket bigint default null
) returns void
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  plantilla bigint;
begin
  if contacto is null then
    return;
  end if;

  if regla.action_type = 'create_task' then
    insert into crm.tasks
      (organization_id, contact_id, text, type, due_date, sales_id)
    values (
      regla.organization_id,
      contacto,
      coalesce(nullif(regla.action_params ->> 'text', ''), regla.name),
      nullif(regla.action_params ->> 'taskType', ''),
      case
        when regla.action_params ->> 'dueInDays' ~ '^[0-9]+$'
        then now() + ((regla.action_params ->> 'dueInDays') || ' days')::interval
        else null
      end,
      responsable
    );

  elsif regla.action_type = 'send_email' then
    plantilla := nullif(regla.action_params ->> 'templateId', '')::bigint;

    if plantilla is not null
       and exists (
         select 1 from crm.email_templates
          where id = plantilla
            and organization_id = regla.organization_id
            and active
       ) then
      insert into crm.email_outbox
        (organization_id, automation_id, template_id, contact_id, deal_id, contract_id, quote_id, ticket_id)
      values (regla.organization_id, regla.id, plantilla, contacto, oportunidad, contrato, cotizacion, ticket);
    end if;
  end if;
end;
$$;

revoke all on function crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint, bigint, bigint) from public;
grant all on function crm.aplicar_accion_de_automatizacion(crm.automations, bigint, bigint, bigint, bigint, bigint, bigint) to service_role;

-- 4. El motor de escrituras pasa «sin cotización».
create or replace function crm.run_automations() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  org uuid;
  evento text;
  etapa text;
  regla crm.automations;
  contacto bigint;
  responsable bigint;
  oportunidad bigint;
  ticket bigint;
  prioridad text;
  texto_a_juzgar text;
  tiene_movil boolean;
  etapa_destino text;
  -- Responsable de la fila que disparó la regla. En variable y no leyendo
  -- new.sales_id donde haga falta: la cola de correo NO tiene esa columna, y
  -- plpgsql solo falla al evaluarla, así que el error aparecería tarde y lo
  -- escondería el `exception when others` de abajo.
  sales_de_la_fila bigint;
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  org := new.organization_id;
  if org is null then
    return null;
  end if;

  -- Cada tabla lee sus propios campos en su rama: plpgsql resuelve todas
  -- las referencias a new.* de una expresión aunque el «and» no llegue a
  -- ellas, y new.stage no existe en un ticket.
  --
  -- El correo va primero porque su evento es un UPDATE, no un alta: la fila
  -- de la cola nace sin enviar y lo que interesa es el momento en que sale
  -- de verdad.
  if tg_table_name = 'email_outbox' then
    if new.sent_at is not null and old.sent_at is null then
      evento := 'sent';
    else
      return null;
    end if;
  elsif tg_op = 'INSERT' then
    evento := 'created';
  elsif tg_table_name = 'deals' then
    if new.stage is distinct from old.stage then
      evento := 'stage_changed';
    else
      return null;
    end if;
  elsif tg_table_name = 'tickets' then
    if new.status = 'closed' and old.status is distinct from 'closed' then
      evento := 'closed';
    else
      return null;
    end if;
  else
    return null;
  end if;

  if tg_table_name = 'contacts' then
    contacto := new.id;
    sales_de_la_fila := new.sales_id;
    -- Un contacto recién creado no tiene texto que juzgar: su nota llega
    -- después, en otra transacción. Por eso la interfaz no ofrece condición
    -- para este disparador, y aquí queda null.
    texto_a_juzgar := null;
  elsif tg_table_name = 'deals' then
    etapa := new.stage;
    contacto := new.contact_ids[1];
    oportunidad := new.id;
    sales_de_la_fila := new.sales_id;
    texto_a_juzgar := concat_ws(E'\n\n', new.name, new.description);
    -- Si el contacto de la oportunidad tiene un teléfono marcado como móvil.
    -- Es un hecho, no un juicio: no pasa por el modelo. Sirve para separar a
    -- quien se puede intentar por WhatsApp de quien solo tiene fijo, que debe
    -- saltar directo al correo.
    tiene_movil := contacto is not null and exists (
      select 1
        from crm.contacts c,
             jsonb_array_elements(coalesce(c.phone_jsonb, '[]'::jsonb)) as e(v)
       where c.id = contacto
         and e.v ->> 'type' = 'Mobile'
    );
  elsif tg_table_name = 'tickets' then
    contacto := new.contact_id;
    oportunidad := new.deal_id;
    ticket := new.id;
    prioridad := new.priority;
    sales_de_la_fila := new.sales_id;
    texto_a_juzgar := concat_ws(E'\n\n', new.subject, new.description);
  elsif tg_table_name = 'email_outbox' then
    -- El correo ya salió: la fila dice a quién y por qué oportunidad. No hay
    -- texto que juzgar (el cuerpo lo pone la plantilla, no una persona), así
    -- que estas reglas no admiten condición.
    contacto := new.contact_id;
    oportunidad := new.deal_id;
    -- La cola no tiene responsable: lo pone el comercial del contacto, que es
    -- quien aparecera en la tarea o en el correo que encadene esta regla.
    select c.sales_id into sales_de_la_fila
      from crm.contacts c where c.id = new.contact_id;
    texto_a_juzgar := null;
  end if;

  for regla in
    select * from crm.automations
     where organization_id = org
       and active
       and trigger_resource = tg_table_name
       and trigger_event = evento
     -- Las que mueven de etapa van al final, igual que en el motor por
     -- fechas: así una regla que manda correo sobre el mismo disparador
     -- alcanza a actuar antes de que la tarjeta cambie de sitio.
     order by (action_type = 'move_stage'), id
  loop
    begin
      if evento = 'stage_changed'
         and nullif(regla.trigger_params ->> 'stage', '') is not null
         and regla.trigger_params ->> 'stage' is distinct from etapa then
        continue;
      end if;
      -- Un ticket puede filtrar por prioridad («se crea un ticket urgente»).
      if tg_table_name = 'tickets'
         and nullif(regla.trigger_params ->> 'priority', '') is not null
         and regla.trigger_params ->> 'priority' is distinct from prioridad then
        continue;
      end if;
      -- Una oportunidad puede filtrar por si su contacto tiene móvil.
      if tg_table_name = 'deals'
         and nullif(regla.trigger_params ->> 'contacto', '') is not null
         and regla.trigger_params ->> 'contacto'
             is distinct from (case when tiene_movil then 'movil' else 'sin_movil' end) then
        continue;
      end if;
      -- Un correo enviado puede acotarse a una plantilla: «cuando salga el
      -- primer contacto», no «cuando salga cualquier correo».
      if tg_table_name = 'email_outbox'
         and nullif(regla.trigger_params ->> 'templateId', '') is not null
         and regla.trigger_params ->> 'templateId'
             is distinct from new.template_id::text then
        continue;
      end if;

      -- Con condición no se actúa aquí: se encola para que la aplicación le
      -- pregunte al modelo. Sin texto que juzgar la regla no se cumple nunca,
      -- así que no se encola nada (mejor que encolar para responder «no»).
      if nullif(regla.condition_text, '') is not null then
        if nullif(texto_a_juzgar, '') is not null then
          insert into crm.automation_pending
            (organization_id, automation_id, contact_id, deal_id, ticket_id,
             sales_id, texto)
          values
            (org, regla.id, contacto, oportunidad, ticket,
             sales_de_la_fila, texto_a_juzgar);
        end if;
        continue;
      end if;

      if regla.action_type = 'assign_owner' then
        responsable := nullif(regla.action_params ->> 'salesId', '')::bigint;
        if responsable is not null then
          if tg_table_name = 'contacts' then
            update crm.contacts set sales_id = responsable where id = new.id;
          elsif tg_table_name = 'tickets' then
            update crm.tickets set sales_id = responsable where id = new.id;
          else
            update crm.deals set sales_id = responsable where id = new.id;
          end if;
        end if;

      -- Mover de etapa: como assign_owner, toca la fila que disparó la regla,
      -- por eso vive aquí y no en aplicar_accion_de_automatizacion.
      --
      -- Mismo nombre de acción que en el motor por fechas (deals:stalled),
      -- que ya la tenía: es UNA acción que vale en los dos motores, no dos.
      --
      -- El cambio NO vuelve a disparar las reglas de «cambió de etapa»: el
      -- guardia pg_trigger_depth() de arriba corta la reentrada. Es
      -- deliberado (evita bucles entre dos reglas que se muevan la una a la
      -- otra), así que una regla que mueva y otra que mande correo deben ser
      -- hermanas del mismo disparador, no encadenadas.
      elsif regla.action_type = 'move_stage' then
        etapa_destino := nullif(regla.action_params ->> 'stage', '');
        -- Sobre `oportunidad` y no sobre new.id: con el disparador de correo
        -- enviado, la fila que dispara es la de la cola y la oportunidad que
        -- hay que mover es la suya. Para una oportunidad las dos coinciden.
        -- El `is distinct from` va en el where para no escribir un cambio que
        -- no cambia nada (y no ensuciar el historial con un evento vacío).
        if etapa_destino is not null and oportunidad is not null then
          update crm.deals
             set stage = etapa_destino
           where id = oportunidad
             and stage is distinct from etapa_destino;
        end if;

      else
        perform crm.aplicar_accion_de_automatizacion(
          regla, contacto, oportunidad, null, null, sales_de_la_fila, ticket
        );
      end if;

    exception when others then
      null;
    end;
  end loop;

  return null;
end;
$$;

-- 5. El motor por fecha: renovaciones y, ahora, cotizaciones sin respuesta.
create or replace function crm.ejecutar_automatizaciones_por_fecha() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  regla crm.automations;
  contrato record;
  cotizacion record;
  ticket record;
  oportunidad record;
  contacto bigint;
  dias integer;
  horas integer;
  movidas integer;
  disparadas integer := 0;
begin
  -- Renovaciones de contratos (módulo Clientes).
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'contracts'
       and trigger_event = 'renewal_due'
  loop
    dias := case
      when regla.trigger_params ->> 'daysBefore' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'daysBefore')::integer
      else 30
    end;

    for contrato in
      select k.id, k.company_id, k.renews_on, k.sales_id
        from crm.contracts k
       where k.organization_id = regla.organization_id
         and k.status = 'active'
         and k.renews_on is not null
         and k.renews_on >= current_date
         and k.renews_on <= current_date + dias
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.contract_id = k.id
              and r.due_on = k.renews_on
         )
    loop
      begin
        select c.id into contacto
          from crm.contacts c
         where c.company_id = contrato.company_id
           and c.organization_id = regla.organization_id
         order by c.last_seen desc nulls last, c.id
         limit 1;

        insert into crm.automation_runs
          (organization_id, automation_id, contract_id, due_on)
        values (regla.organization_id, regla.id, contrato.id, contrato.renews_on);

        perform crm.aplicar_accion_de_automatizacion(
          regla, contacto, null, contrato.id, null, contrato.sales_id
        );
        disparadas := disparadas + 1;
      exception when others then
        null;
      end;
    end loop;
  end loop;

  -- Cotizaciones enviadas (o vistas) que llevan N días sin respuesta y
  -- siguen vigentes. Una sola vez por regla y cotización: si el cliente no
  -- contesta al recordatorio, la siguiente regla (con más días) es la que
  -- vuelve a avisar, no esta.
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'quotes'
       and trigger_event = 'unanswered'
  loop
    dias := case
      when regla.trigger_params ->> 'daysAfter' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'daysAfter')::integer
      else 3
    end;

    for cotizacion in
      select q.id, q.deal_id, q.company_id, q.contact_id, q.sales_id, q.sent_at
        from crm.quotes q
       where q.organization_id = regla.organization_id
         and q.status in ('sent', 'viewed')
         and q.sent_at is not null
         and q.sent_at <= now() - (dias || ' days')::interval
         and (q.valid_until is null or q.valid_until >= current_date)
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.quote_id = q.id
         )
    loop
      begin
        contacto := cotizacion.contact_id;
        if contacto is null and cotizacion.company_id is not null then
          select c.id into contacto
            from crm.contacts c
           where c.company_id = cotizacion.company_id
             and c.organization_id = regla.organization_id
           order by c.last_seen desc nulls last, c.id
           limit 1;
        end if;

        insert into crm.automation_runs
          (organization_id, automation_id, quote_id, due_on)
        values (regla.organization_id, regla.id, cotizacion.id, current_date);

        perform crm.aplicar_accion_de_automatizacion(
          regla, contacto, cotizacion.deal_id, null, cotizacion.id, cotizacion.sales_id
        );
        disparadas := disparadas + 1;
      exception when others then
        null;
      end;
    end loop;
  end loop;

  -- Tickets abiertos: sin respuesta, sin responsable o vencidos desde hace
  -- N horas. Una sola vez por regla y ticket.
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'tickets'
       and trigger_event in ('unanswered', 'unassigned', 'overdue')
  loop
    horas := case
      when regla.trigger_params ->> 'hoursAfter' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'hoursAfter')::integer
      else 4
    end;

    for ticket in
      select t.id, t.contact_id, t.deal_id, t.sales_id
        from crm.tickets t
       where t.organization_id = regla.organization_id
         and t.status <> 'closed'
         and (
           (regla.trigger_event = 'unanswered' and t.first_response_at is null
              and t.created_at <= now() - (horas || ' hours')::interval)
           or (regla.trigger_event = 'unassigned' and t.sales_id is null
              and t.created_at <= now() - (horas || ' hours')::interval)
           or (regla.trigger_event = 'overdue' and t.due_at is not null
              and t.due_at <= now() - (horas || ' hours')::interval)
         )
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.ticket_id = t.id
         )
    loop
      begin
        insert into crm.automation_runs
          (organization_id, automation_id, ticket_id, due_on)
        values (regla.organization_id, regla.id, ticket.id, current_date);

        if regla.action_type = 'assign_owner' then
          update crm.tickets
             set sales_id = nullif(regla.action_params ->> 'salesId', '')::bigint
           where id = ticket.id
             and nullif(regla.action_params ->> 'salesId', '') is not null;
        else
          perform crm.aplicar_accion_de_automatizacion(
            regla, ticket.contact_id, ticket.deal_id, null, null, ticket.sales_id, ticket.id
          );
        end if;
        disparadas := disparadas + 1;
      exception when others then
        null;
      end;
    end loop;
  end loop;

  -- Oportunidades que llevan N días en la misma etapa sin moverse.
  --
  -- La entrada en la etapa sale del historial (deal_events): el último
  -- «created» o «stage» que la dejó donde está. Una oportunidad anterior al
  -- historial cae en su created_at.
  --
  -- Se filtra por embudo además de por etapa porque los embudos comparten
  -- los nombres internos de etapa (opportunity, won, lost…): sin el embudo,
  -- «7 días en Oportunidad» saltaría en todos a la vez. Una regla sin embudo
  -- (guardada a mano) mira todos.
  --
  -- Una vez por estancia: due_on es el día en que entró. Si sale de la etapa
  -- y vuelve, hay estancia nueva y la regla vuelve a contar.
  --
  -- Las reglas que MUEVEN van al final de la pasada. Lo natural es emparejar
  -- dos reglas sobre la misma etapa y días («3 días en WhatsApp → enviar
  -- correo» y «… → mover a Correo»): si la de mover corriera antes, la
  -- oportunidad ya no estaría en WhatsApp y el correo no saldría.
  for regla in
    select * from crm.automations
     where active
       and trigger_resource = 'deals'
       and trigger_event = 'stalled'
       and nullif(trigger_params ->> 'stage', '') is not null
     order by (action_type = 'move_stage'), id
  loop
    dias := case
      when regla.trigger_params ->> 'daysInStage' ~ '^[0-9]+$'
      then (regla.trigger_params ->> 'daysInStage')::integer
      else 3
    end;

    for oportunidad in
      select d.id, d.contact_ids[1] as contacto, d.sales_id, entrada.desde
        from crm.deals d
        cross join lateral (
          select coalesce(
            (select max(ev.created_at)
               from crm.deal_events ev
              where ev.deal_id = d.id
                and ev.field in ('created', 'stage')
                and ev.new_value = d.stage),
            d.created_at
          ) as desde
        ) entrada
       where d.organization_id = regla.organization_id
         and d.archived_at is null
         and d.stage = regla.trigger_params ->> 'stage'
         and (
           nullif(regla.trigger_params ->> 'pipeline', '') is null
           or d.pipeline = regla.trigger_params ->> 'pipeline'
         )
         and entrada.desde <= now() - (dias || ' days')::interval
         and not exists (
           select 1 from crm.automation_runs r
            where r.automation_id = regla.id
              and r.deal_id = d.id
              and r.due_on = entrada.desde::date
         )
    loop
      begin
        insert into crm.automation_runs
          (organization_id, automation_id, deal_id, due_on)
        values (regla.organization_id, regla.id, oportunidad.id, oportunidad.desde::date);

        if regla.action_type = 'assign_owner' then
          update crm.deals
             set sales_id = nullif(regla.action_params ->> 'salesId', '')::bigint
           where id = oportunidad.id
             and nullif(regla.action_params ->> 'salesId', '') is not null;
        elsif regla.action_type = 'move_stage' then
          -- Solo a una etapa que exista en el embudo de la oportunidad: en una
          -- que no, desaparecería del tablero. El cambio de etapa dispara
          -- crm.run_automations, así que las reglas de la etapa nueva («al
          -- llegar a Correo → tarea de llamar») actúan solas: la cadencia se
          -- encadena. Si el destino no vale no se mueve nada, y el raise
          -- deshace también la ejecución registrada: se reintenta en la
          -- próxima pasada, por si se corrige el embudo.
          update crm.deals d
             set stage = regla.action_params ->> 'stage'
           where d.id = oportunidad.id
             and nullif(regla.action_params ->> 'stage', '') is not null
             and d.stage is distinct from regla.action_params ->> 'stage'
             and exists (
               select 1
                 from crm.configuration c
                cross join lateral jsonb_array_elements(
                  coalesce(
                    (select p -> 'stages'
                       from jsonb_array_elements(c.config -> 'dealPipelines') p
                      where p ->> 'value' = d.pipeline
                      limit 1),
                    -- Configuración anterior a los embudos múltiples: un solo
                    -- embudo, con sus etapas en dealStages.
                    case
                      when coalesce(jsonb_array_length(c.config -> 'dealPipelines'), 0) = 0
                      then c.config -> 'dealStages'
                    end,
                    '[]'::jsonb
                  )
                ) etapa
                where c.organization_id = regla.organization_id
                  and etapa ->> 'value' = regla.action_params ->> 'stage'
             );
          get diagnostics movidas = row_count;
          if movidas = 0 then
            raise exception 'etapa de destino no válida';
          end if;
        else
          perform crm.aplicar_accion_de_automatizacion(
            regla, oportunidad.contacto, oportunidad.id, null, null, oportunidad.sales_id
          );
        end if;
        disparadas := disparadas + 1;
      exception when others then
        null;
      end;
    end loop;
  end loop;

  return disparadas;
end;
$$;

revoke all on function crm.ejecutar_automatizaciones_por_fecha() from public;
grant all on function crm.ejecutar_automatizaciones_por_fecha() to service_role;

grant all on function crm.run_automations() to authenticated;
grant all on function crm.run_automations() to service_role;

-- Genera un código de referido válido y libre dentro de la organización, a
-- partir del nombre del contacto. Es solo un punto de partida: el afiliado
-- (o un administrador) lo puede cambiar después desde la propia página.
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

-- Módulo Afiliados: ¿esta etapa de este embudo es de "afiliación completa"
-- para la organización? Falso si el módulo está apagado o sin configurar.
create or replace function crm.es_etapa_de_afiliacion(org uuid, embudo text, etapa text) returns boolean
    language sql stable security definer
    set search_path = ''
    as $$
  select coalesce((
    select coalesce((c.config -> 'modules' -> 'affiliates' ->> 'active')::boolean, false)
       and c.config -> 'modules' -> 'affiliates' ->> 'pipelineId' = embudo
       and coalesce(c.config -> 'modules' -> 'affiliates' -> 'completionStages', '[]'::jsonb) ? etapa
      from crm.configuration c
     where c.organization_id = org
  ), false)
$$;

revoke all on function crm.es_etapa_de_afiliacion(uuid, text, text) from public, anon, authenticated;
grant all on function crm.es_etapa_de_afiliacion(uuid, text, text) to service_role;

-- Módulo Afiliados: quién se convierte en afiliado al completar una
-- oportunidad. El primer contacto de la oportunidad; si no tiene, el contacto
-- más reciente de su empresa (lo normal es dar de alta la empresa y su
-- contacto y luego la oportunidad, sin acordarse de vincularlo).
create or replace function crm.contacto_para_afiliar(oportunidad crm.deals) returns bigint
    language sql stable security definer
    set search_path = ''
    as $$
  select coalesce(
    oportunidad.contact_ids[1],
    (select co.id
       from crm.contacts co
      where co.company_id = oportunidad.company_id
        and co.organization_id = oportunidad.organization_id
      order by co.last_seen desc nulls last, co.id desc
      limit 1)
  )
$$;

revoke all on function crm.contacto_para_afiliar(crm.deals) from public, anon, authenticated;
grant all on function crm.contacto_para_afiliar(crm.deals) to service_role;

-- Módulo Afiliados: no deja llevar una oportunidad a la etapa de "afiliación
-- completa" si no hay a quién hacer afiliado (ni contacto en la oportunidad
-- ni en su empresa). Antes la etapa cambiaba y el afiliado simplemente no se
-- creaba, sin aviso. El mensaje llega tal cual a la pantalla.
create or replace function crm.exigir_contacto_para_afiliar() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
begin
  -- Los embudos comparten los valores de etapa: pasar de embudo con la
  -- misma etapa también cuenta como llegar a ella.
  if tg_op = 'UPDATE'
     and old.stage is not distinct from new.stage
     and old.pipeline is not distinct from new.pipeline then
    return new;
  end if;

  if crm.es_etapa_de_afiliacion(new.organization_id, new.pipeline, new.stage)
     and crm.contacto_para_afiliar(new) is null then
    raise exception 'Para activar al afiliado, la oportunidad necesita un contacto: vincula uno o dalo de alta en su empresa.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function crm.exigir_contacto_para_afiliar() from public, anon, authenticated;
grant all on function crm.exigir_contacto_para_afiliar() to service_role;

-- Módulo Afiliados: cuando una oportunidad llega (al crearse o al cambiar de
-- etapa) a una de las etapas de "afiliación completa" del embudo configurado,
-- da de alta (o refresca) como afiliado al contacto de crm.contacto_para_afiliar
-- y marca su empresa como afiliado (sin quitarle lo de cliente: puede ser las
-- dos cosas).
--
-- Todo el cuerpo va protegido con manejo de excepciones: si el módulo está
-- apagado para la organización, si falta configurarlo, o si algo falla, esta
-- función no debe impedir jamás que se guarde el cambio de etapa del deal.
-- Así "cada módulo es independiente, se activa o desactiva sin afectar el
-- sistema" es literal, no solo una intención. (Lo único que sí bloquea es
-- crm.exigir_contacto_para_afiliar, a propósito y antes de guardar.)
create or replace function crm.gestionar_modulo_afiliados() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  org uuid;
  cfg jsonb;
  contacto bigint;
  empresa bigint;
  codigo text;
  comision numeric;
begin
  -- Los embudos comparten los valores de etapa: pasar de embudo con la
  -- misma etapa también cuenta como llegar a ella.
  if tg_op = 'UPDATE'
     and old.stage is not distinct from new.stage
     and old.pipeline is not distinct from new.pipeline then
    return null;
  end if;

  org := new.organization_id;
  if org is null then
    return null;
  end if;

  begin
    if not crm.es_etapa_de_afiliacion(org, new.pipeline, new.stage) then
      return null;
    end if;

    contacto := crm.contacto_para_afiliar(new);
    if contacto is null then
      return null;
    end if;

    -- La empresa de la oportunidad; la del contacto solo si la oportunidad
    -- no tuviera (deals.company_id es obligatorio en el formulario).
    empresa := coalesce(
      new.company_id,
      (select company_id from crm.contacts where id = contacto)
    );
    if empresa is null then
      return null;
    end if;

    select config -> 'modules' -> 'affiliates' into cfg
      from crm.configuration
     where organization_id = org;

    codigo := crm.generar_codigo_referido_disponible(org, contacto);
    -- Tasa del programa: la configurada en el módulo, o 15%.
    comision := coalesce((cfg ->> 'defaultCommission')::numeric, 15);

    insert into crm.affiliates (organization_id, contact_id, company_id, deal_id, referral_code, commission_percentage)
    values (org, contacto, empresa, new.id, codigo, comision)
    on conflict (organization_id, contact_id) do update
      set company_id = excluded.company_id,
          deal_id = excluded.deal_id,
          updated_at = now();
      -- Ni referral_code ni commission_percentage se tocan en el conflicto:
      -- si el contacto ya era afiliado conserva su código y la tasa que se
      -- le haya negociado.

    update crm.companies
       set is_affiliate = true
     where id = empresa
       and organization_id = org
       and not is_affiliate;
  exception when others then
    null;
  end;

  return null;
end;
$$;

grant all on function crm.gestionar_modulo_afiliados() to authenticated;
grant all on function crm.gestionar_modulo_afiliados() to service_role;

-- La única puerta para cambiar a qué afiliado pertenece un cliente: aplica
-- el primer toque por enlace, exige motivo al reasignar a mano y escribe el
-- historial (crm.affiliate_attributions). Ver la migración
-- 20261019032939_afiliados_fase_1.sql.
create or replace function crm.asignar_afiliado(
    p_organizacion uuid,
    p_empresa bigint,
    p_afiliado bigint,
    p_origen text,
    p_actor bigint default null,
    p_motivo text default null,
    p_aplicacion text default null
) returns text
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  v_org uuid;
  v_actual bigint;
  v_codigo text;
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
begin
  if p_origen not in ('enlace', 'manual', 'importacion') then
    raise exception 'Origen de atribución desconocido: %', p_origen
      using errcode = '22023';
  end if;

  select organization_id, referred_by_affiliate_id
    into v_org, v_actual
    from crm.companies
   where id = p_empresa
     for update;

  -- Misma respuesta si no existe o es de otra organización: no se revela
  -- la existencia de identificadores ajenos.
  if v_org is null or v_org <> p_organizacion then
    raise exception 'Empresa no encontrada' using errcode = 'P0002';
  end if;

  if p_afiliado is null and p_origen <> 'manual' then
    raise exception 'Un enlace o una importación siempre traen afiliado'
      using errcode = '22023';
  end if;

  if p_afiliado is not null then
    select referral_code into v_codigo
      from crm.affiliates
     where id = p_afiliado
       and organization_id = p_organizacion
       and active;
    if v_codigo is null then
      raise exception 'Afiliado no encontrado o inactivo' using errcode = 'P0002';
    end if;
  end if;

  if p_afiliado is not distinct from v_actual then
    return 'sin_cambios';
  end if;

  -- Empresa sin afiliado: la liga cualquiera de los orígenes.
  if v_actual is null then
    perform set_config('crm.cambio_de_afiliado_autorizado', 'on', true);
    update crm.companies set referred_by_affiliate_id = p_afiliado where id = p_empresa;
    perform set_config('crm.cambio_de_afiliado_autorizado', 'off', true);

    insert into crm.affiliate_attributions
        (organization_id, company_id, affiliate_id, referral_code, source, status,
         origin_application, actor_sales_id, reason)
    values
        (p_organizacion, p_empresa, p_afiliado, v_codigo, p_origen, 'vigente',
         p_aplicacion, p_actor, v_motivo);
    return 'asignada';
  end if;

  -- Ya tenía otro afiliado. Por enlace o importación gana el primer toque:
  -- se deja constancia del intento y no cambia nada.
  if p_origen <> 'manual' then
    insert into crm.affiliate_attributions
        (organization_id, company_id, affiliate_id, referral_code, source, status,
         origin_application, actor_sales_id, reason, ended_at)
    values
        (p_organizacion, p_empresa, p_afiliado, v_codigo, p_origen, 'rechazada',
         p_aplicacion, p_actor, 'La empresa ya tenía afiliado (primer toque)', now());
    return 'rechazada';
  end if;

  -- Cambio o retiro manual: sólo con motivo, y queda a nombre de quien lo hizo.
  if v_motivo is null then
    raise exception 'Hace falta un motivo para cambiar o quitar el afiliado de un cliente'
      using errcode = '22023';
  end if;

  update crm.affiliate_attributions
     set status = case when p_afiliado is null then 'retirada' else 'reemplazada' end,
         ended_at = now(),
         ended_by_sales_id = p_actor,
         end_reason = v_motivo
   where company_id = p_empresa
     and status = 'vigente';

  perform set_config('crm.cambio_de_afiliado_autorizado', 'on', true);
  update crm.companies set referred_by_affiliate_id = p_afiliado where id = p_empresa;
  perform set_config('crm.cambio_de_afiliado_autorizado', 'off', true);

  if p_afiliado is null then
    return 'retirada';
  end if;

  insert into crm.affiliate_attributions
      (organization_id, company_id, affiliate_id, referral_code, source, status,
       origin_application, actor_sales_id, reason)
  values
      (p_organizacion, p_empresa, p_afiliado, v_codigo, 'manual', 'vigente',
       p_aplicacion, p_actor, v_motivo);
  return 'reasignada';
end;
$$;

-- Recibe la organización como parámetro, así que nunca puede quedar al
-- alcance de un cliente: sólo la llaman rutas de servidor que ya validaron
-- la sesión (/api/afiliados/asignar, /api/afiliados/atribuir).
revoke all on function crm.asignar_afiliado(uuid, bigint, bigint, text, bigint, text, text) from public, anon, authenticated;
grant execute on function crm.asignar_afiliado(uuid, bigint, bigint, text, bigint, text, text) to service_role;

-- La atribución de un cliente a un afiliado sólo cambia por
-- crm.asignar_afiliado (o crm.merge_companies), que marcan la transacción
-- con crm.cambio_de_afiliado_autorizado. Cualquier otra escritura se rechaza
-- con error: antes un cambio se revertía en silencio y quien lo hacía creía
-- haberlo guardado.
create or replace function crm.conservar_afiliado_de_referencia() returns trigger
    language plpgsql
    set search_path = ''
    as $$
begin
  if coalesce(current_setting('crm.cambio_de_afiliado_autorizado', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.referred_by_affiliate_id is not null then
      raise exception 'El afiliado de un cliente se asigna con crm.asignar_afiliado, no al crear la empresa'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.referred_by_affiliate_id is distinct from old.referred_by_affiliate_id then
    -- Borrar un afiliado deja sus empresas en NULL (on delete set null);
    -- eso no es un cambio de atribución que haya que autorizar.
    if new.referred_by_affiliate_id is null
       and not exists (select 1 from crm.affiliates where id = old.referred_by_affiliate_id)
    then
      return new;
    end if;
    raise exception 'El afiliado de un cliente sólo se cambia con crm.asignar_afiliado'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

grant all on function crm.conservar_afiliado_de_referencia() to authenticated;
grant all on function crm.conservar_afiliado_de_referencia() to service_role;

-- Cotizaciones: folio por organización y año, totales y organización de las líneas.
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

revoke all on function crm.next_quote_number(uuid) from public;
grant all on function crm.next_quote_number(uuid) to authenticated, service_role;

create or replace function crm.set_quote_number() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
begin
  if new.number is null then
    new.number := crm.next_quote_number(new.organization_id);
  end if;
  return new;
end;
$$;

create or replace function crm.recalcular_totales_de_cotizacion() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  cotizacion bigint := coalesce(new.quote_id, old.quote_id);
begin
  update crm.quotes q
     set subtotal = t.subtotal,
         tax_total = t.tax_total,
         total = t.subtotal + t.tax_total,
         updated_at = now()
    from (
      select coalesce(sum(amount), 0) as subtotal,
             coalesce(sum(round(amount * tax_rate / 100, 2)), 0) as tax_total
        from crm.quote_items
       where quote_id = cotizacion
    ) t
   where q.id = cotizacion;
  return null;
end;
$$;

create or replace function crm.set_quote_item_organization() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
begin
  select organization_id into new.organization_id from crm.quotes where id = new.quote_id;
  return new;
end;
$$;

-- Aplica (o descarta) una fila de la cola. La llama el despachador con la
-- clave de servicio después de preguntarle al modelo.
--
-- Todo el trabajo de escritura se queda aquí, en SQL, donde ya vivía: la ruta
-- solo aporta el juicio. Y es idempotente — una fila ya resuelta no se vuelve
-- a aplicar, porque un reintento no debe mandar dos correos.
create or replace function crm.resolver_condicion_de_automatizacion(
    pendiente_id bigint,
    se_cumple boolean,
    confianza numeric default null
) returns boolean
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  fila crm.automation_pending;
  regla crm.automations;
  responsable bigint;
begin
  select * into fila
    from crm.automation_pending
   where id = pendiente_id
     and resolved_at is null
   for update;

  if not found then
    return false;
  end if;

  update crm.automation_pending
     set resolved_at = now(),
         matched = se_cumple,
         confidence = confianza
   where id = pendiente_id;

  if not se_cumple then
    return true;
  end if;

  select * into regla
    from crm.automations
   where id = fila.automation_id
     and organization_id = fila.organization_id
     and active;

  -- La regla pudo apagarse o borrarse mientras la fila esperaba: entonces no
  -- se actúa, que es lo que habría querido quien la apagó.
  if not found then
    return true;
  end if;

  if regla.action_type = 'assign_owner' then
    responsable := nullif(regla.action_params ->> 'salesId', '')::bigint;
    if responsable is not null then
      if fila.ticket_id is not null then
        update crm.tickets set sales_id = responsable where id = fila.ticket_id;
      elsif fila.deal_id is not null then
        update crm.deals set sales_id = responsable where id = fila.deal_id;
      elsif fila.contact_id is not null then
        update crm.contacts set sales_id = responsable where id = fila.contact_id;
      end if;
    end if;
  else
    perform crm.aplicar_accion_de_automatizacion(
      regla, fila.contact_id, fila.deal_id, null, null, fila.sales_id,
      fila.ticket_id
    );
  end if;

  return true;
end;
$$;

revoke all on function crm.resolver_condicion_de_automatizacion(bigint, boolean, numeric) from public;
grant all on function crm.resolver_condicion_de_automatizacion(bigint, boolean, numeric) to service_role;

-- Avisa a la aplicación de que hay condiciones que juzgar. Calcado de
-- crm.despachar_correos, por el mismo motivo: la llamada al clasificador
-- vive en TypeScript y Postgres no puede hacerla.
create or replace function crm.despachar_condiciones() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  pendientes integer;
  destino text;
  secreto text;
begin
  select count(*) into pendientes
    from crm.automation_pending
   where resolved_at is null
     and attempts < max_attempts
     and next_attempt_at <= now();

  if pendientes = 0 then
    return 0;
  end if;

  select value into destino from crm.internal_settings where key = 'app_url';
  select value into secreto from crm.internal_settings where key = 'dispatch_secret';

  if destino is null or secreto is null then
    return 0;
  end if;

  perform net.http_post(
    url := rtrim(destino, '/') || '/api/automatizaciones/condiciones',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Vinqulia-Despacho', secreto
    ),
    timeout_milliseconds := 30000
  );

  return pendientes;
end;
$$;

grant all on function crm.despachar_condiciones() to service_role;

-- Módulo de facturación: despierta cada hora (pg_cron, ver la migración
-- 20261020010644_modulo_facturacion) a /api/facturacion/procesar, que planea
-- las facturas de los contratos, timbra las aprobadas y pregunta a Faqturia
-- por las que siguen sin pagar. Lee la dirección (`app_url`) y el secreto
-- (`billing_cron_secret`) de crm.internal_settings: sin secreto, o sin
-- ninguna organización con Faqturia conectada, no hace nada.
create or replace function crm.despachar_facturacion() returns integer
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  destino text;
  secreto text;
begin
  select value into destino from crm.internal_settings where key = 'app_url';
  select value into secreto from crm.internal_settings where key = 'billing_cron_secret';

  if coalesce(destino, '') = '' or coalesce(secreto, '') = '' then
    return 0;
  end if;

  if not exists (
    select 1 from crm.connectors
     where family = 'invoicing' and provider = 'faqturia'
  ) then
    return 0;
  end if;

  perform net.http_post(
    url := rtrim(destino, '/') || '/api/facturacion/procesar',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Vinqulia-Facturacion', secreto
    ),
    timeout_milliseconds := 60000
  );

  return 1;
end;
$$;

revoke all on function crm.despachar_facturacion() from public;
revoke all on function crm.despachar_facturacion() from anon;
revoke all on function crm.despachar_facturacion() from authenticated;
grant execute on function crm.despachar_facturacion() to service_role;

-- Tiempos de soporte: al guardar se copian ticket, empresa y contrato, y se
-- validan las correcciones; después, nada se edita ni se borra.
create or replace function crm.preparar_soporte_tiempo() returns trigger
    language plpgsql
    set search_path = ''
    as $$
declare
  ticket record;
  original crm.soporte_tiempos;
  hoy date := (now() at time zone 'America/Mexico_City')::date;
begin
  select t.organization_id, t.company_id, t.contract_id into ticket
    from crm.tickets t where t.id = new.ticket_id;
  if not found then
    raise exception 'El ticket % no existe.', new.ticket_id;
  end if;
  -- Con la clave de servicio no hay organización en el token: manda la del
  -- ticket. Con sesión, tiene que ser la misma.
  if new.organization_id is null then
    new.organization_id := ticket.organization_id;
  elsif new.organization_id is distinct from ticket.organization_id then
    raise exception 'El ticket % no existe.', new.ticket_id;
  end if;

  new.company_id := ticket.company_id;
  new.contract_id := ticket.contract_id;
  new.created_at := now();

  if new.atendio is null then
    select s.id into new.atendio
      from crm.sales s
     where s.user_id = auth.uid() and s.organization_id = new.organization_id;
  elsif not exists (
    select 1 from crm.sales s
     where s.id = new.atendio and s.organization_id = new.organization_id
  ) then
    raise exception 'Quien atendió no es de esta organización.';
  end if;

  if new.corrige_a is not null then
    select * into original from crm.soporte_tiempos where id = new.corrige_a;
    if not found or original.organization_id is distinct from new.organization_id
       or original.ticket_id <> new.ticket_id then
      raise exception 'El registro que quieres corregir no es de este ticket.';
    end if;
    if original.corrige_a is not null then
      raise exception 'Una corrección no se corrige: registra el tiempo de nuevo.';
    end if;
    -- El registro en contra anula al original en el mismo mes y con la
    -- misma regla de consumo; lo demás (la cifra buena) es un registro nuevo.
    new.minutos := -original.minutos;
    new.consume := original.consume;
    new.motivo_no_consume := original.motivo_no_consume;
    new.fecha_atencion := original.fecha_atencion;
    new.company_id := original.company_id;
    new.contract_id := original.contract_id;
    new.autorizado_por := null;
    new.autorizado_en := null;
    new.descripcion_cliente := coalesce(
      nullif(btrim(new.descripcion_cliente), ''),
      'Corrección del registro del ' || to_char(original.fecha_atencion, 'DD/MM/YYYY')
    );
  elsif new.fecha_atencion > hoy then
    raise exception 'La fecha de atención no puede ser futura.';
  end if;

  return new;
end;
$$;

-- Única excepción: la fusión de empresas mueve los tiempos de la perdedora a
-- la ganadora, y solo si la empresa nueva es la que ya tiene el ticket.
create or replace function crm.soporte_tiempos_inmutables() returns trigger
    language plpgsql
    set search_path = ''
    as $$
begin
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'company_id') = (to_jsonb(old) - 'company_id')
     and new.company_id = (select t.company_id from crm.tickets t where t.id = new.ticket_id) then
    return new;
  end if;
  raise exception 'Los registros de tiempo no se editan ni se borran: corrígelos con un registro en contra.';
end;
$$;
-- `mes` es cualquier día del mes. La bolsa sale de los extras vigentes ese
-- mes en los contratos de la empresa (mismo criterio que la facturación:
-- fechas del extra y fin del contrato). Si tiene dos bolsas (dos apps), se
-- suman.
create or replace function crm.soporte_resumen(p_company_id bigint, p_mes date)
    returns table (
        mes date,
        bolsas text[],
        minutos_incluidos integer,
        minutos_usados integer,
        minutos_de_mas integer,
        minutos_no_consumen integer,
        precio_hora_de_mas_centavos integer,
        registros integer
    )
    language sql stable
    security invoker
    set search_path = ''
as $$
  with periodo as (
    select date_trunc('month', p_mes)::date as inicio,
           (date_trunc('month', p_mes) + interval '1 month - 1 day')::date as fin
  ),
  bolsa as (
    select array_agg(b.slug order by b.slug) as slugs,
           sum(b.minutos_al_mes)::integer as minutos,
           max(b.precio_hora_de_mas_centavos)::integer as precio
      from crm.contracts c
      cross join periodo p
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(c.addons) = 'array' then c.addons else '[]'::jsonb end
      ) as extra
      join crm.soporte_bolsas b on b.slug = extra ->> 'slug'
     where c.company_id = p_company_id
       and (c.started_on is null or c.started_on <= p.fin)
       and (c.ended_on is null or c.ended_on >= p.inicio)
       and (left(extra ->> 'starts_at', 10) is null or left(extra ->> 'starts_at', 10) <= p.fin::text)
       and (left(extra ->> 'ends_at', 10) is null or left(extra ->> 'ends_at', 10) > p.inicio::text)
  ),
  uso as (
    select coalesce(sum(t.minutos) filter (where t.consume), 0)::integer as usados,
           coalesce(sum(t.minutos) filter (where not t.consume), 0)::integer as no_consumen,
           count(*)::integer as registros
      from crm.soporte_tiempos t, periodo p
     where t.company_id = p_company_id
       and t.fecha_atencion between p.inicio and p.fin
  )
  select p.inicio,
         coalesce(bolsa.slugs, '{}'),
         coalesce(bolsa.minutos, 0),
         uso.usados,
         greatest(uso.usados - coalesce(bolsa.minutos, 0), 0),
         uso.no_consumen,
         bolsa.precio,
         uso.registros
    from periodo p, bolsa, uso;
$$;

revoke all on function crm.soporte_resumen(bigint, date) from public;
grant execute on function crm.soporte_resumen(bigint, date) to authenticated, service_role;
-- Si la empresa tiene bolsa ese mes y este registro la rebasa, hace falta
-- quién del cliente lo autorizó. Sin bolsa no se exige nada: todavía no se
-- ha decidido cómo se cobra el soporte a quien no la tiene. Corre después
-- de crm.preparar_soporte_tiempo (orden alfabético de los disparadores),
-- con la empresa ya copiada del ticket.
create or replace function crm.exigir_autorizacion_de_hora_extra() returns trigger
    language plpgsql
    set search_path = ''
    as $$
declare
  resumen record;
begin
  if new.corrige_a is not null or not new.consume or new.minutos <= 0
     or new.autorizado_por is not null then
    return new;
  end if;
  select * into resumen from crm.soporte_resumen(new.company_id, new.fecha_atencion);
  if resumen.minutos_incluidos > 0
     and resumen.minutos_usados + new.minutos > resumen.minutos_incluidos then
    raise exception 'Este tiempo pasa de la bolsa del cliente (quedan % min este mes): indica quién del cliente autorizó la hora de más.',
      greatest(resumen.minutos_incluidos - resumen.minutos_usados, 0);
  end if;
  return new;
end;
$$;

-- Oportunidades de renovación (ver la migración 20261021051708): pg_cron
-- llama cada hora a crm.generar_oportunidades_de_renovacion().
-- ── Oportunidades de renovación: ayudantes ─────────────────────────────────────────────────────────

-- «15 dic 2026»: la fecha en el nombre de la oportunidad.
create or replace function crm.fecha_corta_es(p_fecha date) returns text
    language sql immutable
    set search_path = ''
    as $$
  select extract(day from p_fecha)::int || ' '
      || (array['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[extract(month from p_fecha)::int]
      || ' ' || extract(year from p_fecha)::int;
$$;

-- Días de anticipación: un entero de 0 a 366 (número o texto); cualquier
-- otra cosa vale lo de fábrica.
create or replace function crm.dias_de_renovacion(p_valor jsonb, p_defecto integer) returns integer
    language sql immutable
    set search_path = ''
    as $$
  select case
    when jsonb_typeof(p_valor) in ('number', 'string')
         and (p_valor #>> '{}') ~ '^[0-9]{1,4}$'
    then least((p_valor #>> '{}')::integer, 366)
    else p_defecto
  end;
$$;

-- Los ajustes de la organización con los de fábrica donde falten. Misma
-- regla que ajustesDeRenovaciones() en src/components/crm/renovaciones/renovaciones.ts.
create or replace function crm.ajustes_de_renovaciones(p_config jsonb) returns jsonb
    language plpgsql immutable
    set search_path = ''
    as $$
declare
  r jsonb := p_config -> 'renewals';
  embudo text;
begin
  if r is null or jsonb_typeof(r) <> 'object' then
    r := '{}'::jsonb;
  end if;
  embudo := r ->> 'pipeline';
  if embudo is null or embudo !~ '^[A-Za-z0-9_-]{1,60}$' then
    embudo := 'renovaciones';
  end if;
  return jsonb_build_object(
    'active', case when jsonb_typeof(r -> 'active') = 'boolean'
                   then (r ->> 'active')::boolean else true end,
    'daysBeforeYearly', crm.dias_de_renovacion(r -> 'daysBeforeYearly', 60),
    'daysBeforeQuarterly', crm.dias_de_renovacion(r -> 'daysBeforeQuarterly', 30),
    'daysBeforeMonthly', crm.dias_de_renovacion(r -> 'daysBeforeMonthly', 15),
    'includeCardContracts', case when jsonb_typeof(r -> 'includeCardContracts') = 'boolean'
                                 then (r ->> 'includeCardContracts')::boolean else false end,
    'pipeline', embudo
  );
end;
$$;

-- Un embudo de la configuración por su value (null si no está).
create or replace function crm.embudo_de_config(p_config jsonb, p_valor text) returns jsonb
    language sql immutable
    set search_path = ''
    as $$
  select e
    from jsonb_array_elements(
           case when jsonb_typeof(p_config -> 'dealPipelines') = 'array'
                then p_config -> 'dealPipelines' else '[]'::jsonb end
         ) as e
   where e ->> 'value' = p_valor
   limit 1;
$$;

-- El embudo de fábrica. Los value llevan prefijo para no chocar con las
-- etapas de otros embudos (la aplicación junta las de todos por value).
-- Si se cambia, documentarlo en modulo-de-facturacion.mdx.
create or replace function crm.embudo_de_renovaciones_por_defecto(p_valor text) returns jsonb
    language sql immutable
    set search_path = ''
    as $$
  select jsonb_build_object(
    'value', p_valor,
    'label', 'Renovaciones',
    'stages', jsonb_build_array(
      jsonb_build_object('value', 'renovacion-por-contactar', 'label', 'Por contactar', 'probability', 60),
      jsonb_build_object('value', 'renovacion-propuesta-enviada', 'label', 'Propuesta enviada', 'probability', 80),
      jsonb_build_object('value', 'renovada', 'label', 'Renovada'),
      jsonb_build_object('value', 'no-renovo', 'label', 'No renovó')
    ),
    'pipelineStatuses', jsonb_build_array('renovada'),
    'lostStages', jsonb_build_array('no-renovo')
  );
$$;

-- Deja el embudo de renovaciones (y los dos motivos de pérdida) en la
-- configuración de la organización si faltan, y lo devuelve. No toca nada
-- más de la configuración.
--
-- Si la organización nunca guardó sus embudos, la aplicación sintetiza
-- «Ventas» con dealStages/dealPipelineStatuses (ConfigurationContext.tsx);
-- aquí se escribe ese mismo embudo antes de agregar el de renovaciones, o el
-- de ventas desaparecería de la pantalla.
create or replace function crm.asegurar_embudo_de_renovaciones(p_org uuid, p_valor text) returns jsonb
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  cfg jsonb;
  embudos jsonb;
  embudo jsonb;
  etapas jsonb;
  motivos jsonb;
  motivo jsonb;
  cambio boolean := false;
begin
  insert into crm.configuration (organization_id, config)
  values (p_org, '{}'::jsonb)
  on conflict (organization_id) do nothing;

  select c.config into cfg
    from crm.configuration c
   where c.organization_id = p_org
   for update;
  cfg := coalesce(cfg, '{}'::jsonb);

  embudos := cfg -> 'dealPipelines';
  if embudos is null or jsonb_typeof(embudos) <> 'array' or jsonb_array_length(embudos) = 0 then
    etapas := case
      when jsonb_typeof(cfg -> 'dealStages') = 'array' and jsonb_array_length(cfg -> 'dealStages') > 0
      then cfg -> 'dealStages'
      -- Las de fábrica (defaultDealStages en defaultConfiguration.ts).
      else '[{"value":"opportunity","label":"Oportunidad","probability":20},
             {"value":"proposal-sent","label":"Propuesta enviada","probability":40},
             {"value":"in-negociation","label":"En negociación","probability":70},
             {"value":"won","label":"Ganada"},
             {"value":"lost","label":"Perdida"},
             {"value":"delayed","label":"Aplazada","probability":10}]'::jsonb
    end;
    embudos := jsonb_build_array(jsonb_build_object(
      'value', 'ventas',
      'label', 'Ventas',
      'stages', etapas,
      'pipelineStatuses', case
        when jsonb_typeof(cfg -> 'dealPipelineStatuses') = 'array' then cfg -> 'dealPipelineStatuses'
        else '["won"]'::jsonb end,
      'lostStages', case
        when exists (select 1 from jsonb_array_elements(etapas) e where e ->> 'value' = 'lost')
        then '["lost"]'::jsonb else '[]'::jsonb end
    ));
    cambio := true;
  end if;

  select e into embudo
    from jsonb_array_elements(embudos) e
   where e ->> 'value' = p_valor
   limit 1;

  if embudo is null then
    embudo := crm.embudo_de_renovaciones_por_defecto(p_valor);
    embudos := embudos || jsonb_build_array(embudo);
    -- Lo agregó el sistema: el puente no lo cuenta contra el límite de
    -- embudos del plan (ver limitesDelPuente.ts).
    cfg := jsonb_set(
      cfg, '{renewals}',
      (case when jsonb_typeof(cfg -> 'renewals') = 'object' then cfg -> 'renewals' else '{}'::jsonb end)
        || jsonb_build_object('systemPipeline', p_valor)
    );
    cambio := true;
  end if;

  -- Los motivos solo se agregan si la organización ya guardó los suyos: si
  -- no, la aplicación usa los de fábrica, que ya los traen.
  motivos := cfg -> 'dealLossReasons';
  if jsonb_typeof(motivos) = 'array' then
    for motivo in
      select * from jsonb_array_elements(
        '[{"value":"vencio-sin-renovar","label":"Venció sin renovar"},
          {"value":"contrato-cancelado","label":"Contrato cancelado"}]'::jsonb)
    loop
      if not exists (
        select 1 from jsonb_array_elements(motivos) m where m ->> 'value' = motivo ->> 'value'
      ) then
        motivos := motivos || jsonb_build_array(motivo);
        cambio := true;
      end if;
    end loop;
    cfg := jsonb_set(cfg, '{dealLossReasons}', motivos);
  end if;

  if cambio then
    update crm.configuration
       set config = jsonb_set(cfg, '{dealPipelines}', embudos)
     where organization_id = p_org;
  end if;

  return embudo;
end;
$$;

-- ── 4. El proceso ────────────────────────────────────────────────────────
create or replace function crm.generar_oportunidades_de_renovacion() returns jsonb
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  org uuid;
  cfg jsonb;
  ajustes jsonb;
  embudo jsonb;
  primera text;
  tipo_tarea text;
  k record;
  d record;
  corrida bigint;
  nueva bigint;
  contactos bigint[];
  responsable bigint;
  nombre text;
  etapa_ganada text;
  etapa_perdida text;
  resultado text;
  motivo text;
  abiertas integer := 0;
  ganadas integer := 0;
  perdidas integer := 0;
  errores integer := 0;
begin
  -- 1. Abrir las que ya entraron en su ventana.
  for org in
    select distinct c.organization_id
      from crm.contracts c
     where c.status = 'active'
       and c.billing_period in ('monthly', 'quarterly', 'yearly')
       and c.renews_on >= current_date
  loop
    begin
      select c.config into cfg from crm.configuration c where c.organization_id = org;
      ajustes := crm.ajustes_de_renovaciones(cfg);
      continue when not (ajustes ->> 'active')::boolean;
      embudo := null;
      primera := null;

      for k in
        select c.id, c.company_id, c.name, c.plan_name, c.amount, c.currency,
               c.renews_on, c.billing_period, c.sales_id,
               e.sales_id as company_sales_id
          from crm.contracts c
          join crm.companies e on e.id = c.company_id
         where c.organization_id = org
           and c.status = 'active'
           and c.billing_period in ('monthly', 'quarterly', 'yearly')
           and c.renews_on >= current_date
           and current_date >= c.renews_on - (case c.billing_period
                 when 'yearly' then (ajustes ->> 'daysBeforeYearly')::integer
                 when 'quarterly' then (ajustes ->> 'daysBeforeQuarterly')::integer
                 else (ajustes ->> 'daysBeforeMonthly')::integer end)
           and ((ajustes ->> 'includeCardContracts')::boolean
                or c.provider is distinct from 'stripe')
           and not exists (
             select 1 from crm.renewal_runs r
              where r.contract_id = c.id and r.renewal_for = c.renews_on
           )
         order by c.renews_on, c.id
      loop
        -- El embudo se asegura solo cuando hay algo que abrir.
        if embudo is null then
          embudo := crm.asegurar_embudo_de_renovaciones(org, ajustes ->> 'pipeline');
          primera := embudo -> 'stages' -> 0 ->> 'value';
          select c.config into cfg from crm.configuration c where c.organization_id = org;
          tipo_tarea := case
            when coalesce(jsonb_typeof(cfg -> 'taskTypes'), '') <> 'array'
              or exists (
                select 1 from jsonb_array_elements(
                  case when jsonb_typeof(cfg -> 'taskTypes') = 'array'
                       then cfg -> 'taskTypes' else '[]'::jsonb end) t
                 where t ->> 'value' = 'call')
            then 'call' else null end;
        end if;
        -- Un embudo sin etapas (hecho a mano con ese value) no puede recibir
        -- oportunidades.
        exit when primera is null;

        begin
          corrida := null;
          insert into crm.renewal_runs (organization_id, contract_id, renewal_for)
          values (org, k.id, k.renews_on)
          on conflict (contract_id, renewal_for) do nothing
          returning id into corrida;
          continue when corrida is null;

          contactos := array(
            select ct.id from crm.contacts ct
             where ct.company_id = k.company_id
               and ct.organization_id = org
               and ct.archived_at is null
             order by ct.last_seen desc nulls last, ct.id
             limit 5
          );
          responsable := coalesce(k.company_sales_id, k.sales_id);
          nombre := 'Renovación · ' || k.name
            || case when k.plan_name is not null and k.plan_name <> ''
                         and position(k.plan_name in k.name) = 0
                    then ' · ' || k.plan_name else '' end
            || ' · vence ' || crm.fecha_corta_es(k.renews_on);

          nueva := null;
          insert into crm.deals
            (organization_id, name, company_id, contact_ids, stage, pipeline,
             description, amount, expected_closing_date, sales_id,
             contract_id, renewal_for)
          values (
            org, nombre, k.company_id, contactos, primera, embudo ->> 'value',
            'Se abrió sola antes de la renovación del contrato «' || k.name || '»'
              || case when k.amount is not null
                      then ' (' || to_char(k.amount, 'FM999,999,999,990.00') || ' ' || coalesce(k.currency, 'MXN') || ' por periodo)'
                      else '' end
              || '. Se marca ganada sola cuando se paga la factura del periodo o se renueva el contrato,'
              || ' y perdida si vence o se cancela sin renovarse.',
            case when k.amount is not null then round(k.amount)::bigint else null end,
            k.renews_on, responsable, k.id, k.renews_on
          )
          on conflict (organization_id, contract_id, renewal_for) do nothing
          returning id into nueva;

          if nueva is not null then
            update crm.renewal_runs set deal_id = nueva where id = corrida;
            if contactos[1] is not null then
              insert into crm.tasks (organization_id, contact_id, text, type, due_date, sales_id)
              values (
                org, contactos[1],
                'Contactar para renovar «' || k.name || '» antes del ' || crm.fecha_corta_es(k.renews_on),
                tipo_tarea,
                greatest(k.renews_on - 7, current_date)::timestamp with time zone,
                responsable
              );
            end if;
            abiertas := abiertas + 1;
          end if;
        exception when others then
          errores := errores + 1;
          raise warning 'Renovación del contrato %: %', k.id, sqlerrm;
        end;
      end loop;
    exception when others then
      errores := errores + 1;
      raise warning 'Renovaciones de la organización %: %', org, sqlerrm;
    end;
  end loop;

  -- 2. Cerrar las abiertas cuyo contrato ya se renovó o ya se perdió.
  for d in
    select dl.id, dl.organization_id, dl.pipeline, dl.stage, dl.renewal_for,
           c.id as contrato, c.status, c.renews_on, c.in_grace, c.source
      from crm.deals dl
      join crm.contracts c on c.id = dl.contract_id
     where dl.renewal_for is not null
       and dl.archived_at is null
  loop
    begin
      select c.config into cfg from crm.configuration c where c.organization_id = d.organization_id;
      embudo := crm.embudo_de_config(cfg, d.pipeline);
      -- Ya está en una etapa ganada o perdida (a mano o por una corrida
      -- anterior): no se vuelve a tocar.
      continue when embudo is not null
        and (coalesce(embudo -> 'pipelineStatuses', '[]'::jsonb) ? d.stage
             or coalesce(embudo -> 'lostStages', '[]'::jsonb) ? d.stage);
      etapa_ganada := embudo -> 'pipelineStatuses' ->> 0;
      etapa_perdida := embudo -> 'lostStages' ->> 0;

      resultado := null;
      motivo := null;
      if d.renews_on > d.renewal_for
         or exists (
           select 1 from crm.invoices i
            where i.contract_id = d.contrato
              and i.period_start = d.renewal_for
              and i.payment_status = 'paid'
              and i.status <> 'cancelled'
         ) then
        resultado := 'ganada';
      elsif d.status = 'cancelled' then
        resultado := 'perdida';
        motivo := 'contrato-cancelado';
      elsif d.status = 'expired' then
        resultado := 'perdida';
        motivo := 'vencio-sin-renovar';
      elsif d.status = 'active'
            and d.renews_on = d.renewal_for
            and current_date > d.renewal_for
            and (case when d.source = 'kontrolia_auth' then not d.in_grace
                      else current_date > d.renewal_for + 5 end) then
        resultado := 'perdida';
        motivo := 'vencio-sin-renovar';
      end if;

      continue when resultado is null;

      if resultado = 'ganada' then
        -- Sin etapa ganada en su embudo no hay a dónde moverla.
        continue when etapa_ganada is null;
        perform crm.move_deal(d.id, etapa_ganada, 0, null, null);
        ganadas := ganadas + 1;
      else
        if etapa_perdida is not null then
          perform crm.move_deal(d.id, etapa_perdida, 0, motivo, null);
        else
          -- Embudo sin etapa de pérdida: se archiva con el motivo.
          update crm.deals
             set loss_reason = motivo,
                 archived_at = now(),
                 updated_by = null,
                 updated_at = now()
           where id = d.id;
        end if;
        perdidas := perdidas + 1;
      end if;
    exception when others then
      errores := errores + 1;
      raise warning 'Cierre de la oportunidad de renovación %: %', d.id, sqlerrm;
    end;
  end loop;

  return jsonb_build_object(
    'abiertas', abiertas,
    'ganadas', ganadas,
    'perdidas', perdidas,
    'errores', errores
  );
end;
$$;

-- ── 5. Permisos ──────────────────────────────────────────────────────────
revoke all on function crm.fecha_corta_es(date) from public, anon, authenticated;
revoke all on function crm.dias_de_renovacion(jsonb, integer) from public, anon, authenticated;
revoke all on function crm.ajustes_de_renovaciones(jsonb) from public, anon, authenticated;
revoke all on function crm.embudo_de_config(jsonb, text) from public, anon, authenticated;
revoke all on function crm.embudo_de_renovaciones_por_defecto(text) from public, anon, authenticated;
revoke all on function crm.asegurar_embudo_de_renovaciones(uuid, text) from public, anon, authenticated;
revoke all on function crm.generar_oportunidades_de_renovacion() from public, anon, authenticated;

grant execute on function crm.fecha_corta_es(date) to service_role;
grant execute on function crm.dias_de_renovacion(jsonb, integer) to service_role;
grant execute on function crm.ajustes_de_renovaciones(jsonb) to service_role;
grant execute on function crm.embudo_de_config(jsonb, text) to service_role;
grant execute on function crm.embudo_de_renovaciones_por_defecto(text) to service_role;
grant execute on function crm.asegurar_embudo_de_renovaciones(uuid, text) to service_role;
grant execute on function crm.generar_oportunidades_de_renovacion() to service_role;

-- Clientes en riesgo (ver la migración 20261021060814): pg_cron llama una
-- vez al día (13:30 UTC) a crm.revisar_clientes_en_riesgo().
-- ── Clientes en riesgo: ajustes ───────────────────────────────────────────────────────────

-- Los ajustes de la organización con los de fábrica donde falten. Misma
-- regla que ajustesDeRiesgo() en src/components/crm/customers/usoDelCliente.ts:
-- días = entero de 1 a 365 (número o texto); lo demás vale 14.
create or replace function crm.ajustes_de_riesgo(p_config jsonb) returns jsonb
    language plpgsql immutable
    set search_path = ''
    as $$
declare
  r jsonb := p_config -> 'risk';
  dias integer := 14;
begin
  if r is null or jsonb_typeof(r) <> 'object' then
    r := '{}'::jsonb;
  end if;
  if jsonb_typeof(r -> 'inactivityDays') in ('number', 'string')
     and (r ->> 'inactivityDays') ~ '^[0-9]{1,4}$' then
    dias := (r ->> 'inactivityDays')::integer;
    if dias < 1 then
      dias := 14;
    end if;
    dias := least(dias, 365);
  end if;
  return jsonb_build_object(
    'active', (case when jsonb_typeof(r -> 'active') = 'boolean'
                    then (r ->> 'active')::boolean else true end),
    'inactivityDays', dias
  );
end;
$$;

-- ── Clientes en riesgo: el proceso ────────────────────────────────────────────────────────
create or replace function crm.revisar_clientes_en_riesgo() returns jsonb
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  org uuid;
  cfg jsonb;
  ajustes jsonb;
  dias integer;
  tipo_tarea text;
  k record;
  f record;
  marca bigint;
  contacto bigint;
  tarea bigint;
  sin_entrar integer;
  texto text;
  marcadas integer := 0;
  recuperadas integer := 0;
  olvidadas integer := 0;
  errores integer := 0;
begin
  -- 1. Regresar lo que marcó el sistema. Va primero y no mira si la
  --    revisión está encendida: una organización que la apaga no debe
  --    quedarse con clientes en riesgo para siempre.
  for f in
    select r.id, r.company_id, r.organization_id, e.lifecycle_stage,
           (select max(ct.last_seen)
              from crm.contacts ct
             where ct.company_id = r.company_id
               and ct.organization_id = r.organization_id
               and ct.archived_at is null) as ultimo
      from crm.customer_risk r
      join crm.companies e on e.id = r.company_id
  loop
    begin
      select c.config into cfg from crm.configuration c where c.organization_id = f.organization_id;
      dias := (crm.ajustes_de_riesgo(cfg) ->> 'inactivityDays')::integer;

      if f.ultimo is not null and f.ultimo >= now() - make_interval(days => dias) then
        -- Alguien volvió a entrar. Solo se regresa la etapa si sigue en la
        -- que puso el sistema.
        if f.lifecycle_stage = 'at-risk' then
          update crm.companies
             set lifecycle_stage = 'customer'
           where id = f.company_id
             and lifecycle_stage = 'at-risk';
          recuperadas := recuperadas + 1;
        end if;
        delete from crm.customer_risk where id = f.id;
      elsif f.lifecycle_stage is distinct from 'at-risk'
            and f.lifecycle_stage is distinct from 'customer' then
        -- Una persona (o la integración, al perderse el cliente) la movió a
        -- otra etapa: ya no es asunto del sistema.
        delete from crm.customer_risk where id = f.id;
        olvidadas := olvidadas + 1;
      end if;
      -- Sigue sin entrar (en riesgo, o regresada a mano a cliente): se
      -- conserva la marca para no volver a marcarla ni abrir otra tarea.
    exception when others then
      errores := errores + 1;
      raise warning 'Cliente en riesgo, revisión de la empresa %: %', f.company_id, sqlerrm;
    end;
  end loop;

  -- 2. Marcar a quien lleva los días sin entrar.
  for org in
    select distinct e.organization_id
      from crm.companies e
     where e.source = 'kontrolia_auth'
       and e.lifecycle_stage = 'customer'
  loop
    begin
      select c.config into cfg from crm.configuration c where c.organization_id = org;
      ajustes := crm.ajustes_de_riesgo(cfg);
      continue when not (ajustes ->> 'active')::boolean;
      dias := (ajustes ->> 'inactivityDays')::integer;
      -- Llamada si la organización tiene ese tipo de tarea (o usa los de
      -- fábrica); si no, sin tipo. Igual que las renovaciones.
      tipo_tarea := (case
        when coalesce(jsonb_typeof(cfg -> 'taskTypes'), '') <> 'array'
          or exists (
            select 1 from jsonb_array_elements(
              case when jsonb_typeof(cfg -> 'taskTypes') = 'array'
                   then cfg -> 'taskTypes' else '[]'::jsonb end) t
             where t ->> 'value' = 'call')
        then 'call' else null end);

      for k in
        select e.id, e.name, e.sales_id, e.created_at, a.ultimo
          from crm.companies e
          left join lateral (
            select max(ct.last_seen) as ultimo
              from crm.contacts ct
             where ct.company_id = e.id
               and ct.organization_id = org
               and ct.archived_at is null
          ) a on true
         where e.organization_id = org
           and e.source = 'kontrolia_auth'
           and e.lifecycle_stage = 'customer'
           and exists (
             select 1 from crm.contracts c
              where c.company_id = e.id
                and c.organization_id = org
                and c.status = 'active'
           )
           and not exists (
             select 1 from crm.customer_risk r where r.company_id = e.id
           )
           and coalesce(a.ultimo, e.created_at) < now() - make_interval(days => dias)
         order by e.id
      loop
        begin
          marca := null;
          insert into crm.customer_risk (organization_id, company_id, last_seen_at, inactivity_days)
          values (org, k.id, k.ultimo, dias)
          on conflict (company_id) do nothing
          returning id into marca;
          continue when marca is null;

          update crm.companies
             set lifecycle_stage = 'at-risk'
           where id = k.id
             and lifecycle_stage = 'customer';

          -- Días en hora de México, como se leen las fechas en el resto del
          -- CRM.
          sin_entrar := (now() at time zone 'America/Mexico_City')::date
            - (coalesce(k.ultimo, k.created_at) at time zone 'America/Mexico_City')::date;
          texto := (case
            when k.ultimo is null
            then 'Cliente sin actividad: nadie de ' || k.name
                 || ' ha entrado desde que se dio de alta, hace ' || sin_entrar || ' días.'
            else 'Cliente sin actividad: nadie de ' || k.name
                 || ' ha entrado en ' || sin_entrar || ' días.'
            end) || ' Llamar para saber si necesita ayuda.';

          contacto := (
            select ct.id from crm.contacts ct
             where ct.company_id = k.id
               and ct.organization_id = org
               and ct.archived_at is null
             order by ct.last_seen desc nulls last, ct.id
             limit 1
          );
          tarea := null;
          if contacto is not null then
            insert into crm.tasks (organization_id, contact_id, text, type, due_date, sales_id)
            values (org, contacto, texto, tipo_tarea,
                    current_date::timestamp with time zone, k.sales_id)
            returning id into tarea;
            update crm.customer_risk set task_id = tarea where id = marca;
          end if;
          marcadas := marcadas + 1;
        exception when others then
          errores := errores + 1;
          raise warning 'Cliente en riesgo, empresa %: %', k.id, sqlerrm;
        end;
      end loop;
    exception when others then
      errores := errores + 1;
      raise warning 'Clientes en riesgo de la organización %: %', org, sqlerrm;
    end;
  end loop;

  return jsonb_build_object(
    'marcadas', marcadas,
    'recuperadas', recuperadas,
    'olvidadas', olvidadas,
    'errores', errores
  );
end;
$$;

-- ── Clientes en riesgo: permisos ──────────────────────────────────────────────────────────
revoke all on function crm.ajustes_de_riesgo(jsonb) from public, anon, authenticated;
revoke all on function crm.revisar_clientes_en_riesgo() from public, anon, authenticated;

grant execute on function crm.ajustes_de_riesgo(jsonb) to service_role;
grant execute on function crm.revisar_clientes_en_riesgo() to service_role;

-- Horas de soporte reportadas a KontrolIA Auth (20261021140000_soporte_reporta_a_auth).
create or replace function crm.soporte_reportar_a_auth() returns trigger
    language plpgsql
    security definer
    set search_path = ''
    as $$
declare
  empresa record;
  aplicacion text;
  org_auth uuid;
  app_auth uuid;
  mes_crm date := date_trunc('month', new.fecha_atencion)::date;
  mes_auth date;
  minutos integer;
  horas integer;
  ya integer;
  diferencia integer;
  anotar_estado text;
  anotar_detalle text;
begin
  -- Solo lo que consume horas (las fallas del sistema no se cuentan).
  if not new.consume then
    return null;
  end if;

  select c.source, c.external_id into empresa from crm.companies c where c.id = new.company_id;
  select ct.application_slug into aplicacion from crm.contracts ct where ct.id = new.contract_id;

  if to_regprocedure('kontrolia_auth.record_usage(uuid,uuid,text,integer,text)') is null then
    return null; -- instalación sin KontrolIA Auth en la misma base
  end if;

  -- Una empresa a la vez: dos registros simultáneos no reportan la misma
  -- diferencia.
  perform pg_advisory_xact_lock(hashtext('crm.soporte_reportar_a_auth'), new.company_id::integer);

  -- Minutos que consumen en el mes, de los tiempos de esta empresa ligados a
  -- un contrato de la misma app (correcciones incluidas).
  select coalesce(sum(t.minutos), 0)::integer into minutos
    from crm.soporte_tiempos t
    left join crm.contracts ct on ct.id = t.contract_id
   where t.company_id = new.company_id
     and t.consume
     and t.fecha_atencion >= mes_crm
     and t.fecha_atencion < (mes_crm + interval '1 month')::date
     and ct.application_slug is not distinct from aplicacion;
  horas := ceil(greatest(minutos, 0) / 60.0)::integer;

  select coalesce(sum(r.horas_reportadas), 0)::integer into ya
    from crm.soporte_reportes_auth r
   where r.company_id = new.company_id
     and r.application_slug is not distinct from aplicacion
     and r.mes = mes_crm
     and r.estado = 'REPORTADO';
  diferencia := horas - ya;

  if aplicacion is null then
    anotar_estado := 'OMITIDO';
    anotar_detalle := 'El ticket no tiene contrato: no se sabe a qué app reportar.';
  elsif empresa.source is distinct from 'kontrolia_auth' or empresa.external_id is null then
    anotar_estado := 'OMITIDO';
    anotar_detalle := 'La empresa no está ligada a una organización de KontrolIA Auth.';
  else
    mes_auth := kontrolia_auth.usage_period_start('month');
    select a.id into app_auth from kontrolia_auth.applications a where a.slug = aplicacion;
    begin
      org_auth := empresa.external_id::uuid;
    exception when others then
      org_auth := null;
    end;
    if app_auth is null or org_auth is null then
      anotar_estado := 'OMITIDO';
      anotar_detalle := format('No existe la app %s o la organización %s en KontrolIA Auth.', aplicacion, empresa.external_id);
    elsif mes_auth is distinct from mes_crm then
      anotar_estado := 'OMITIDO';
      anotar_detalle := format('La atención es de %s y Auth ya cuenta %s: no se reporta a otro mes.',
                               to_char(mes_crm, 'YYYY-MM'), to_char(mes_auth, 'YYYY-MM'));
    elsif diferencia = 0 then
      anotar_estado := 'SIN_CAMBIO';
    else
      begin
        perform kontrolia_auth.record_usage(org_auth, app_auth, 'soporte', diferencia,
                                            'crm-soporte-tiempo:' || new.id);
        anotar_estado := 'REPORTADO';
      exception when others then
        anotar_estado := 'ERROR';
        anotar_detalle := sqlerrm;
      end;
    end if;
  end if;

  insert into crm.soporte_reportes_auth (organization_id, tiempo_id, company_id, application_slug, mes,
                                         minutos_del_mes, horas_del_mes, horas_reportadas, estado, detalle)
  values (new.organization_id, new.id, new.company_id, aplicacion, mes_crm,
          minutos, horas, case when anotar_estado = 'REPORTADO' then diferencia else 0 end,
          anotar_estado, anotar_detalle);
  return null;
end;
$$;

-- «RE: RV: Fwd: Hola» y «hola» son el mismo hilo.
create or replace function crm.asunto_de_hilo(asunto text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(regexp_replace(
    lower(coalesce(asunto, '')),
    '^(\s*(re|rv|fw|fwd|res|enc)\s*(\[\d+\])?\s*:\s*)+',
    ''
  ));
$$;

-- Guarda un correo recibido en la bandeja: encuentra (o abre) su
-- conversación, lo enlaza al contacto si su dirección es de uno solo, y deja
-- constancia en la ficha. Idempotente por el id del proveedor y el
-- Message-ID: Resend reintenta los avisos.
--
-- Solo la llama el servidor (service_role), después de verificar la firma
-- del aviso: confía en la organización que recibe.
create or replace function crm.registrar_correo_entrante(
    organizacion uuid,
    correo jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proveedor_id text := nullif(correo ->> 'provider_id', '');
  mensaje_id text := nullif(correo ->> 'message_id', '');
  remitente text := lower(btrim(correo ->> 'from_email'));
  automatico boolean := coalesce((correo ->> 'automatic')::boolean, false);
  referencias text[] := coalesce(
    array(select jsonb_array_elements_text(coalesce(correo -> 'references', '[]'::jsonb))),
    '{}'
  );
  respuesta_a text := nullif(correo ->> 'in_reply_to', '');
  enviado timestamp with time zone :=
    coalesce((correo ->> 'sent_at')::timestamp with time zone, now());
  texto text := left(coalesce(correo ->> 'text', ''), 65536);
  -- El proyecto cuya dirección recibió el correo (lo decide el servidor).
  proyecto text := nullif(correo ->> 'project', '');
  conversacion crm.conversations%rowtype;
  existente bigint;
  contacto_id bigint;
  responsable bigint;
  nuevo_mensaje bigint;
  es_nueva boolean := false;
begin
  if remitente is null or remitente = '' then
    raise exception 'registrar_correo_entrante: falta el remitente';
  end if;

  -- Un aviso repetido llega a la vez que el original: que espere.
  perform pg_advisory_xact_lock(
    hashtext(organizacion::text || coalesce(proveedor_id, mensaje_id, remitente))
  );

  select m.conversation_id into existente
  from crm.conversation_messages m
  where m.organization_id = organizacion
    and (m.provider_id = proveedor_id or m.message_id = mensaje_id)
  limit 1;
  if existente is not null then
    return jsonb_build_object('conversation_id', existente, 'duplicate', true);
  end if;

  -- 1. Por las cabeceras de hilo: la respuesta cita un mensaje que ya está.
  if respuesta_a is not null or cardinality(referencias) > 0 then
    select c.* into conversacion
    from crm.conversation_messages m
    join crm.conversations c on c.id = m.conversation_id
    where m.organization_id = organizacion
      and m.message_id = any(referencias || respuesta_a)
    order by m.sent_at desc
    limit 1;
  end if;

  -- 2. Mismo remitente y mismo asunto en los últimos 60 días: muchos
  --    clientes contestan sin cabeceras (o reenvían desde otro programa).
  --    Y al mismo proyecto: escribirle a otro es otra conversación.
  if conversacion.id is null then
    select c.* into conversacion
    from crm.conversations c
    where c.organization_id = organizacion
      and c.channel = 'email'
      and c.counterpart = remitente
      and c.project is not distinct from proyecto
      and crm.asunto_de_hilo(c.subject) = crm.asunto_de_hilo(correo ->> 'subject')
      and c.last_message_at > now() - interval '60 days'
    order by c.last_message_at desc
    limit 1;
  end if;

  if conversacion.id is null then
    -- Solo si la dirección es de un único contacto: con dos, decide una
    -- persona desde la bandeja.
    select min(ct.id), min(ct.sales_id)
    into contacto_id, responsable
    from crm.contacts ct
    where ct.organization_id = organizacion
      and exists (
        select 1 from jsonb_array_elements(coalesce(ct.email_jsonb, '[]'::jsonb)) e
        where lower(btrim(e ->> 'email')) = remitente
      )
    having count(*) = 1;

    insert into crm.conversations (
      organization_id, channel, contact_id, counterpart, counterpart_name,
      subject, status, unread, sales_id, automatic, last_message_at, project
    )
    values (
      organizacion, 'email', contacto_id, remitente,
      nullif(correo ->> 'from_name', ''), nullif(correo ->> 'subject', ''),
      case when automatico then 'closed' else 'pending' end,
      not automatico, responsable, automatico, enviado, proyecto
    )
    returning * into conversacion;
    es_nueva := true;
  end if;

  insert into crm.conversation_messages (
    organization_id, conversation_id, direction, from_email, from_name,
    to_emails, cc_emails, subject, body_text, message_id, in_reply_to,
    reference_ids, provider_id, automatic, attachments, sent_at
  )
  values (
    organizacion, conversacion.id, 'in', remitente,
    nullif(correo ->> 'from_name', ''),
    coalesce(array(select jsonb_array_elements_text(coalesce(correo -> 'to', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(correo -> 'cc', '[]'::jsonb))), '{}'),
    nullif(correo ->> 'subject', ''), texto, mensaje_id, respuesta_a,
    referencias, proveedor_id, automatico,
    coalesce(correo -> 'attachments', '[]'::jsonb), enviado
  )
  returning id into nuevo_mensaje;

  -- Una respuesta automática se guarda en el hilo, pero no lo reabre.
  update crm.conversations c
  set last_message_at = greatest(c.last_message_at, enviado),
      last_message_preview = left(regexp_replace(texto, '\s+', ' ', 'g'), 200),
      status = case when automatico then c.status else 'pending' end,
      unread = c.unread or not automatico,
      automatic = c.automatic and automatico,
      project = coalesce(c.project, proyecto)
  where c.id = conversacion.id;

  -- Quien le escribe a un proyecto queda en él: su empresa lo gana.
  if proyecto is not null and conversacion.contact_id is not null and not automatico then
    update crm.companies co
    set projects = array_append(co.projects, proyecto)
    from crm.contacts ct
    where ct.id = conversacion.contact_id
      and co.id = ct.company_id
      and not (proyecto = any(co.projects));
  end if;

  -- Constancia en la ficha: cuenta como actividad del contacto.
  if conversacion.contact_id is not null and not automatico then
    insert into crm.contact_notes (
      organization_id, contact_id, text, type, sales_id, date
    )
    values (
      organizacion, conversacion.contact_id,
      left(coalesce(nullif(correo ->> 'subject', '') || E'\n\n', '') || texto, 20000),
      'email', conversacion.sales_id, enviado
    );
  end if;

  return jsonb_build_object(
    'conversation_id', conversacion.id,
    'message_id', nuevo_mensaje,
    'new_conversation', es_nueva,
    'duplicate', false
  );
end;
$$;


-- El proyecto de una oportunidad sale de su embudo (config.dealPipelines[].
-- project) si nadie lo eligió, también al cambiarla de embudo. En la base y
-- no en el formulario: las abren también la API, las importaciones y las
-- renovaciones automáticas.
create or replace function crm.proyecto_del_embudo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  del_embudo text;
begin
  if tg_op = 'UPDATE'
     and (new.pipeline is not distinct from old.pipeline
          or new.project is distinct from old.project) then
    return new;
  end if;
  if tg_op = 'INSERT' and new.project is not null then
    return new;
  end if;

  select nullif(p ->> 'project', '') into del_embudo
  from crm.configuration c,
       jsonb_array_elements(coalesce(c.config -> 'dealPipelines', '[]'::jsonb)) p
  where c.organization_id = new.organization_id
    and p ->> 'value' = new.pipeline
  limit 1;

  if del_embudo is not null then
    new.project := del_embudo;
  end if;
  return new;
end;
$$;

-- La empresa queda en el proyecto de sus oportunidades: si le vendemos
-- AduaniaX, es de AduaniaX.
create or replace function crm.empresa_en_proyecto_de_oportunidad()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.project is not null and new.company_id is not null then
    update crm.companies
    set projects = array_append(projects, new.project)
    where id = new.company_id
      and organization_id = new.organization_id
      and not (new.project = any(projects));
  end if;
  return null;
end;
$$;
