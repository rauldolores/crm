-- El disparador que rellena `sales_id` buscaba la ficha de comercial solo por
-- usuario. Una misma persona puede tener ficha en varias organizaciones, y
-- `SELECT INTO` con varias filas se queda con una cualquiera: la fila podia
-- acabar firmada por el comercial de otro inquilino. Se acota por
-- organizacion, que la hace unica y determinista.
--
-- No arregla el otro flanco: cuando la escritura llega por el puente /api con
-- la clave de servicio no hay JWT de usuario, `auth.uid()` es NULL y aqui no
-- hay nada que buscar. Eso lo rellena el propio puente antes de reenviar
-- (app/api/datos/[...ruta]/route.ts).

CREATE OR REPLACE FUNCTION "crm"."set_sales_id_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'crm'
    AS $$
BEGIN
  IF NEW.sales_id IS NULL THEN
    SELECT id INTO NEW.sales_id
      FROM sales
     WHERE user_id = auth.uid()
       AND organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$;
