```yaml
product: Vinqulia
category: problemas-soluciones
audience: comercial
priority: alta
source: sitio oficial vinqulia.com + producto verificado
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Problemas y soluciones

Este documento traduce funcionalidades en argumentos comerciales. El orden de razonamiento siempre es **problema → impacto → solución → beneficio**, nunca una lista de funcionalidades sueltas.

---

```
PROBLEMA: Todo está en Excel.
Síntomas: hojas de cálculo distintas por vendedor, versiones que no coinciden, nadie sabe cuál es "la buena".
Causa probable: la empresa nunca tuvo un sistema comercial dedicado, o lo intentó y no se adoptó.
Impacto comercial: decisiones basadas en datos desactualizados; información que se pierde cuando alguien deja la empresa.
Solución Vinqulia: base de datos central de contactos, empresas y oportunidades, con importación desde el Excel actual.
Funcionalidad relacionada: contactos, empresas, oportunidades, importación CSV/JSON.
Beneficio: una sola fuente de verdad, accesible para todo el equipo en tiempo real.
Pregunta de discovery: "¿Hoy en cuántos archivos distintos viven los datos de tus clientes?"
Argumento comercial: Vinqulia no pide "abandonar" el Excel de golpe — se importa lo que ya existe y a partir de ahí todo vive en un solo lugar.
CTA recomendado: ofrecer una demo mostrando la importación de un archivo real.
```

```
PROBLEMA: Los vendedores olvidan seguimientos.
Síntomas: oportunidades que se enfrían sin que nadie note; clientes que preguntan "¿y mi cotización?".
Causa probable: el seguimiento depende de la memoria o disciplina individual del vendedor, no de un sistema.
Impacto comercial: ventas perdidas por inacción, no por rechazo del cliente.
Solución Vinqulia: tareas asociadas a cada contacto/oportunidad, y automatizaciones que crean tareas de seguimiento solas.
Funcionalidad relacionada: tareas, automatizaciones.
Beneficio: ninguna oportunidad se enfría solo por falta de memoria.
Pregunta de discovery: "¿Cómo se aseguran hoy de que un lead nuevo reciba seguimiento en los primeros días?"
Argumento comercial: la regla "cuando se crea un contacto, crear tarea de seguimiento en 3 días" corre sola, sin que nadie tenga que acordarse.
CTA recomendado: ofrecer demo del motor de automatizaciones.
```

```
PROBLEMA: Los leads llegan por WhatsApp.
Síntomas: conversaciones de venta viven en el teléfono personal del vendedor; nadie más las ve.
Causa probable: WhatsApp es el canal más natural para el cliente, pero no está conectado al sistema comercial.
Impacto comercial: si el vendedor se va, se pierde la conversación completa; dirección no tiene visibilidad de lo que se está negociando.
Solución Vinqulia: WhatsApp integrado (vía Twilio) directamente en la ficha del contacto.
Funcionalidad relacionada: WhatsApp vía Twilio.
Beneficio: la conversación pasa a ser propiedad de la empresa, no del vendedor.
Pregunta de discovery: "¿Qué porcentaje de tus leads llega hoy por WhatsApp?"
Argumento comercial: no se trata de dejar de usar WhatsApp, sino de que quede registrado donde el resto del equipo lo pueda ver.
CTA recomendado: ofrecer demo del historial de WhatsApp dentro de la ficha de contacto.
```

```
PROBLEMA: Los leads se pierden.
Síntomas: un formulario de la web genera un correo que alguien tiene que copiar a mano; a veces no se copia.
Causa probable: no existe una conexión automática entre el canal de captación y el sistema comercial.
Impacto comercial: leads pagados (publicidad, campañas) que nunca se atienden.
Solución Vinqulia: formularios web públicos que crean el contacto automáticamente, más claves de API para integraciones propias.
Funcionalidad relacionada: formularios web, claves de API, webhooks.
Beneficio: cero fricción entre "alguien mostró interés" y "existe el contacto en el CRM".
Pregunta de discovery: "¿Qué pasa hoy con un lead que llena un formulario en tu sitio web?"
Argumento comercial: el lead entra directo a Vinqulia sin que nadie lo transcriba.
CTA recomendado: ofrecer conectar el formulario existente del cliente con Vinqulia.
```

```
PROBLEMA: No existe visibilidad del pipeline.
Síntomas: dirección pregunta "¿cómo vamos?" y depende de que cada vendedor actualice una hoja aparte.
Causa probable: no hay un tablero único donde vivan todas las oportunidades abiertas.
Impacto comercial: decisiones de dirección basadas en percepciones, no en datos reales.
Solución Vinqulia: pipeline visual tipo Kanban, con varios embudos si el negocio lo requiere.
Funcionalidad relacionada: oportunidades/pipeline/Kanban, embudos múltiples, informes.
Beneficio: pipeline siempre actualizado y visible para todo el equipo, sin pedir reportes.
Pregunta de discovery: "¿Cómo sabes hoy cuánto vale tu pipeline abierto?"
Argumento comercial: el pipeline se actualiza solo, porque es donde el vendedor ya trabaja — no es un reporte aparte.
CTA recomendado: mostrar el tablero Kanban en la demo.
```

```
PROBLEMA: Cada vendedor trabaja diferente.
Síntomas: no hay un proceso comercial consistente; cada quien anota lo que quiere, cuando quiere.
Causa probable: no existe una estructura común (etapas, campos, seguimientos) impuesta por el sistema.
Impacto comercial: imposible comparar desempeño o replicar lo que funciona.
Solución Vinqulia: etapas de pipeline, campos y automatizaciones comunes para todo el equipo.
Funcionalidad relacionada: pipeline/etapas, automatizaciones, vistas guardadas.
Beneficio: consistencia de proceso entre vendedores, sin depender de la disciplina individual.
Pregunta de discovery: "¿Todos tus vendedores siguen el mismo proceso de venta hoy?"
Argumento comercial: el proceso queda definido en el sistema, no en la cabeza de cada vendedor.
CTA recomendado: ofrecer configurar el pipeline según el proceso real del cliente.
```

```
PROBLEMA: La información está dispersa.
Síntomas: datos del cliente repartidos entre Excel, WhatsApp, correo personal y notas en papel.
Causa probable: nunca existió un sistema central; cada canal se atendió por separado.
Impacto comercial: tiempo perdido reconstruyendo el historial de un cliente antes de cada llamada.
Solución Vinqulia: contactos, empresas, notas, tareas, WhatsApp y correo, todo en la misma ficha.
Funcionalidad relacionada: contactos, notas y actividades, WhatsApp, correo.
Beneficio: reconstruir la relación con un cliente sin preguntarle al vendedor.
Pregunta de discovery: "¿Cuánto tiempo te toma hoy juntar el historial completo de un cliente antes de llamarlo?"
Argumento comercial: todo lo que pasó con un cliente vive en un solo lugar, con fecha y responsable.
CTA recomendado: mostrar la ficha de contacto completa en la demo.
```

```
PROBLEMA: No existe historial del cliente.
Síntomas: cuando un vendedor se va, se va también todo lo que sabía del cliente.
Causa probable: el historial vivía en la memoria o en canales personales del vendedor, no en un sistema.
Impacto comercial: continuidad rota cada vez que hay rotación de personal.
Solución Vinqulia: notas y actividades tipadas asociadas permanentemente al contacto, no a la persona que las escribió.
Funcionalidad relacionada: notas y actividades tipadas.
Beneficio: continuidad del seguimiento aunque cambie quien lo atiende.
Pregunta de discovery: "¿Qué pasa con el historial de un cliente cuando el vendedor que lo atendía se va?"
Argumento comercial: el historial le pertenece a la empresa, no al vendedor.
CTA recomendado: ofrecer demo del historial de actividad de un contacto.
```

```
PROBLEMA: El CRM actual es demasiado complejo.
Síntomas: el equipo lo evita, captura lo mínimo indispensable, o simplemente dejó de usarlo.
Causa probable: el sistema se configuró para un caso genérico, con más campos y pasos de los que el equipo necesita.
Impacto comercial: dinero pagado por una licencia que nadie usa realmente.
Solución Vinqulia: personalización de campos, etapas, categorías y terminología al vocabulario real del negocio del cliente.
Funcionalidad relacionada: personalización, campos personalizados.
Beneficio: adopción más natural porque el sistema habla el idioma del negocio, no al revés.
Pregunta de discovery: "¿Qué tanto usa hoy tu equipo el CRM actual, honestamente?"
Argumento comercial: Vinqulia se ajusta al proceso del cliente; no se obliga al cliente a ajustarse al sistema.
CTA recomendado: ofrecer configurar una demo con los campos y etapas reales del cliente.
```

```
PROBLEMA: El CRM actual es demasiado caro.
Síntomas: la factura mensual no se justifica frente al uso real que le da el equipo.
Causa probable: planes por usuario de sistemas internacionales con funciones que la empresa nunca usa.
Impacto comercial: presión para cancelar el sistema y volver a Excel.
Solución Vinqulia: cotización a la medida del negocio, sin funciones sobrantes ni licencias por asiento no usadas.
Funcionalidad relacionada: modalidades comerciales.
Beneficio: se paga por lo que el negocio realmente necesita.
Pregunta de discovery: "¿Qué parte de tu CRM actual sientes que no usas?"
Argumento comercial: no se puede afirmar que Vinqulia sea más barato sin conocer el caso — se recomienda cotizar y comparar. Ver [[10_precios-y-planes]].
CTA recomendado: ofrecer una cotización personalizada.
```

```
PROBLEMA: Necesitan migrar.
Síntomas: el cliente quiere cambiar de sistema pero teme perder su historial.
Causa probable: mala experiencia previa con una migración, o simplemente desconocimiento del proceso.
Impacto comercial: el miedo a migrar frena la decisión de compra aunque el nuevo sistema sea mejor.
Solución Vinqulia: importación de contactos, empresas y oportunidades desde CSV/JSON, con detección de duplicados.
Funcionalidad relacionada: importación CSV/JSON.
Beneficio: continuidad del historial comercial al migrar, sin capturar todo de nuevo.
Pregunta de discovery: "¿Qué información sientes que no te puedes dar el lujo de perder al migrar?"
Argumento comercial: no se empieza de cero — se trae lo que ya existe.
CTA recomendado: pedir un export de muestra del sistema actual para validar la importación.
```

```
PROBLEMA: Necesitan integración.
Síntomas: el equipo captura los mismos datos dos veces, en el CRM y en otro sistema (ERP, facturación).
Causa probable: los sistemas de la empresa no se hablan entre sí.
Impacto comercial: doble captura, datos que se desincronizan entre sistemas.
Solución Vinqulia: API REST completa, claves de API y webhooks firmados para integraciones propias.
Funcionalidad relacionada: API REST, claves de API, webhooks.
Beneficio: Vinqulia se integra al ecosistema tecnológico existente, no exige reemplazarlo.
Pregunta de discovery: "¿Con qué otros sistemas necesitaría hablar tu CRM?"
Argumento comercial: no se afirma tener un conector prearmado a un sistema específico salvo que esté confirmado — se ofrece la API/webhooks como camino de integración.
CTA recomendado: escalar el detalle técnico de la integración a un especialista. Ver [[12_escalamiento]].
```

```
PROBLEMA: Necesitan infraestructura propia.
Síntomas: TI exige que los datos no vivan en un servidor compartido con otras empresas.
Causa probable: políticas internas de seguridad, cumplimiento normativo, o desconfianza hacia terceros.
Impacto comercial: sin esta opción, el proyecto no pasa el filtro de TI.
Solución Vinqulia: despliegue en infraestructura propia del cliente, además del servicio administrado por Kontrolia.
Funcionalidad relacionada: infraestructura/despliegue.
Beneficio: cumple políticas de aislamiento de datos sin renunciar al producto.
Pregunta de discovery: "¿Tu equipo de TI tiene algún requisito sobre dónde deben vivir los datos?"
Argumento comercial: Vinqulia no obliga a elegir entre control y funcionalidad — ambos caminos existen.
CTA recomendado: escalar el requisito técnico específico a un especialista.
```

```
PROBLEMA: Necesitan automatización.
Síntomas: procesos repetitivos (crear tarea, asignar responsable) se hacen a mano, cada vez.
Causa probable: el sistema actual no tiene motor de reglas, o el equipo no lo configuró.
Impacto comercial: tiempo de vendedores gastado en trabajo administrativo en vez de vender.
Solución Vinqulia: automatizaciones tipo "cuando pase X, haz Y", a nivel de base de datos.
Funcionalidad relacionada: automatizaciones.
Beneficio: consistencia de proceso sin depender de que alguien recuerde hacerlo.
Pregunta de discovery: "¿Qué tarea repiten tus vendedores todos los días que podría hacerse sola?"
Argumento comercial: la automatización corre aunque el dato entre por la web, por la API o por importación.
CTA recomendado: ofrecer demo de una regla de automatización configurada con un caso real del cliente.
```

```
PROBLEMA: Quieren utilizar IA.
Síntomas: el cliente pregunta si Vinqulia "tiene IA" sin tener claro qué espera de ella.
Causa probable: la IA es un tema de conversación general en el mercado; el interés muchas veces es genérico.
Impacto comercial: expectativas mal alineadas si no se distingue lo incluido de lo contratable aparte.
Solución Vinqulia: automatizaciones basadas en reglas y un servidor MCP que conecta Vinqulia a asistentes de IA como Claude — ambos incluidos. Agentes de IA personalizados y procesos de IA a medida se contratan por separado dentro del ecosistema Kontrolia.
Funcionalidad relacionada: automatizaciones, servidor MCP.
Beneficio: el cliente puede empezar a usar IA sobre sus datos de Vinqulia sin desarrollo adicional, y crecer hacia agentes personalizados cuando lo necesite.
Pregunta de discovery: "Cuando dices 'IA', ¿qué te gustaría que hiciera concretamente?"
Argumento comercial: no prometer una función de IA no verificada — distinguir siempre lo incluido de lo contratable. Ver [[01_producto]].
CTA recomendado: si el interés es en agentes personalizados, escalar a un especialista del ecosistema Kontrolia.
```
