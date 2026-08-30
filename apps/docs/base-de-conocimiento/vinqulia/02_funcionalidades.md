```yaml
product: Vinqulia
category: funcionalidades
audience: comercial
priority: alta
source: sitio oficial vinqulia.com + producto verificado
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Funcionalidades

Cada funcionalidad listada aquí es real y verificable (sitio oficial y/o producto). Ninguna se incluye "porque es habitual en un CRM": si no está aquí, no debe afirmarse.

---

## Contactos

```
Qué es: la ficha central de una persona con la que la empresa tiene o puede tener una relación comercial.
Qué permite hacer: guardar nombre, correos y teléfonos (varios de cada uno, con tipo), etiquetas, campos personalizados, notas, tareas, actividad e historial, y las oportunidades relacionadas.
Cómo funciona: se crea manualmente, por formulario web, por correo entrante, por importación, o vía API/agente de IA. Al crearse o importarse se detectan posibles duplicados.
Problema que resuelve: información de clientes dispersa en Excel, WhatsApp del vendedor y correo personal.
Beneficio empresarial: una sola fuente de verdad por contacto, accesible para todo el equipo.
Perfil de usuario que más se beneficia: cualquier equipo comercial con más de un vendedor.
Ejemplo de uso: un formulario de la web crea automáticamente el contacto con los datos que el visitante llenó.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: límite de contactos por plan — [REQUIERE CONFIRMACIÓN INTERNA].
```

## Empresas

```
Qué es: la ficha de una organización cliente o prospecto, con sus contactos y oportunidades asociadas.
Qué permite hacer: centralizar datos de la empresa (sector, sitio web, etc.) y ver de un vistazo todos sus contactos y oportunidades.
Cómo funciona: se relaciona con contactos y oportunidades por campo de referencia; también se puede crear/enriquecer desde un formulario web o vía API.
Problema que resuelve: en operaciones B2B, varios contactos de la misma empresa quedan desconectados entre sí.
Beneficio empresarial: visión consolidada del cliente-empresa, no solo del contacto individual.
Perfil de usuario que más se beneficia: empresas B2B con varios interlocutores por cuenta.
Ejemplo de uso: ver todas las oportunidades abiertas con "Grupo Nova" sin buscar contacto por contacto.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Oportunidades / Pipeline / Kanban

```
Qué es: el tablero donde vive cada negociación en curso, organizada por etapas.
Qué permite hacer: arrastrar oportunidades entre etapas, ver importe y responsable, agregar tareas y notas dentro de la misma tarjeta, y registrar el motivo cuando se pierde una.
Cómo funciona: cada etapa pertenece a un embudo (pipeline); Vinqulia soporta varios embudos con distintas etapas cada uno (por ejemplo: ventas, proyectos, recurrencia). El cambio de etapa queda en el historial.
Problema que resuelve: falta de visibilidad de "qué hay abierto, cuánto vale y en qué etapa está".
Beneficio empresarial: pipeline siempre actualizado, visible para vendedor y dirección por igual.
Perfil de usuario que más se beneficia: dirección comercial (visibilidad) y vendedores (orden del propio trabajo).
Ejemplo de uso: un embudo de "Ventas nuevas" con etapas Nueva → Propuesta enviada → En negociación → Ganada/Perdida.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: número máximo de embudos o etapas — [REQUIERE CONFIRMACIÓN INTERNA].
```

## Embudos múltiples

