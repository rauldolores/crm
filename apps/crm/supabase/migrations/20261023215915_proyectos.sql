-- Proyectos: una organización que vende varios productos (Kontrolia:
-- Faqturia, Vinqulia, AduaniaX…) los define en Ajustes (config.projects),
-- cada uno con su dirección de correo. Empresas, oportunidades, plantillas y
-- conversaciones dicen de qué proyecto son, y de ahí sale desde qué
-- dirección se escribe y a qué proyecto pertenece lo que llega.

-- Los `value` de config.projects a los que pertenece la empresa. Vacío = el
-- proyecto predeterminado.
alter table crm.companies add column if not exists projects text[] not null default '{}';
create index if not exists companies_projects_idx on crm.companies using gin (projects);

-- Una oportunidad vende un solo producto: un solo proyecto.
alter table crm.deals add column if not exists project text;
create index if not exists deals_project_idx on crm.deals (organization_id, project);

-- Para los envíos que nadie elige a mano (automatizaciones, envíos
-- masivos): la plantilla dice de qué proyecto es.
alter table crm.email_templates add column if not exists project text;

-- A qué dirección de proyecto llegó la conversación: se contesta desde ella.
alter table crm.conversations add column if not exists project text;

-- La bandeja recibe en las direcciones de los proyectos; la suya propia ya
-- no es obligatoria.
alter table crm.inbox_settings alter column inbox_email drop not null;

create or replace view crm.companies_summary with (security_invoker = on) as
 SELECT c.id,
    c.created_at,
    c.name,
    c.sector,
    c.size,
    c.linkedin_url,
    c.website,
    c.phone_number,
    c.address,
    c.zipcode,
    c.city,
    c.state_abbr,
    c.sales_id,
    c.context_links,
    c.country,
    c.description,
    c.revenue,
    c.tax_identifier,
    c.logo,
    count(DISTINCT d.id) AS nb_deals,
    count(DISTINCT co.id) AS nb_contacts,
    c.organization_id,
    c.custom_fields,
    count(DISTINCT tk.id) AS nb_tickets,
    count(DISTINCT tk.id) FILTER (WHERE tk.status <> 'closed'::text) AS nb_tickets_open,
    c.tags,
    c.referred_by_affiliate_id,
    c.lifecycle_stage,
    c.is_client,
    c.is_affiliate,
    c.projects
   FROM crm.companies c
     LEFT JOIN crm.deals d ON c.id = d.company_id
     LEFT JOIN crm.contacts co ON c.id = co.company_id
     LEFT JOIN crm.tickets tk ON c.id = tk.company_id
  GROUP BY c.id;

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

drop trigger if exists deals_proyecto_del_embudo on crm.deals;
create trigger deals_proyecto_del_embudo
    before insert or update of pipeline on crm.deals
    for each row execute function crm.proyecto_del_embudo();

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

drop trigger if exists deals_empresa_en_proyecto on crm.deals;
create trigger deals_empresa_en_proyecto
    after insert or update of project, company_id on crm.deals
    for each row execute function crm.empresa_en_proyecto_de_oportunidad();

revoke all on function crm.proyecto_del_embudo() from public, anon, authenticated;
revoke all on function crm.empresa_en_proyecto_de_oportunidad() from public, anon, authenticated;

-- La bandeja: cada conversación es del proyecto cuya dirección recibió el
-- correo, y la empresa de quien escribe gana ese proyecto.
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
