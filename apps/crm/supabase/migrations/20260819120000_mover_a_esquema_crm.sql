--
-- Mueve todo el contenido de la aplicación del esquema public al esquema crm,
-- para poder compartir este proyecto de Supabase con otras aplicaciones del
-- ecosistema KontrolIA sin colisionar nombres de tablas, vistas o funciones.
--
-- ALTER ... SET SCHEMA preserva los datos, los índices, las claves foráneas,
-- las secuencias identity, los triggers y las políticas RLS: todos ellos
-- siguen al objeto porque Postgres los referencia por OID, no por nombre
-- calificado con el esquema. Verificado en local antes de escribir esta
-- migración (ver commit): una tabla movida conserva su secuencia identity,
-- su primary key y sus políticas automáticamente.
--
-- Las funciones PL/pgSQL son la excepción: su cuerpo es texto (`prosrc`) que
-- se reanaliza en cada ejecución, así que aunque ALTER FUNCTION ... SET SCHEMA
-- mueve el objeto (conservando su OID, y por tanto los triggers que lo
-- invocan), las referencias `public.tabla` que llevaba escritas seguirían
-- apuntando a una tabla que ya no existe ahí. Por eso, tras mover cada
-- función, se vuelve a crear con CREATE OR REPLACE usando el cuerpo ya
-- corregido a `crm.` (mismo esquema y firma de argumentos, así que el OID no
-- cambia y los triggers/políticas que la referencian no se ven afectados).

create schema if not exists crm;

--
-- Tablas
--
alter table public.companies set schema crm;
alter table public.contacts set schema crm;
alter table public.contact_notes set schema crm;
alter table public.deals set schema crm;
alter table public.deal_notes set schema crm;
alter table public.sales set schema crm;
alter table public.automations set schema crm;
alter table public.public_forms set schema crm;
alter table public.public_form_submissions set schema crm;
alter table public.saved_views set schema crm;
alter table public.webhooks set schema crm;
alter table public.tags set schema crm;
alter table public.tasks set schema crm;
alter table public.configuration set schema crm;
alter table public.favicons_excluded_domains set schema crm;

--
-- Vistas
--
alter view public.activity_log set schema crm;
alter view public.companies_summary set schema crm;
alter view public.contacts_summary set schema crm;
alter view public.init_state set schema crm;

--
-- Funciones: primero se mueven (conserva el OID), después se recrean con el
-- cuerpo corregido a `crm.` (misma firma, mismo OID).
--
alter function public.cleanup_note_attachments() set schema crm;
alter function public.current_organization_id() set schema crm;
alter function public.get_avatar_for_email(text) set schema crm;
alter function public.get_domain_favicon(text) set schema crm;
alter function public.get_note_attachments_function_url() set schema crm;
alter function public.get_user_id_by_email(text) set schema crm;
alter function public.handle_company_saved() set schema crm;
alter function public.handle_contact_note_created_or_updated() set schema crm;
alter function public.handle_contact_saved() set schema crm;
alter function public.is_admin() set schema crm;
alter function public.lowercase_email_jsonb() set schema crm;
alter function public.merge_contacts(bigint, bigint) set schema crm;
alter function public.notify_webhooks() set schema crm;
alter function public.provision_crm_access() set schema crm;
alter function public.run_automations() set schema crm;
alter function public.set_sales_id_default() set schema crm;

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

  if org_id is null or uid is null then
    return;
  end if;

  insert into crm.configuration (organization_id, config)
  values (org_id, '{}'::jsonb)
  on conflict (organization_id) do nothing;

  if exists (
    select 1 from crm.sales
    where organization_id = org_id and user_id = uid
  ) then
    return;
  end if;

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
  SELECT * INTO winner_contact FROM contacts WHERE id = winner_id;
  SELECT * INTO loser_contact FROM contacts WHERE id = loser_id;

  IF winner_contact IS NULL OR loser_contact IS NULL THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;

  UPDATE tasks SET contact_id = winner_id WHERE contact_id = loser_id;

  UPDATE contact_notes SET contact_id = winner_id WHERE contact_id = loser_id;

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

  winner_emails := COALESCE(winner_contact.email_jsonb, '[]'::jsonb);
  loser_emails := COALESCE(loser_contact.email_jsonb, '[]'::jsonb);

  email_map := '{}'::jsonb;

  IF jsonb_array_length(winner_emails) > 0 THEN
    FOR i IN 0..jsonb_array_length(winner_emails)-1 LOOP
      email_map := email_map || jsonb_build_object(
        winner_emails->i->>'email',
        winner_emails->i
      );
    END LOOP;
  END IF;

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

  merged_emails := (SELECT jsonb_agg(value) FROM jsonb_each(email_map));
  merged_emails := COALESCE(merged_emails, '[]'::jsonb);

  winner_phones := COALESCE(winner_contact.phone_jsonb, '[]'::jsonb);
  loser_phones := COALESCE(loser_contact.phone_jsonb, '[]'::jsonb);

  phone_map := '{}'::jsonb;

  IF jsonb_array_length(winner_phones) > 0 THEN
    FOR i IN 0..jsonb_array_length(winner_phones)-1 LOOP
      phone_map := phone_map || jsonb_build_object(
        winner_phones->i->>'number',
        winner_phones->i
      );
    END LOOP;
  END IF;

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

  merged_phones := (SELECT jsonb_agg(value) FROM jsonb_each(phone_map));
  merged_phones := COALESCE(merged_phones, '[]'::jsonb);

  merged_tags := ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(winner_contact.tags, ARRAY[]::bigint[]) ||
      COALESCE(loser_contact.tags, ARRAY[]::bigint[])
    )
  );

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

  DELETE FROM contacts WHERE id = loser_id;

  RETURN winner_id;
