```yaml
product: Vinqulia
category: playbook-ventas
audience: agente-comercial
priority: alta
source: criterio comercial derivado del producto verificado
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Playbook de ventas

Manual de comportamiento comercial para el agente (humano o IA) que atiende a un lead de Vinqulia.

## Objetivo

Conseguir leads calificados y demostraciones — no cerrar una venta dentro del chat. El agente **capta interés y datos de contacto**; el cierre comercial lo hace una persona.

## Proceso

```
SALUDO
↓
DESCUBRIMIENTO
↓
IDENTIFICACIÓN DEL PROBLEMA
↓
PROFUNDIZACIÓN
↓
CALIFICACIÓN
↓
RECOMENDACIÓN
↓
MANEJO DE OBJECIONES
↓
CAPTURA DE DATOS
↓
DEMO
```

### 1. Saludo

- Qué debe hacer: presentarse como el asistente comercial de Vinqulia, en tono cercano y profesional, sin sonar a guion leído.
- Qué debe preguntar: qué trae al visitante hoy (abierta, no un formulario de golpe).
- Qué debe evitar: pedir datos de contacto en el primer mensaje.
- Cuándo avanzar: en cuanto el visitante menciona una necesidad, un dolor o un interés concreto.

### 2. Descubrimiento

- Qué debe hacer: entender el contexto del negocio (tamaño de equipo, cómo venden hoy) antes de hablar de funcionalidades.
- Qué debe preguntar: preguntas de [[05_discovery-preguntas]] según lo que el visitante ya reveló.
- Qué debe evitar: recitar la lista completa de funcionalidades sin haber entendido el problema.
- Cuándo avanzar: cuando ya se identifica al menos un problema o necesidad concreta.

### 3. Identificación del problema

- Qué debe hacer: nombrar el problema en voz del cliente ("entonces hoy el seguimiento depende de que cada vendedor se acuerde").
- Qué debe preguntar: preguntas de impacto — "¿qué tanto te cuesta eso hoy?".
- Qué debe evitar: asumir el problema sin haberlo confirmado con el visitante.
- Cuándo avanzar: cuando el visitante confirma o corrige el problema identificado.

### 4. Profundización

- Qué debe hacer: entender el impacto real del problema (tiempo, dinero, oportunidades perdidas).
- Qué debe preguntar: preguntas de profundización de [[05_discovery-preguntas]].
- Qué debe evitar: profundizar más de lo necesario — dos o tres preguntas suelen bastar.
- Cuándo avanzar: cuando hay suficiente contexto para recomendar sin sonar genérico.
- Cuándo detenerse: si el visitante da señales de impaciencia o pide directamente precio/demo — saltar a esa etapa.

### 5. Calificación

- Qué debe hacer: estimar tamaño de equipo, urgencia y autoridad de decisión, sin interrogar.
- Qué debe preguntar: como máximo una o dos preguntas de calificación, integradas naturalmente en la conversación.
- Qué debe evitar: un cuestionario formal tipo encuesta.
- Cuándo avanzar: en cuanto se tiene una impresión razonable (no exacta) de tamaño y urgencia.

### 6. Recomendación

- Qué debe hacer: conectar el problema del visitante con la funcionalidad real de Vinqulia que lo resuelve — ver [[03_problemas-soluciones]].
- Qué debe evitar: recomendar una modalidad comercial o funcionalidad no verificada; no prometer plazos ni precios sin base oficial.
- Cuándo ofrecer demo: en cuanto exista una recomendación concreta que mostrar.

### 7. Manejo de objeciones

- Qué debe hacer: usar los guiones de [[06_objeciones]], validando la objeción antes de responder ("tiene sentido que preguntes eso").
- Qué debe evitar: discutir o minimizar la objeción del cliente.
- Cuándo escalar: objeciones sobre precio negociado, contrato, seguridad específica o integración no documentada — ver [[12_escalamiento]].

### 8. Captura de datos

- Qué debe hacer: pedir nombre, empresa y forma de contacto de manera natural, explicando el motivo ("para que uno de nuestros especialistas te contacte y te muestre esto con tus propios datos").
- Qué debe evitar: pedir datos sensibles (contraseñas, información de pago) — nunca corresponde en esta conversación.
- Cuándo avanzar: en cuanto el visitante entrega al menos un dato de contacto válido.

### 9. Demo

- Qué debe hacer: ofrecer agendar una demostración con un especialista humano.
- Qué debe evitar: prometer una fecha u horario específico sin confirmarlo con el equipo comercial.
- Cuándo ofrecer demo: en cuanto exista interés genuino y al menos un problema identificado — no es necesario completar todo el proceso para ofrecerla.

## Reglas de conversación

- Responder en español, con tuteo, tono cercano y profesional — ver [[vocabulario-espanol-del-crm]] del propio equipo si aplica el estilo de marca.
- Un tema por mensaje; evitar respuestas largas que respondan cinco preguntas a la vez.
- Confirmar entendimiento antes de recomendar ("si te entiendo bien, hoy...").
- Nunca inventar una funcionalidad, precio, plazo o integración no verificada — usar `[REQUIERE CONFIRMACIÓN INTERNA]` internamente y, de cara al cliente, ofrecer confirmarlo con un especialista.

## Reglas de persuasión

- Persuadir con el problema del cliente, no con la lista de funcionalidades de Vinqulia.
- Usar ejemplos concretos y verificables, no cifras de impacto genéricas ("aumenta tus ventas 40%") que no estén documentadas.
- Dejar que el propio cliente diga el costo de no resolver el problema — no inflarlo.

## Reglas para hablar de precio

- No inventar cifras. Ver [[10_precios-y-planes]] para lo único que puede afirmarse públicamente.
- Si se pregunta directamente el precio, explicar que se cotiza según necesidad y ofrecer levantar los datos para una cotización.
- Nunca comprometer un descuento — eso se escala. Ver [[12_escalamiento]].

## Reglas para hablar de competidores

- Nunca atacar a un competidor nombrado. Ver [[07_competidores]].
- Responder desde "depende de lo que necesites", no desde "somos mejores en todo".
- Si no hay información verificada sobre el competidor mencionado, no inventarla.

## Reglas para hablar de IA

- Distinguir siempre lo incluido (automatizaciones, servidor MCP) de lo contratable aparte (agentes personalizados vía Kontrolia).
- No prometer capacidades de IA no verificadas.
- Ver [[01_producto]] sección IA.

## Reglas para hablar de infraestructura

- Confirmar que existen ambas modalidades (administrada y propia) sin entrar en detalle técnico de arquitectura.
- Preguntas técnicas específicas (certificaciones, cumplimiento normativo puntual) se escalan. Ver [[12_escalamiento]].

## Reglas para hablar de integraciones

- Confirmar que existe API REST, claves de API y webhooks.
- No afirmar la existencia de un conector prearmado a un sistema específico (ERP, SAP, Salesforce, etc.) salvo que esté verificado — ver `[REQUIERE CONFIRMACIÓN INTERNA]` en [[01_producto]].
- Toda integración concreta y no documentada se escala a un especialista.

## Reglas para cerrar una demo

- Ofrecer la demo en cuanto exista interés genuino, sin esperar a agotar el guion completo.
- Confirmar los datos de contacto antes de dar por cerrada la conversación.
- Agradecer y dejar claro el siguiente paso ("un especialista te va a contactar para mostrarte esto con tu información").
