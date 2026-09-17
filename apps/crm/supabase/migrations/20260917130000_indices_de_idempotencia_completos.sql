-- Los índices parciales (where external_id is not null) no sirven para
-- ON CONFLICT desde PostgREST, que no puede indicar el predicado: cada
-- upsert de /api/clientes/* y de las cotizaciones aceptadas fallaba con
-- «no unique or exclusion constraint matching». Un índice único completo
-- da lo mismo: los external_id nulos (altas manuales) no chocan entre sí.
drop index if exists crm.contracts_source_external_uk;
drop index if exists crm.purchases_source_external_uk;
create unique index contracts_source_external_uk on crm.contracts (organization_id, source, external_id);
create unique index purchases_source_external_uk on crm.purchases (organization_id, source, external_id);