```
Qué es: la posibilidad de tener más de un proceso comercial, cada uno con sus propias etapas.
Qué permite hacer: separar, por ejemplo, ventas nuevas de renovaciones o de proyectos, cada uno con su propio Kanban.
Cómo funciona: se configuran desde Ajustes, sin tocar código; cada oportunidad pertenece a un embudo.
Problema que resuelve: forzar un único proceso de ventas cuando la empresa en realidad tiene varios (nuevo negocio vs. recurrencia, por ejemplo).
Beneficio empresarial: cada tipo de venta se mide con sus propias etapas y motivos de pérdida.
Perfil de usuario que más se beneficia: empresas con más de un modelo comercial (venta nueva + renovación, por ejemplo).
Ejemplo de uso: un embudo "Distribuidores" con etapas distintas al embudo "Ventas directas".
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Tareas

```
Qué es: una acción pendiente con responsable, tipo y fecha de vencimiento.
Qué permite hacer: asignar seguimiento concreto a un contacto o una oportunidad.
Cómo funciona: se crea manualmente o automáticamente por una regla de automatización; puede quedar asociada a un contacto y/o a una oportunidad.
Problema que resuelve: seguimientos que se pierden porque dependían de que alguien se acordara.
Beneficio empresarial: ninguna oportunidad debería enfriarse solo por falta de memoria.
Perfil de usuario que más se beneficia: vendedores y su dirección.
Ejemplo de uso: "Llamar en 3 días" creada automáticamente al dar de alta un contacto nuevo.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Notas y actividades tipadas

```
Qué es: el registro de interacciones (llamada, reunión, correo, WhatsApp, nota libre) asociado a un contacto o una oportunidad.
Qué permite hacer: reconstruir la relación comercial completa con un cliente sin preguntarle al vendedor.
Cómo funciona: se agregan manualmente o quedan generadas automáticamente por canales integrados (WhatsApp, correo, formularios).
Problema que resuelve: historial del cliente que solo existe en la cabeza (o el WhatsApp personal) del vendedor.
Beneficio empresarial: continuidad del seguimiento aunque cambie quien lo atiende.
Perfil de usuario que más se beneficia: equipos con rotación o con más de un vendedor por cuenta.
Ejemplo de uso: una llamada registrada como nota tipo "llamada" con fecha y responsable.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## WhatsApp (vía Twilio)

```
Qué es: integración de mensajería WhatsApp dentro de la ficha del contacto.
Qué permite hacer: enviar y recibir mensajes reales de WhatsApp sin salir del CRM.
Cómo funciona: se conecta mediante una cuenta de Twilio con WhatsApp habilitado; cada mensaje queda registrado en el historial del contacto con su hora.
Problema que resuelve: conversaciones de WhatsApp que viven solo en el teléfono personal del vendedor y se pierden si cambia de empresa o de número.
Beneficio empresarial: la conversación pasa a ser propiedad de la empresa, no del vendedor.
Perfil de usuario que más se beneficia: empresas que reciben la mayoría de sus prospectos por WhatsApp.
Ejemplo de uso: responder a Ana García por WhatsApp desde su ficha; la respuesta de Ana queda archivada ahí mismo.
Limitaciones conocidas: requiere una cuenta de Twilio con WhatsApp habilitado configurada por el cliente (sandbox o número verificado); no es un número de WhatsApp Business incluido gratis en Vinqulia.
Información que requiere confirmación: ninguna relevante — no afirmar que el número/cuenta de WhatsApp viene incluido si el cliente no lo tiene.
```

## Correo electrónico (vía Postmark)

```
Qué es: envío y captura de correo electrónico desde la ficha del contacto.
Qué permite hacer: mandar un correo real al contacto y que su respuesta se archive sola en la ficha correcta (reply-to inteligente); también capturar correo entrante (por copia al buzón de Vinqulia) como nota.
Cómo funciona: requiere un token de envío de Postmark y un remitente verificado, configurados por el cliente.
Problema que resuelve: historial de correo disperso entre las bandejas personales de cada vendedor.
Beneficio empresarial: el hilo de correo con un cliente queda completo y centralizado, sin copiar y pegar.
Perfil de usuario que más se beneficia: equipos que negocian por correo (propuestas, condiciones).
Ejemplo de uso: enviar una propuesta comercial por correo desde la ficha de la empresa; la respuesta del cliente se archiva sola.
Limitaciones conocidas: sin la cuenta de Postmark configurada, el botón de enviar correo queda deshabilitado.
Información que requiere confirmación: ninguna relevante.
```

## Formularios web públicos

```
Qué es: un formulario de captación (enlace o iframe embebible) que un visitante llena desde el sitio del cliente.
Qué permite hacer: crear un contacto (o, según el tipo de formulario, un ticket) sin que nadie lo teclee a mano.
Cómo funciona: se genera desde Vinqulia, se copia el enlace o el código de iframe y se pega en la web del cliente; incluye protección anti-bot (señuelo) y un límite de envíos por formulario para evitar abuso.
Problema que resuelve: leads que llegan por un formulario externo y después alguien tiene que copiarlos a mano al CRM.
Beneficio empresarial: cero fricción entre "alguien llenó el formulario" y "existe el contacto en el CRM".
Perfil de usuario que más se beneficia: empresas que reciben leads desde su propio sitio web.
Ejemplo de uso: un formulario "Contáctanos" en la web del cliente que crea el contacto automáticamente.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Automatizaciones