END;
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
    SELECT id INTO NEW.sales_id FROM sales WHERE user_id = auth.uid();
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
  cuerpo jsonb;
  firma text;
begin
  if tg_op = 'DELETE' then
    registro := to_jsonb(old);
  else
    registro := to_jsonb(new);
  end if;

  org := (registro ->> 'organization_id')::uuid;
  if org is null then
    return null;
  end if;

  evento := tg_table_name || '.' || case tg_op
    when 'INSERT' then 'created'
    when 'UPDATE' then 'updated'
    else 'deleted'
  end;

  for suscripcion in
    select id, url, secret from crm.webhooks
    where organization_id = org
      and active
      and (resources = '{}' or tg_table_name = any(resources))
  loop
    begin
      cuerpo := jsonb_build_object(
        'evento', evento,
        'recurso', tg_table_name,
        'fecha', now(),
        'datos', registro
      );
      firma := encode(
        extensions.hmac(cuerpo::text, suscripcion.secret, 'sha256'),
        'hex'
      );
      perform net.http_post(
        url := suscripcion.url,
        body := cuerpo,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Vinqulia-Evento', evento,
          'X-Vinqulia-Firma', firma
        )
      );
    exception when others then
      null;
    end;
  end loop;

  return null;
end;
$$;

GRANT ALL ON FUNCTION "crm"."notify_webhooks"() TO "authenticated";
GRANT ALL ON FUNCTION "crm"."notify_webhooks"() TO "service_role";

create or replace function crm.run_automations() returns trigger
    language plpgsql security definer
    set search_path = ''
    as $$
declare
  org uuid;
  evento text;
  etapa text;
  regla record;
  contacto bigint;
  responsable bigint;
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  org := new.organization_id;
  if org is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    evento := 'created';
  elsif tg_table_name = 'deals' and new.stage is distinct from old.stage then
    evento := 'stage_changed';
  else
    return null;
  end if;

  if tg_table_name = 'deals' then
    etapa := new.stage;
  end if;

  begin
    for regla in
      select * from crm.automations
      where organization_id = org
        and active
        and trigger_resource = tg_table_name
        and trigger_event = evento
        and (
          evento <> 'stage_changed'
          or trigger_params ->> 'stage' is null
          or trigger_params ->> 'stage' = etapa
        )
    loop
      begin
        if regla.action_type = 'create_task' then
          if tg_table_name = 'contacts' then
            contacto := new.id;
          else
            contacto := new.contact_ids[1];
          end if;

          if contacto is not null then
            insert into crm.tasks
              (organization_id, contact_id, text, type, due_date, sales_id)
            values (
              org,
              contacto,
              coalesce(nullif(regla.action_params ->> 'text', ''), regla.name),
              nullif(regla.action_params ->> 'taskType', ''),
              now() + (
                coalesce((regla.action_params ->> 'dueInDays')::int, 3) || ' days'
              )::interval,
              new.sales_id
            );
          end if;

        elsif regla.action_type = 'assign_owner' then
          responsable := nullif(regla.action_params ->> 'salesId', '')::bigint;
          if responsable is not null then
            if tg_table_name = 'contacts' then
              update crm.contacts set sales_id = responsable where id = new.id;
            else
              update crm.deals set sales_id = responsable where id = new.id;
            end if;
          end if;
        end if;
      exception when others then
        null;
      end;
    end loop;
  exception when others then
    null;
  end;

  return null;
end;
$$;

grant all on function crm.run_automations() to authenticated;
grant all on function crm.run_automations() to service_role;

--
-- Grants: uso del esquema (imprescindible; sin esto ningún rol puede ver
-- los objetos de crm aunque tengan permisos sobre ellos) y default privileges
-- para tablas/funciones que se creen en crm en el futuro. Los permisos ya
-- concedidos sobre cada tabla/vista/función/secuencia siguen intactos: un
-- GRANT es una propiedad del objeto (por OID), no del esquema, así que se
-- conservan automáticamente al mover el objeto.
--
grant usage on schema crm to postgres;
grant usage on schema crm to anon;
grant usage on schema crm to authenticated;
grant usage on schema crm to service_role;

alter default privileges for role postgres in schema crm grant all on sequences to postgres;
alter default privileges for role postgres in schema crm grant all on sequences to anon;
alter default privileges for role postgres in schema crm grant all on sequences to authenticated;
alter default privileges for role postgres in schema crm grant all on sequences to service_role;

alter default privileges for role postgres in schema crm grant all on functions to postgres;
alter default privileges for role postgres in schema crm grant all on functions to anon;
alter default privileges for role postgres in schema crm grant all on functions to authenticated;
alter default privileges for role postgres in schema crm grant all on functions to service_role;

alter default privileges for role postgres in schema crm grant all on tables to postgres;
alter default privileges for role postgres in schema crm grant all on tables to anon;
alter default privileges for role postgres in schema crm grant all on tables to authenticated;
alter default privileges for role postgres in schema crm grant all on tables to service_role;
