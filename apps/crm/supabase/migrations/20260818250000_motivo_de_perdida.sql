-- Motivo de pérdida de una oportunidad.
--
-- Cuando una oportunidad se pierde, saber POR QUÉ es lo que convierte el
-- historial en una decisión: si el 60 % se pierde por precio, el problema no
-- es el equipo comercial. Los motivos posibles los define cada organización
-- en configuration.config.dealLossReasons; aquí se guarda el elegido.
alter table public.deals
    add column if not exists loss_reason text;