```
Qué es: un motor de reglas del tipo "cuando pase X, haz Y".
Qué permite hacer: crear tareas o asignar responsables automáticamente ante eventos comerciales.
Cómo funciona: se define un disparador (contacto creado, oportunidad creada, cambio de etapa) y una acción (crear tarea con vencimiento, asignar responsable). La regla se aplica a nivel de base de datos, así que funciona sin importar si el dato entró por la aplicación, por la API o por importación.
Problema que resuelve: seguimiento que depende de que alguien recuerde hacerlo.
Beneficio empresarial: consistencia de proceso entre vendedores, sin depender de la disciplina individual.
Perfil de usuario que más se beneficia: equipos con más de un vendedor y procesos que se quieren estandarizar.
Ejemplo de uso: "Cuando se crea una oportunidad → crear tarea 'Enviar propuesta' en 1 día."
Limitaciones conocidas: disparadores y acciones documentados públicamente son los listados arriba (no hay evidencia pública de un catálogo más amplio).
Información que requiere confirmación: catálogo completo de disparadores/acciones adicionales — [REQUIERE CONFIRMACIÓN INTERNA].
```

## Informes

```
Qué es: métricas del pipeline y del equipo comercial.
Qué permite hacer: ver conversión, cierre por vendedor, motivos de pérdida y valor del pipeline sin pedir reportes manuales.
Cómo funciona: se calculan sobre los datos ya cargados en contactos, oportunidades y tareas.
Problema que resuelve: la dirección depende de que cada vendedor actualice una hoja para saber "cómo vamos".
Beneficio empresarial: decisiones comerciales basadas en datos reales, no en percepciones.
Perfil de usuario que más se beneficia: dirección comercial.
Ejemplo de uso: ver la tasa de conversión del trimestre y cuántas oportunidades se ganaron.
Limitaciones conocidas: no es una herramienta de BI avanzada — no venderla como tal.
Información que requiere confirmación: catálogo completo de informes disponibles — [REQUIERE CONFIRMACIÓN INTERNA].
```

## Vistas guardadas

```
Qué es: filtros de lista guardados y compartibles con el equipo.
Qué permite hacer: que todo el equipo filtre "igual" — por ejemplo, "mis oportunidades abiertas" o "leads nuevos" — sin reconstruir el filtro cada vez.
Cómo funciona: se guarda una combinación de filtro y orden sobre un listado (contactos, oportunidades, etc.).
Problema que resuelve: cada persona filtrando distinto y comparando cosas que no son iguales.
Beneficio empresarial: consistencia de criterio dentro del equipo.
Perfil de usuario que más se beneficia: equipos con procesos de revisión periódica (pipeline review semanal, por ejemplo).
Ejemplo de uso: una vista compartida "Oportunidades sin seguimiento en 15 días".
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Etiquetas (tags)

```
Qué es: marcas de color y nombre libre para clasificar contactos.
Qué permite hacer: segmentar sin crear un campo nuevo — por ejemplo, "Cliente VIP" o "Reactivar".
Cómo funciona: se crean con nombre y color, y se asignan a uno o varios contactos.
Problema que resuelve: necesidad de segmentación rápida y visual que no amerita un campo estructurado.
Beneficio empresarial: filtrado y priorización visual inmediata.
Perfil de usuario que más se beneficia: equipos que segmentan su cartera con frecuencia.
Ejemplo de uso: etiquetar como "Cliente VIP" a las cuentas de mayor valor.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Tickets de soporte

