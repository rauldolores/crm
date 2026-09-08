-- Diseño de las plantillas de correo.
--
-- El contenido que produce el editor es HTML semántico y, tal cual, llega al
-- destinatario como un documento sin formato. El armazón del correo (tablas
-- y estilos en línea, lo único que respetan Outlook y Gmail) lo aplica
-- plantillaBase.ts al enviar; estas columnas son lo que ese armazón necesita
-- y que el usuario decide por plantilla.
--
-- El botón va aparte y no dentro del HTML a propósito: en el editor sería un
-- enlace normal que cualquier retoque rompería, y así se puede pintar como
-- botón de verdad, con tabla y bgcolor, que es como sobrevive en Outlook.

alter table crm.email_templates
    add column if not exists accent_color text,
    add column if not exists cta_text text,
    add column if not exists cta_url text,
    add column if not exists footer_text text;
