```yaml
product: Vinqulia
category: producto
audience: comercial
priority: alta
source: sitio oficial vinqulia.com + producto verificado
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Descripción del producto

## Qué es

**HECHO.** Vinqulia es un CRM (sistema de gestión de relación con clientes) que centraliza contactos, empresas, oportunidades, tareas y comunicación comercial (WhatsApp, correo, formularios web) en un solo sistema. Forma parte del ecosistema tecnológico de **Kontrolia**.

## Para quién es

**HECHO.** Vinqulia está pensado para pymes y equipos comerciales — la web lo posiciona explícitamente para equipos de aproximadamente 2 a 50 personas —, aunque la arquitectura (multi-organización, roles y permisos) permite crecer hacia equipos y organizaciones más grandes.

Perfiles típicos:
- Empresas B2B con equipo comercial (vendedores internos y/o externos).
- Empresas que reciben prospectos por WhatsApp o desde su sitio web.
- Empresas que hoy gestionan ventas en Excel.
- Empresas que usan un CRM que sienten demasiado rígido, complejo o caro para lo que necesitan.
- Empresas que necesitan controlar dónde viven sus datos (infraestructura propia).

## Qué problema resuelve

**HECHO.** Vinqulia convierte una operación comercial dispersa — Excel individual por vendedor, WhatsApp personal, correos sueltos, seguimientos que dependen de la memoria — en un proceso comercial centralizado, visible, medible y automatizable.

## Propuesta de valor

**RECOMENDACIÓN COMERCIAL — frase base:**
> "Vinqulia centraliza clientes, oportunidades, seguimiento y comunicación en un CRM que se adapta a la forma en que trabaja tu empresa."

**RECOMENDACIÓN COMERCIAL — variante:**
> "Vinqulia convierte una operación comercial dispersa en un proceso centralizado, medible y automatizado."

La idea central que debe transmitir cualquier explicación: **el proceso comercial deja de vivir en la memoria de cada vendedor y pasa a pertenecer a la empresa.**

## Principales capacidades

**HECHO** (ver `02_funcionalidades.md` para el detalle de cada una):
- Contactos, empresas y oportunidades con historial completo.
- Pipeline Kanban con varios embudos y etapas configurables.
- Tareas con responsable y vencimiento.
- Notas y actividades tipadas (llamada, reunión, correo, WhatsApp…).
- WhatsApp real (Twilio) y correo (Postmark) integrados en la ficha del contacto.
- Formularios web públicos (enlace o iframe) para captar leads, con anti-bot.
- Automatizaciones por regla (disparador → acción).
- Informes de conversión, cierre por vendedor y motivos de pérdida.
- Vistas guardadas y compartidas.
- Etiquetas (tags) y campos personalizados por tipo de registro.
- Tickets de soporte ligados a contacto/empresa.
- Importación desde CSV/JSON con detección de duplicados.
- API REST completa, webhooks firmados (HMAC) y claves de API para integraciones externas.
- Servidor MCP: un asistente de IA (Claude, ChatGPT, u otro compatible) puede consultar y modificar los datos del CRM por instrucciones en lenguaje natural, con los mismos permisos que un usuario real.
- Puntaje de interés (lead scoring) automático por contacto (caliente/tibio/frío).
- Interfaz táctil para móvil.
- Multi-organización, roles, permisos y SSO (Google, Azure, Keycloak, Auth0) vía KontrolIA Auth.

## Cómo funciona conceptualmente

**HECHO.** Un visitante o prospecto entra por un canal (formulario web, WhatsApp, correo, o alta manual) → se crea o enriquece un contacto → el contacto se asocia a una empresa y a una oportunidad dentro de un pipeline → las automatizaciones generan tareas de seguimiento → el vendedor gestiona la oportunidad hasta ganarla o perderla (con motivo) → la dirección mide el resultado con informes.

## Qué tipo de empresas pueden utilizarlo

**HECHO**, tal como lo posiciona la web:
- Pymes y empresas B2B.
- Empresas con vendedores internos y/o externos.
- Empresas que reciben leads desde su web o por WhatsApp.
- Empresas que hoy usan Excel o un CRM que no les funciona.
- Empresas con necesidad de integrar el CRM a sistemas propios.
- Empresas con requisitos de control sobre dónde se alojan sus datos.

## Perfil de cliente ideal

**RECOMENDACIÓN COMERCIAL.** Una empresa con un proceso comercial real (no solo "vender lo que llegue") que necesita más control, visibilidad y consistencia sobre sus ventas — típicamente entre 2 y 50 personas en el equipo comercial, aunque el sistema no tiene ese límite como tope técnico documentado.

## Perfil de comprador

Ver desarrollo completo por rol en las secciones siguientes de este documento y en `05_discovery-preguntas.md`. Roles típicos: dirección comercial, dirección general / dueño de pyme, vendedor, TI.

## Diferenciadores

**HECHO**, ver `07_competidores.md` para el desarrollo comparativo:
1. Se adapta al proceso del cliente (embudos, etapas, campos, moneda, marca configurables sin tocar código) — no al revés.
2. Puede instalarse en infraestructura propia, no solo como SaaS gestionado.
3. Comunicación integrada: WhatsApp, correo y formularios en el mismo historial.
4. Automatización nativa por reglas, aplicada a nivel de base de datos (funciona sin importar por dónde entró el dato: app, API o importación).
5. API REST, webhooks firmados y un servidor MCP para que agentes de IA operen el CRM directamente.
6. Puede evolucionar hacia automatización avanzada, integraciones a medida y agentes de IA dentro del ecosistema Kontrolia, sin cambiar de proveedor.
7. Migración asistida desde Excel u otro CRM, con detección de duplicados.

## Modalidades

**HECHO** — tres formas de adquirirlo, ver detalle en `10_precios-y-planes.md` y `04_playbook-ventas.md`:
1. **Vinqulia**: el sistema completo, para que el cliente lo configure.
2. **Vinqulia + Implementación**: Kontrolia configura, migra datos y capacita al equipo.
3. **Vinqulia + Automatización e IA**: expansión con procesos a medida, integraciones y agentes.

## Implementación

**HECHO**, a grandes rasgos (sin plazos ni precios, que son `[REQUIERE CONFIRMACIÓN INTERNA]`): entender el proceso actual → configurar pipeline y campos → migrar datos → configurar usuarios/roles/permisos → capacitar al equipo → poner en marcha → ajustar con el uso real.

## Integraciones

**HECHO.** WhatsApp (Twilio), correo (Postmark, con reply-to inteligente y captura de correo entrante), formularios web propios, KontrolIA Auth (usuarios/roles/SSO), API REST + webhooks + claves de API, servidor MCP para agentes de IA, importación CSV/JSON. Integraciones a medida con ERP, facturación u otros sistemas: **[REQUIERE CONFIRMACIÓN INTERNA]** caso por caso — la web nunca afirma una integración nativa con un sistema específico (SAP, un ERP concreto, etc.); ofrece API/webhooks y desarrollo a medida vía Kontrolia.

## Automatización

**HECHO.** Motor de reglas "cuando pase X, haz Y": disparadores (contacto creado, oportunidad creada, cambio de etapa) → acciones (crear tarea con vencimiento, asignar responsable). Se ejecuta a nivel de base de datos, así que aplica sin importar el canal de entrada del dato.

## IA

**HECHO, con dos niveles que no deben mezclarse:**
1. **Ya incluido en Vinqulia**: automatizaciones por regla (no son "IA generativa", son reglas deterministas) y un **servidor MCP** que permite a un asistente de IA externo (Claude, ChatGPT u otro compatible con el protocolo MCP) leer y escribir datos del CRM mediante lenguaje natural, con autenticación OAuth y los mismos permisos que tendría el usuario que lo conectó.
2. **Vía ecosistema Kontrolia** (modalidad "Vinqulia + Automatización e IA"): agentes inteligentes, seguimiento automático y procesos a medida — esto se contrata como expansión, no viene incluido de fábrica.

## Infraestructura

**HECHO.** Usa Supabase (PostgreSQL gestionado) como motor de datos, con autenticación, almacenamiento, API y control de acceso. No inventar certificaciones de seguridad ni cumplimiento normativo: **[REQUIERE CONFIRMACIÓN INTERNA]**.

## Despliegue

**HECHO.** Dos modalidades: servicio gestionado por Kontrolia, o instalación en infraestructura propia del cliente. La decisión de dónde vive la información es del cliente.

## Ecosistema Kontrolia

**HECHO.** Vinqulia resuelve la operación comercial; Kontrolia puede llevarla más lejos con automatización de procesos, integraciones a medida, agentes de IA y desarrollo de software personalizado — como una evolución, no como un cambio de proveedor.

---

## Resumen de 10 segundos

**RECOMENDACIÓN COMERCIAL.**
> "Vinqulia es el CRM que centraliza tus ventas — contactos, oportunidades, WhatsApp y seguimiento — y se adapta a cómo trabaja tu empresa."

## Resumen de 30 segundos

**RECOMENDACIÓN COMERCIAL.**
> "Vinqulia centraliza toda tu operación comercial: contactos, empresas, oportunidades, tareas, WhatsApp, correo y formularios, en un pipeline que puedes automatizar y medir. Puedes migrar desde Excel u otro CRM, y si lo necesitas, instalarlo en tu propia infraestructura o conectarlo con tus sistemas."

## Resumen de 1 minuto

**RECOMENDACIÓN COMERCIAL.**
> "Vinqulia es un CRM para pymes y equipos comerciales que reemplaza la mezcla de Excel, WhatsApp personal, correos sueltos y memoria de cada vendedor por un proceso comercial centralizado. Cada contacto, empresa y oportunidad vive en un solo lugar, con su historial completo. El pipeline es un Kanban con varios embudos posibles, las tareas evitan que se pierda un seguimiento, y las automatizaciones ejecutan reglas de negocio solas — 'cuando se crea una oportunidad, crea una tarea de seguimiento en un día', por ejemplo. WhatsApp y correo se gestionan desde la misma ficha del contacto, y los formularios de tu web crean contactos automáticamente. Cuando necesitas conectarlo con otros sistemas, tiene API REST, webhooks firmados y hasta un servidor para que un asistente de IA lo opere directamente. Puede funcionar como servicio gestionado por Kontrolia o instalarse en tu propia infraestructura si tus políticas lo requieren. Y si más adelante quieres ir más allá del CRM —automatización avanzada, integraciones a medida, agentes de IA—, todo eso vive dentro del mismo ecosistema Kontrolia, sin cambiar de proveedor."

## Explicación para director general

**RECOMENDACIÓN COMERCIAL.**
> "Vinqulia le da a la dirección visibilidad real del pipeline sin depender de que cada vendedor actualice una hoja. Sabes qué hay abierto, cuánto vale, quién es responsable y dónde se está perdiendo. El objetivo no es tener 'otro sistema' sino que la operación comercial deje de depender de la memoria de las personas."

## Explicación para director comercial

**RECOMENDACIÓN COMERCIAL.**
> "Tienes en un solo tablero todas las oportunidades, su etapa y su valor. Puedes automatizar el seguimiento para que no dependa de que cada vendedor se acuerde, y medir conversión, cierre por vendedor y motivos de pérdida sin pedir reportes manuales."

## Explicación para vendedor

**RECOMENDACIÓN COMERCIAL.**
> "Tienes tus oportunidades, tus tareas y tus próximos seguimientos en un solo lugar, y puedes escribirle a tu contacto por WhatsApp o correo sin salir del CRM — la conversación queda guardada sola."

## Explicación para TI

**RECOMENDACIÓN COMERCIAL.**
> "Vinqulia puede correr como servicio gestionado o desplegarse en infraestructura propia. Tiene API REST completa, webhooks firmados con HMAC, claves de API para integraciones externas y un servidor MCP para conectar agentes de IA. La autenticación, roles y SSO (Google, Azure, Keycloak, Auth0) los resuelve KontrolIA Auth, no hay que construirlos aparte."

## Explicación para una pyme

**RECOMENDACIÓN COMERCIAL.**
> "Si hoy manejas tus ventas en Excel y WhatsApp, Vinqulia te da una estructura ordenada sin obligarte a un sistema gigante y complicado. Empiezas con lo que necesitas — el CRM solo — y si más adelante quieres implementación guiada, automatización o IA, lo agregas sin cambiar de proveedor."