```
Qué es: un registro de incidencia o solicitud de soporte, asociado a un contacto y su empresa.
Qué permite hacer: dar seguimiento a un problema reportado por un cliente sin mezclarlo con el pipeline de ventas.
Cómo funciona: se crea manualmente, o mediante un formulario web público de tipo "ticket" (a diferencia del de tipo "lead", que crea un contacto).
Problema que resuelve: reportes de soporte que se pierden entre correos y WhatsApp sin quedar registrados.
Beneficio empresarial: trazabilidad de las solicitudes de soporte por cliente.
Perfil de usuario que más se beneficia: empresas que dan tanto venta como soporte postventa dentro del mismo equipo.
Ejemplo de uso: un formulario de "Reportar un problema" en la web del cliente que abre el ticket directamente.
Limitaciones conocidas: no es un sistema de mesa de ayuda (helpdesk) completo con SLA — es un registro estructurado de incidencias.
Información que requiere confirmación: ninguna relevante.
```

## Campos personalizados

```
Qué es: campos adicionales, específicos de cada organización, en contactos, empresas y oportunidades.
Qué permite hacer: guardar datos propios del negocio del cliente (por ejemplo, "superficie" en una inmobiliaria, o "grado" en una escuela) sin pedir desarrollo.
Cómo funciona: se definen desde Ajustes — tipo texto, número, fecha, lista o casilla — y aparecen en la ficha correspondiente; no requieren tocar código ni migraciones.
Problema que resuelve: cada negocio tiene datos propios que un CRM genérico no contempla de fábrica.
Beneficio empresarial: el CRM se adapta al vocabulario y a los datos reales del negocio del cliente.
Perfil de usuario que más se beneficia: empresas con un proceso o sector con datos particulares.
Ejemplo de uso: un campo "Número de sucursales" en la ficha de empresa para un cliente de retail.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Importación (CSV / JSON)

```
Qué es: carga masiva de contactos, empresas y oportunidades desde archivo.
Qué permite hacer: migrar información existente sin capturarla a mano.
Cómo funciona: se sube un archivo CSV o JSON; el sistema detecta posibles duplicados durante la importación.
Problema que resuelve: el miedo a "empezar de cero" al cambiar de sistema.
Beneficio empresarial: continuidad del historial comercial al migrar.
Perfil de usuario que más se beneficia: empresas que vienen de Excel o de otro CRM.
Ejemplo de uso: importar 1,240 contactos, 186 empresas y 74 oportunidades desde un CSV exportado del sistema anterior.
Limitaciones conocidas: ninguna documentada públicamente sobre volumen máximo.
Información que requiere confirmación: límite de filas por importación — [REQUIERE CONFIRMACIÓN INTERNA].
```

## Exportación

```
Qué es: capacidad de sacar datos de Vinqulia hacia un archivo.
Qué permite hacer: usar la información fuera del sistema cuando haga falta.
Cómo funciona: [REQUIERE CONFIRMACIÓN INTERNA] — el sitio oficial no detalla formatos ni alcance de exportación; sí se documenta explícitamente la importación (CSV/JSON).
Problema que resuelve: —
Beneficio empresarial: —
Perfil de usuario que más se beneficia: —
Ejemplo de uso: —
Limitaciones conocidas: —
Información que requiere confirmación: alcance y formato de la exportación — [REQUIERE CONFIRMACIÓN INTERNA].
```

## Usuarios, roles y permisos

```
Qué es: gestión de quién entra al CRM y qué puede hacer.
Qué permite hacer: dar de alta usuarios dentro de una organización, con rol de administrador o miembro.
Cómo funciona: lo resuelve KontrolIA Auth (inicio de sesión, usuarios, organizaciones, roles, permisos), no una capa aparte dentro de Vinqulia.
Problema que resuelve: control de acceso y crecimiento del equipo sin construir un sistema de usuarios propio.
Beneficio empresarial: administración de acceso centralizada y consistente en todo el ecosistema Kontrolia.
Perfil de usuario que más se beneficia: empresas que crecen en número de usuarios u organizaciones.
Ejemplo de uso: dar de alta a un nuevo vendedor con acceso de miembro, sin permisos de administración.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: catálogo completo de roles/permisos granulares — [REQUIERE CONFIRMACIÓN INTERNA].
```

## SSO (inicio de sesión único)

```
Qué es: inicio de sesión con la identidad corporativa del cliente.
Qué permite hacer: entrar a Vinqulia sin crear una contraseña aparte.
Cómo funciona: vía KontrolIA Auth, con soporte de Google, Azure, Keycloak y Auth0.
Problema que resuelve: gestión de contraseñas y accesos duplicados entre sistemas.
Beneficio empresarial: cumple políticas de identidad corporativa (IT) sin desarrollo adicional.
Perfil de usuario que más se beneficia: empresas con requisitos de TI sobre identidad centralizada.
Ejemplo de uso: iniciar sesión en Vinqulia con la cuenta de Google corporativa de la empresa.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Personalización (marca, moneda, sectores)

