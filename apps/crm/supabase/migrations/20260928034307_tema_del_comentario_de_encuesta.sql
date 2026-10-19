-- Tema del comentario de la encuesta de satisfacción.
--
-- La nota del 1 al 5 dice que algo va mal; el comentario dice qué, y nadie
-- lee trescientos comentarios al mes. Con el tema clasificado, el informe de
-- soporte responde la pregunta que importa —«de qué se queja la gente»— en
-- una gráfica, y deja de ser una media sin explicación.
--
-- `satisfaction_followup` es aparte de la nota a propósito: un cliente puede
-- poner un 4 y seguir con algo sin resolver, y ese es justo el que se pierde
-- porque la nota no lo delata.
alter table crm.tickets
    add column if not exists satisfaction_topic text,
    add column if not exists satisfaction_followup boolean;

-- Para el informe: los tickets de una organización con encuesta y tema.
create index if not exists tickets_satisfaction_topic_idx
    on crm.tickets (organization_id, satisfaction_topic)
    where satisfaction_topic is not null;
