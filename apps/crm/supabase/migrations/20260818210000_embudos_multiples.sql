-- Embudos múltiples de oportunidades.
--
-- Cada organización puede definir varios embudos (ventas, renovaciones,
-- cobranza…), cada uno con sus propias etapas. Las DEFINICIONES viven en
-- configuration.config.dealPipelines; esta columna dice a cuál pertenece cada
-- oportunidad.
--
-- El default 'ventas' es el mismo embudo que la aplicación sintetiza para
-- configuraciones guardadas antes de esta función, así que las oportunidades
-- existentes quedan automáticamente en el embudo correcto.
alter table public.deals
    add column if not exists pipeline text not null default 'ventas';