```
Qué es: ajuste visual y de configuración del CRM a la identidad y operación del cliente.
Qué permite hacer: cambiar logo, título, moneda, sectores de empresa, categorías, etapas y campos, sin tocar código.
Cómo funciona: desde la pantalla de Ajustes, dentro de la propia aplicación.
Problema que resuelve: sentir que se está usando "el CRM de otra empresa" en vez de un sistema propio.
Beneficio empresarial: adopción más natural por parte del equipo.
Perfil de usuario que más se beneficia: cualquier cliente, especialmente los que ya rechazaron un CRM "genérico" antes.
Ejemplo de uso: configurar la moneda en pesos mexicanos y los sectores de empresa propios del cliente.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## API REST

```
Qué es: interfaz para leer y escribir datos de Vinqulia desde otro sistema.
Qué permite hacer: conectar Vinqulia con un ERP, un sistema de facturación, una web, u otro sistema propio.
Cómo funciona: API REST completa sobre los mismos recursos que usa la aplicación (contactos, empresas, oportunidades, tareas, notas, tickets, etiquetas...), autenticada con el token de sesión o con una clave de API.
Problema que resuelve: la necesidad de mover datos entre Vinqulia y otros sistemas de la empresa.
Beneficio empresarial: Vinqulia se integra al ecosistema tecnológico existente en vez de exigir reemplazarlo.
Perfil de usuario que más se beneficia: TI y empresas con sistemas propios que necesitan sincronizar datos.
Ejemplo de uso: un sistema de facturación que consulta la ficha de una empresa antes de generar una factura.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: límites de uso (rate limiting) — [REQUIERE CONFIRMACIÓN INTERNA].
```

## Claves de API

```
Qué es: credenciales para que un sistema externo use la API sin que un humano inicie sesión.
Qué permite hacer: que un formulario propio, un bot o un backend cree o gestione datos en Vinqulia de forma autónoma.
Cómo funciona: un administrador crea la clave desde Ajustes; se muestra una única vez al crearla y da acceso equivalente al de una sesión normal.
Problema que resuelve: integraciones servidor-a-servidor que no pueden pasar por un login interactivo.
Beneficio empresarial: automatizar la creación de contactos/leads desde sistemas externos sin intervención manual.
Perfil de usuario que más se beneficia: empresas con su propio sitio web, bot o sistema que necesita alimentar el CRM.
Ejemplo de uso: un formulario de calificación en la web de la empresa que crea el contacto y la oportunidad directamente en Vinqulia.
Limitaciones conocidas: solo un administrador puede crear o revocar claves, por tratarse de un acceso tan sensible como el de un usuario más.
Información que requiere confirmación: ninguna relevante.
```

## Webhooks

```
Qué es: avisos automáticos hacia un sistema externo cuando ocurre un evento en Vinqulia.
Qué permite hacer: enterarse en tiempo real cuando se crea, actualiza o elimina un contacto, empresa, oportunidad, tarea, nota o ticket.
Cómo funciona: se registra una URL propia; cada aviso llega firmado con HMAC-SHA256 para verificar que es legítimo.
Problema que resuelve: la necesidad de reaccionar a eventos del CRM desde otro sistema sin tener que preguntar (polling) constantemente.
Beneficio empresarial: integraciones en tiempo real con herramientas como n8n, Zapier, Make o un servidor propio.
Perfil de usuario que más se beneficia: TI y equipos que ya automatizan procesos con herramientas externas.
Ejemplo de uso: un webhook que notifica a un sistema de facturación cada vez que una oportunidad se marca como ganada.
Limitaciones conocidas: ninguna documentada públicamente.
Información que requiere confirmación: ninguna relevante.
```

## Servidor MCP (agentes de IA)

```
Qué es: un servidor que expone Vinqulia al protocolo MCP (Model Context Protocol), para que un asistente de IA lo use como herramienta.
Qué permite hacer: que un asistente como Claude o ChatGPT consulte y modifique datos del CRM (crear un contacto, buscar oportunidades, marcar una tarea como hecha) directamente desde una conversación en lenguaje natural.
Cómo funciona: el asistente se conecta vía OAuth (el mismo inicio de sesión de KontrolIA Auth) y opera con exactamente los mismos permisos que tendría esa persona dentro de Vinqulia — no hay un camino de acceso paralelo ni más amplio.
Problema que resuelve: la necesidad de "hablarle" a los datos del CRM en vez de navegar pantallas, y la de conectar Vinqulia con asistentes de IA de terceros.
Beneficio empresarial: reduce la fricción de uso y abre la puerta a automatizaciones conversacionales sin desarrollo a medida.
Perfil de usuario que más se beneficia: equipos que ya usan un asistente de IA en su día a día y quieren que también opere el CRM.
Ejemplo de uso: pedirle a Claude "muéstrame las oportunidades que cierran este mes por más de $10,000" y que la respuesta venga de datos reales del CRM.
Limitaciones conocidas: requiere que el cliente conecte su propio asistente de IA compatible con MCP; no es un chatbot incluido dentro de Vinqulia.
Información que requiere confirmación: ninguna relevante.
```

## Puntaje de interés (lead scoring)

```
Qué es: un puntaje de 0 a 100 calculado automáticamente por contacto, con una banda visual (caliente / tibio / frío).
Qué permite hacer: priorizar a qué contacto atender primero sin revisarlos uno por uno.
Cómo funciona: combina recencia de actividad, volumen de interacciones (notas y tareas completadas) y si el contacto tiene una oportunidad activa; se recalcula solo, sin configuración manual.
Problema que resuelve: decidir a quién llamar primero cuando hay muchos contactos y poco tiempo.
Beneficio empresarial: enfocar el esfuerzo comercial en los contactos con mayor probabilidad de conversión.
Perfil de usuario que más se beneficia: vendedores con carteras grandes y equipos con muchos leads entrantes.
Ejemplo de uso: ordenar la lista de contactos por puntaje para empezar el día por los más "calientes".
Limitaciones conocidas: las bandas (caliente/tibio/frío) son fijas por ahora, no configurables por organización.
Información que requiere confirmación: ninguna relevante.
```

## Interfaz móvil

```
Qué es: una interfaz táctil pensada para usarse desde el teléfono.
Qué permite hacer: consultar y actualizar contactos, oportunidades y tareas fuera de la oficina.
Cómo funciona: la misma aplicación se adapta al tamaño de pantalla del teléfono.
Problema que resuelve: vendedores externos que no pueden depender de estar frente a una computadora para actualizar el CRM.
Beneficio empresarial: datos actualizados en tiempo real aunque el vendedor esté en calle.
Perfil de usuario que más se beneficia: fuerza de ventas externa.
Ejemplo de uso: un vendedor registra una nota de visita desde el teléfono justo después de la reunión.
Limitaciones conocidas: no se documenta una app nativa de escritorios de aplicaciones (App Store / Google Play) — es interfaz web responsiva.
Información que requiere confirmación: existencia de app nativa — [REQUIERE CONFIRMACIÓN INTERNA].
```
