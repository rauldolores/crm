```yaml
product: Vinqulia
category: intenciones
audience: agente-comercial
priority: alta
source: criterio comercial derivado del producto verificado
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Mapa de intenciones

Las principales intenciones que puede tener un visitante que llega al agente de Vinqulia, con cómo reconocerlas y cómo responder.

```
Intención: Quiere saber qué es Vinqulia.
Señales: preguntas abiertas tipo "¿qué es esto?", "¿qué hace Vinqulia?".
Información que necesita: descripción clara y breve del producto.
Pregunta recomendada: "¿Ya conoces algo de Vinqulia o prefieres que te cuente desde cero?"
Respuesta: usar el resumen de 30 segundos de [[01_producto]].
CTA: ofrecer profundizar según lo que más le interese (funcionalidades, precio, demo).
```

```
Intención: Quiere precio.
Señales: "¿cuánto cuesta?", "¿cuál es el precio?", pregunta directa sin contexto previo.
Información que necesita: entender que se cotiza según necesidad, no hay tabla pública.
Pregunta recomendada: "Para darte un número real, ¿cuántos usuarios tendrían y qué necesitarían resolver?"
Respuesta: explicar que el precio se cotiza a la medida; ver [[10_precios-y-planes]] y [[06_objeciones]] ("solo quiero saber el precio").
CTA: ofrecer levantar los datos mínimos para preparar una cotización.
```

```
Intención: Quiere demo.
Señales: "¿puedo ver el sistema?", "¿tienen una demo?", "quiero probarlo".
Información que necesita: cómo y cuándo se agenda.
Pregunta recomendada: "¿Prefieres que te muestre con datos de ejemplo o directamente coordinamos con un especialista?"
Respuesta: confirmar interés y encaminar a captura de datos de contacto. Ver [[04_playbook-ventas]].
CTA: agendar demo con un especialista.
```

```
Intención: Quiere comparar.
Señales: menciona un competidor por nombre, o pregunta "¿en qué se diferencia de...?".
Información que necesita: una comparación honesta, no un ataque al competidor.
Pregunta recomendada: "¿Qué es lo que más te gusta y lo que menos te gusta de [competidor]?"
Respuesta: usar la ficha correspondiente de [[07_competidores]], desde "depende de lo que necesites".
CTA: ofrecer una demo enfocada en los puntos donde Vinqulia encaja mejor para su caso.
```

```
Intención: Quiere migrar.
Señales: "vengo de [otro CRM]", "quiero cambiarme de sistema", "¿puedo traer mis datos?".
Información que necesita: cómo funciona la importación y qué se puede traer.
Pregunta recomendada: "¿Tu sistema actual te permite exportar en CSV o JSON?"
Respuesta: confirmar importación de contactos/empresas/oportunidades con detección de duplicados. Ver [[02_funcionalidades]] y [[09_faq]].
CTA: pedir un archivo de muestra para validar la migración en la demo.
```

```
Intención: Quiere integrar.
Señales: menciona un ERP, sistema de facturación, u otro software específico que ya usa.
Información que necesita: que existe API/webhooks, sin prometer un conector prearmado no confirmado.
Pregunta recomendada: "¿Qué información necesitarías que se sincronizara entre ambos sistemas?"
Respuesta: confirmar API REST, claves de API y webhooks como camino de integración. Ver [[02_funcionalidades]].
CTA: escalar el detalle técnico a un especialista. Ver [[12_escalamiento]].
```

```
Intención: Quiere WhatsApp.
Señales: "¿se conecta con WhatsApp?", "la mayoría de mis clientes me escriben por WhatsApp".
Información que necesita: cómo funciona la integración y qué necesita tener listo (cuenta de Twilio).
Pregunta recomendada: "¿Ya cuentan con una cuenta de Twilio con WhatsApp habilitado?"
Respuesta: confirmar la integración vía Twilio y el registro automático en el historial del contacto. Ver [[02_funcionalidades]].
CTA: ofrecer mostrar el historial de WhatsApp dentro de la ficha de contacto en la demo.
```

```
Intención: Quiere IA.
Señales: "¿tiene IA?", "quiero usar inteligencia artificial en mi CRM".
Información que necesita: distinguir lo incluido (automatizaciones, servidor MCP) de lo contratable aparte.
Pregunta recomendada: "¿Qué te gustaría que hiciera la IA concretamente en tu proceso comercial?"
Respuesta: explicar la doble capa de IA de [[01_producto]] — nunca prometer una capacidad no verificada.
CTA: si busca un agente/proceso a medida, escalar. Ver [[12_escalamiento]].
```

```
Intención: Quiere infraestructura propia.
Señales: "necesito instalarlo en mis servidores", "¿dónde viven los datos?", menciona política de TI.
Información que necesita: que existe la opción de infraestructura propia, además del servicio administrado.
Pregunta recomendada: "¿Ese requisito viene de una política interna o de una obligación regulatoria específica?"
Respuesta: confirmar ambas modalidades de despliegue. Ver [[01_producto]] y [[09_faq]].
CTA: escalar el requisito técnico específico a un especialista. Ver [[12_escalamiento]].
```

```
Intención: Quiere personalización.
Señales: "¿puedo cambiar los campos?", "necesito que se adapte a mi negocio", menciona vocabulario propio del sector.
Información que necesita: qué se puede personalizar sin desarrollo (campos, etapas, moneda, marca).
Pregunta recomendada: "¿Qué es específicamente lo que necesitarías personalizar?"
Respuesta: confirmar personalización sin tocar código. Ver [[02_funcionalidades]] y [[09_faq]].
CTA: si requiere código nuevo, no solo configuración, escalar. Ver [[12_escalamiento]].
```

```
Intención: Tiene una objeción.
Señales: expresa duda, resistencia o comparación negativa ("está caro", "no quiero cambiar", etc.).
Información que necesita: sentirse escuchado antes de recibir una respuesta.
Pregunta recomendada: variable según la objeción — ver [[06_objeciones]].
Respuesta: validar la objeción y responder con el guion correspondiente de [[06_objeciones]].
CTA: según el resultado, avanzar a captura de datos o escalar si la objeción lo requiere.
```

```
Intención: Está listo para comprar.
Señales: pide pasos siguientes concretos, pregunta cómo contratar, pide hablar con ventas directamente.
Información que necesita: el camino claro hacia la contratación.
Pregunta recomendada: "¿Prefieres que coordinemos la demo esta semana o ya tienes claro que quieres avanzar directo a cotización?"
Respuesta: confirmar interés, capturar datos completos y escalar como intención de compra alta. Ver [[12_escalamiento]] y [[13_lead-scoring]] (HOT).
CTA: escalar de inmediato a un especialista humano.
```

```
Intención: Solo está investigando.
Señales: respuestas evasivas, "solo estoy viendo opciones", sin urgencia ni autoridad de decisión declarada.
Información que necesita: contenido útil sin presión de venta.
Pregunta recomendada: "¿Hay algo puntual que te gustaría resolver, o vas empezando a explorar el tema?"
Respuesta: dar información clara sin forzar el avance a captura de datos. Ver [[04_playbook-ventas]] — "cuándo no insistir".
CTA: ofrecer dejar sus datos solo si lo desea, sin presionar; clasificar como COLD/WARM. Ver [[13_lead-scoring]].
```
