```yaml
product: Vinqulia
category: faq
audience: comercial
priority: alta
source: sitio oficial vinqulia.com (texto verbatim de apps/web/app/page.tsx) + producto verificado
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Preguntas frecuentes

Las respuestas marcadas como texto oficial provienen verbatim del sitio público vinqulia.com. El resto se construye sobre capacidades verificadas del producto; donde no hay información oficial se marca `[REQUIERE CONFIRMACIÓN INTERNA]`.

### Producto

```
PREGUNTA: ¿Qué es Vinqulia?
RESPUESTA: Vinqulia es un CRM para gestionar contactos, empresas y oportunidades de venta, con WhatsApp y correo integrados, formularios web, automatizaciones, informes y una API completa para conectarlo con otros sistemas.
INFORMACIÓN ADICIONAL: forma parte del ecosistema Kontrolia, junto a otros productos como KontrolIA Auth. Ver [[01_producto]].
CTA: ofrecer una demo para conocer el sistema con datos de ejemplo.
```

```
PREGUNTA: ¿Qué pasa si mi empresa crece?
RESPUESTA (texto oficial): "El sistema escala contigo: más usuarios, permisos, SSO y multi-organización. Y cuando necesites más que un CRM, evolucionas dentro del ecosistema Kontrolia sin cambiar de proveedor."
INFORMACIÓN ADICIONAL: el crecimiento hacia agentes de IA o procesos a medida se da como expansión dentro del ecosistema Kontrolia, no como una versión distinta de Vinqulia.
CTA: preguntar por el tamaño de equipo actual y esperado para dimensionar la propuesta.
```

### Funcionalidades

```
PREGUNTA: ¿Puedo importar mis datos?
RESPUESTA (texto oficial): "Sí, desde CSV o JSON. Durante la importación se detectan posibles duplicados para que los fusiones antes de duplicar la base."
INFORMACIÓN ADICIONAL: aplica a contactos, empresas y oportunidades. Ver [[02_funcionalidades]].
CTA: pedir un archivo de muestra del cliente para validar la importación en la demo.
```

```
PREGUNTA: ¿Vinqulia maneja tickets de soporte además de ventas?
RESPUESTA: sí, Vinqulia incluye un módulo de tickets de soporte asociado al contacto y su empresa, separado del pipeline de ventas pero conectado a la misma ficha.
INFORMACIÓN ADICIONAL: no es un sistema de mesa de ayuda con SLA — es un registro estructurado de incidencias. Ver [[02_funcionalidades]].
CTA: preguntar si el equipo del cliente maneja soporte y ventas en el mismo equipo.
```

### WhatsApp

```
PREGUNTA: ¿Puedo utilizarlo con WhatsApp?
RESPUESTA (texto oficial): "Sí. Vinqulia se integra con WhatsApp (vía Twilio) para enviar mensajes reales desde la ficha del contacto y registrar cada conversación en su historial."
INFORMACIÓN ADICIONAL: requiere que el cliente cuente con una cuenta de Twilio con WhatsApp habilitado.
CTA: preguntar si ya cuentan con una cuenta de Twilio configurada.
```

### Email

```
PREGUNTA: ¿Puedo enviar y recibir correo desde Vinqulia?
RESPUESTA: sí, mediante integración con Postmark. Se puede enviar correo desde la ficha del contacto y la respuesta del cliente se archiva sola en esa misma ficha (reply-to inteligente); también se puede capturar correo entrante.
INFORMACIÓN ADICIONAL: requiere un token de envío de Postmark y un remitente verificado, configurados por el cliente. Ver [[02_funcionalidades]].
CTA: preguntar si el cliente ya cuenta con una cuenta de Postmark o herramienta de correo transaccional equivalente.
```

### API

```
PREGUNTA: ¿Vinqulia tiene una API?
RESPUESTA: sí, una API REST completa sobre los mismos recursos de la aplicación (contactos, empresas, oportunidades, tareas, notas, tickets, etiquetas), autenticable por sesión o por clave de API.
INFORMACIÓN ADICIONAL: para integraciones autónomas (sin login humano) se usan claves de API (`vnq_...`), creadas solo por un administrador. Ver [[02_funcionalidades]].
CTA: escalar el caso de integración específico a un especialista si requiere detalle técnico. Ver [[12_escalamiento]].
```

```
PREGUNTA: ¿Vinqulia se puede conectar a un asistente de IA como Claude o ChatGPT?
RESPUESTA: sí, mediante un servidor MCP (Model Context Protocol) que expone los datos del CRM a asistentes de IA compatibles, con la misma autenticación y permisos que tendría esa persona dentro de Vinqulia.
INFORMACIÓN ADICIONAL: no es un chatbot incluido dentro de Vinqulia — el cliente conecta su propio asistente de IA. Ver [[01_producto]].
CTA: preguntar qué asistente de IA usa el cliente hoy en su operación.
```

### Integraciones

```
PREGUNTA: ¿Puedo integrarlo con otros sistemas?
RESPUESTA (texto oficial): "Sí. Cuenta con API REST completa y webhooks firmados. Si necesitas una integración a medida con tu ERP, facturación u otro sistema, el equipo de Kontrolia puede construirla."
INFORMACIÓN ADICIONAL: no se debe afirmar la existencia de un conector prearmado a un sistema específico (SAP, Salesforce, etc.) sin confirmarlo.
CTA: escalar la integración específica a un especialista. Ver [[12_escalamiento]].
```

### Migración

```
PREGUNTA: ¿Puedo migrar desde otro CRM?
RESPUESTA (texto oficial): "Sí. Importamos contactos, empresas y oportunidades, y configuramos el pipeline para que tu equipo no empiece de cero. Con la modalidad de implementación, Kontrolia se encarga de la migración completa."
INFORMACIÓN ADICIONAL: la migración autoservicio se hace por importación CSV/JSON; la migración completa asistida es parte de la modalidad de implementación.
CTA: preguntar desde qué sistema migraría y si puede exportar sus datos en CSV o JSON.
```

### Personalización

```
PREGUNTA: ¿Puedo personalizarlo?
RESPUESTA (texto oficial): "Sí. Campos personalizados, etapas y embudos, moneda, sectores y hasta la marca: la configuración se ajusta desde la propia aplicación, sin tocar código."
INFORMACIÓN ADICIONAL: para necesidades que requieran código nuevo (no solo configuración), se debe escalar. Ver [[12_escalamiento]].
CTA: preguntar qué le gustaría personalizar específicamente.
```

### Usuarios

```
PREGUNTA: ¿Cuántos usuarios soporta Vinqulia?
RESPUESTA: el sistema es multi-tenant y está pensado para crecer en número de usuarios y organizaciones, con roles de administrador y miembro gestionados vía KontrolIA Auth. El límite exacto de usuarios por plan no está publicado.
INFORMACIÓN ADICIONAL: `[REQUIERE CONFIRMACIÓN INTERNA]` — límite exacto de usuarios/plan.
CTA: preguntar cuántos usuarios tienen hoy y cuántos esperan tener en el corto plazo para cotizar correctamente.
```

```
PREGUNTA: ¿Vinqulia soporta inicio de sesión único (SSO)?
RESPUESTA: sí, vía KontrolIA Auth, con soporte de Google, Azure, Keycloak y Auth0.
INFORMACIÓN ADICIONAL: forma parte del mismo sistema de identidad que usan otros productos del ecosistema Kontrolia.
CTA: preguntar qué proveedor de identidad usa la empresa hoy.
```

### Seguridad

```
PREGUNTA: ¿Qué tan seguro es Vinqulia?
RESPUESTA: los datos viven en Supabase (PostgreSQL), con control de acceso por organización y autenticación centralizada vía KontrolIA Auth. Certificaciones específicas de cumplimiento no están confirmadas públicamente.
INFORMACIÓN ADICIONAL: `[REQUIERE CONFIRMACIÓN INTERNA]` — certificaciones (ISO, SOC2, etc.).
CTA: escalar a un especialista si el cliente tiene un requisito de cumplimiento específico. Ver [[12_escalamiento]].
```

### Infraestructura

```
PREGUNTA: ¿Puedo instalar Vinqulia en mis servidores?
RESPUESTA (texto oficial): "Sí. La aplicación puede desplegarse en infraestructura propia; lo coordinamos contigo según tu entorno y tus políticas. En el formulario de demo puedes indicar que prefieres instalación propia."
INFORMACIÓN ADICIONAL: alternativa al servicio administrado por Kontrolia.
CTA: preguntar si el requisito de infraestructura propia viene de una política interna específica.
```

```
PREGUNTA: ¿Dónde se pueden alojar mis datos?
RESPUESTA (texto oficial): "Tú eliges: servicio gestionado por Kontrolia o instalación en tu propia infraestructura. La decisión se toma según la política de tu empresa."
INFORMACIÓN ADICIONAL: ninguna adicional confirmada sobre región/país específico de alojamiento en el servicio gestionado — `[REQUIERE CONFIRMACIÓN INTERNA]` si se pregunta puntualmente.
CTA: escalar si el requisito es sobre una región/país específico.
```

### Implementación

```
PREGUNTA: ¿Puedo contratar la implementación?
RESPUESTA (texto oficial): "Sí. En la modalidad «Vinqulia + Implementación», Kontrolia configura el sistema, migra tu información, da de alta usuarios y capacita a tu equipo."
INFORMACIÓN ADICIONAL: ver [[10_precios-y-planes]] para condiciones comerciales; no se debe estimar plazo sin validarlo con el equipo de implementación.
CTA: ofrecer levantar el alcance del proyecto para cotizar la implementación.
```

```
PREGUNTA: ¿Quién me ayuda durante la implementación?
RESPUESTA (texto oficial): "El equipo de Kontrolia acompaña la puesta en marcha en la modalidad de implementación guiada, incluida la capacitación de tus vendedores."
INFORMACIÓN ADICIONAL: aplica a la modalidad «Vinqulia + Implementación».
CTA: preguntar cuántas personas del equipo del cliente necesitarían capacitación.
```

### IA

```
PREGUNTA: ¿Puedo agregar automatización e IA?
RESPUESTA (texto oficial): "Sí. Las automatizaciones nativas cubren el seguimiento habitual. Cuando quieras procesos a medida, agentes o IA, se suman como expansión del ecosistema Kontrolia."
INFORMACIÓN ADICIONAL: las automatizaciones basadas en reglas y el servidor MCP ya están incluidos; los agentes de IA personalizados se contratan aparte. Ver [[01_producto]].
CTA: preguntar qué le gustaría que hiciera la IA concretamente.
```

### Precios

```
PREGUNTA: ¿Cuánto cuesta Vinqulia?
RESPUESTA: el precio se cotiza según las necesidades de cada empresa; no existe una tabla de precios pública. Ver [[10_precios-y-planes]].
INFORMACIÓN ADICIONAL: `[REQUIERE CONFIRMACIÓN INTERNA]` para cualquier cifra específica.
CTA: ofrecer levantar los datos mínimos para preparar una cotización.
```

### Soporte

```
PREGUNTA: ¿Qué soporte incluye Vinqulia?
RESPUESTA: `[REQUIERE CONFIRMACIÓN INTERNA]` — el sitio oficial no detalla públicamente canales, horarios ni niveles de soporte (SLA).
INFORMACIÓN ADICIONAL: no inventar un canal o tiempo de respuesta.
CTA: escalar a un especialista para confirmar el detalle de soporte disponible. Ver [[12_escalamiento]].
```

### Contratación

```
PREGUNTA: ¿Cómo contrato Vinqulia?
RESPUESTA: solicitando una demo con el equipo comercial, quien confirma el alcance y prepara una cotización a la medida.
INFORMACIÓN ADICIONAL: existen tres modalidades comerciales (Vinqulia, Vinqulia + Implementación, Vinqulia + Automatización e IA). Ver [[01_producto]] y [[10_precios-y-planes]].
CTA: ofrecer agendar la demo directamente.
```
