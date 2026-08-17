# Idiomas en el repositorio

Kontrolia CRM es un producto **en español**. Esta regla define qué se
escribe en español y qué se mantiene en inglés.

## En español

- **Interfaz**: todos los textos que ve el usuario, en los catálogos
  `spanishCrmMessages.ts` y `spanishCoreMessages.ts`.
- **Correos y plantillas**: asuntos y cuerpos de `supabase/templates/`.
- **Documentación del proyecto**: `README.md`, `CLAUDE.md`, `AGENTS.md`,
  `docs/`, y las reglas y skills de `.claude/`.
- **Comentarios y docstrings** del código.
- **Mensajes de commit**, títulos y descripciones de Pull Request.
- **CLI de instalación**: preguntas, mensajes de progreso y errores.

No hay selector de idioma ni catálogos alternativos: solo se registra el
locale `es`. Añadir otro idioma es una decisión de producto, no una tarea
de implementación.

## En inglés

El **código sigue en inglés**, que es el estándar del ecosistema y evita
lo peor de los dos mundos (identificadores mitad en un idioma, mitad en
otro):

- Nombres de variables, funciones, clases, componentes y tipos.
- Nombres de tablas, columnas, vistas y funciones de base de datos.
- Claves de configuración (JSON / YAML) y claves de traducción
  (`resources.contacts.fields.first_name`).
- Los `value` de las listas de `defaultConfiguration.ts`. Solo se traduce
  el `label`: el `value` se guarda en la base de datos y cambiarlo
  obligaría a migrar los datos existentes.

## Valores de datos

Un valor de datos en tiempo de ejecución que refleja el dominio del
usuario (el sector `"panadería"`, una entidad `"factura"`) va en español,
como es natural.

## Comprobación antes de `Write` / `Edit` / `git commit`

1. ¿Es texto que verá una persona? Debe estar en español, con acentos y
   signos de apertura (`¿`, `¡`) correctos.
2. ¿Es un identificador o una clave? Debe estar en inglés.
3. ¿Es un `value` de configuración o de base de datos? No se traduce.
