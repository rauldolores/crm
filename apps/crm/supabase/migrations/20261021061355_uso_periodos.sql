-- Uso del cliente: también los límites que no son del mes.
--
-- KontrolIA Auth manda en snapshot.usage el periodo de cada límite (month,
-- year, lifetime…) y si es el que corre ahora (current). La primera versión
-- (20261021060814_uso_y_riesgo) guardaba solo meses: los límites de "total"
-- (usuarios, pipelines, bots, almacenamiento) se borraban al limpiar lo
-- anterior al mes pasado. Ahora:
--   · period    = tipo de periodo (month por omisión).
--   · is_current = es el periodo en curso (el mes anterior va en false).
--   · La integración toma la foto como la verdad completa: guarda lo que
--     trae y quita lo que ya no viene.
--
-- New Tables: ninguna. Columnas nuevas en crm.customer_usage.
-- Security (RLS + policies): sin cambios (solo lectura para la organización).
-- Activities and Permissions: sin cambios.

alter table crm.customer_usage
    add column if not exists period text not null default 'month',
    add column if not exists is_current boolean not null default true;

-- Lo ya guardado son meses: el más reciente de cada empresa es el actual.
update crm.customer_usage u
   set is_current = (u.period_start = m.ultimo)
  from (select company_id, max(period_start) as ultimo
          from crm.customer_usage group by company_id) m
 where m.company_id = u.company_id;
