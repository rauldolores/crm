-- Enciende el módulo de cada conector que ya estaba conectado.
--
-- Desde ee69ff15 el módulo de una familia («products», «invoicing») se
-- enciende al conectar su proveedor (lib/server/conectores/modulos.ts), pero
-- solo en el momento de conectar. Un conector guardado antes de ese cambio
-- se quedó con su módulo apagado, y como el interruptor del catálogo ya no
-- es manual, no había forma de encenderlo sin desconectar y volver a
-- conectar. Esto alinea los que ya existían; es idempotente.
update crm.configuration as cfg
set config = jsonb_set(
  coalesce(cfg.config, '{}'::jsonb),
  '{modules}',
  coalesce(cfg.config -> 'modules', '{}'::jsonb)
    || (
      select jsonb_object_agg(
        c.family,
        coalesce(cfg.config -> 'modules' -> c.family, '{}'::jsonb)
          || '{"active": true}'::jsonb
      )
      from crm.connectors as c
      where c.organization_id = cfg.organization_id
    )
)
where exists (
  select 1
  from crm.connectors as c
  where c.organization_id = cfg.organization_id
    and coalesce((cfg.config -> 'modules' -> c.family ->> 'active')::boolean, false) = false
);
