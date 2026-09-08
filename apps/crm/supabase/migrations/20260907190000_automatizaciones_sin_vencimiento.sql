-- Una automatización puede crear tareas SIN fecha límite.
--
-- El disparador hacía coalesce(dueInDays, 3): toda tarea creada por una
-- automatización salía con vencimiento, aunque la columna admita nulo. No
-- todo lo que genera una regla tiene fecha límite, y poner una inventada
-- llena el calendario de plazos que nadie pactó.
--
-- Ahora, si la regla no trae días, la tarea se crea sin vencimiento.

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
  -- Guarda contra cascadas: una acción que escribe (asignar responsable)
  -- volvería a disparar el motor y podría no terminar nunca.
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
    -- Solo el cambio de etapa cuenta: al crear ya se notificó como 'created'.
    evento := 'stage_changed';
  else
    return null;
  end if;

  -- La etapa se lee ANTES de la consulta y solo donde existe la columna:
  -- PL/pgSQL prepara la consulta entera, así que una referencia a new.stage
  -- dentro de ella fallaría en contacts aunque la condición nunca se cumpla.
  if tg_table_name = 'deals' then
    etapa := new.stage;
  end if;

  -- Todo el motor va protegido: ni una regla mal configurada ni un fallo
  -- interno pueden tumbar la escritura que lo disparó.
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
          -- Las tareas cuelgan siempre de un contacto. En una oportunidad se
          -- usa su primer contacto; si no tiene ninguno, la regla se salta.
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
              -- Sin dias, la tarea queda SIN vencimiento: no todo lo que
              -- genera una automatizacion tiene fecha limite, y poner una
              -- inventada llena el calendario de plazos que nadie pacto.
              case
                when regla.action_params ->> 'dueInDays' ~ '^[0-9]+$'
                then now() + (
                  (regla.action_params ->> 'dueInDays') || ' days'
                )::interval
                else null
              end,
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
        null; -- una regla concreta falla, las demás siguen
      end;
    end loop;
  exception when others then
    null; -- el motor nunca bloquea la escritura original
  end;

  return null;
end;
$$;
