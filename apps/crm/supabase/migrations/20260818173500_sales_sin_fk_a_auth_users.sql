-- La identidad vive en KontrolIA Auth, que es un proyecto Supabase distinto
-- del de los datos del CRM: el auth.users local ya no contiene a los usuarios,
-- así que esta clave foránea rechazaba cualquier alta de ficha de comercial
-- («insert or update on table "sales" violates foreign key constraint»).
-- user_id pasa a ser un identificador opaco emitido por KontrolIA Auth, cuya
-- validez garantiza el servidor al validar el token, no la base.
alter table public.sales drop constraint if exists sales_user_id_fkey;
