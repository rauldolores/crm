```yaml
product: Vinqulia
category: lead-scoring
audience: agente-comercial
priority: alta
source: criterio comercial derivado del producto verificado
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Perfil del lead ideal y sistema de scoring conceptual

**Nota de alcance:** este documento define un scoring **conceptual para calificar un lead comercial durante la conversación de venta** (qué tan HOT/WARM/COLD es un prospecto de Vinqulia). Es distinto del **puntaje de interés (lead scoring) que Vinqulia ofrece como funcionalidad del producto** para priorizar contactos ya cargados en el CRM del cliente — ver [[02_funcionalidades]] sección "Puntaje de interés (lead scoring)". No confundir ambos.

## Variables de calificación

- **Tamaño del equipo**: cuántas personas participan en el proceso comercial del prospecto.
- **Número de vendedores**: específicamente cuántos venden, no solo el tamaño total del equipo.
- **Problema actual**: qué tan claro y doloroso es el problema identificado — ver [[03_problemas-soluciones]].
- **CRM actual**: si ya usa uno, cuál, y qué tan satisfecho está.
- **Uso de Excel**: si la operación comercial vive hoy en hojas de cálculo.
- **Uso de WhatsApp**: si una parte relevante de la venta ocurre por WhatsApp.
- **Necesidad de integración**: si mencionó otro sistema (ERP, facturación) que necesitaría conectarse.
- **Necesidad de migración**: si tiene datos existentes que migrar.
- **Necesidad de infraestructura propia**: si hay un requisito de TI/seguridad sobre dónde viven los datos.
- **Necesidad de automatización**: si describió procesos repetitivos manuales.
- **Interés en IA**: si preguntó por IA de forma espontánea y con un caso de uso concreto (no solo genérico).
- **Urgencia**: qué tan pronto quiere resolver el problema.
- **Presupuesto**: si ya tiene uno contemplado o está en fase exploratoria.
- **Autoridad del interlocutor**: si la persona que conversa decide, influye, o solo investiga.
- **Intención de compra**: señales directas como pedir demo, pedir precio, o pedir agendar.

## Clasificación

```
HOT
```
Señales que suben a HOT: problema claro y doloroso, urgencia declarada ("lo necesitamos ya" / "este trimestre"), interlocutor con autoridad de decisión (dueño, director comercial, director de TI), presupuesto ya contemplado, pide demo o precio de forma directa, equipo con más de un vendedor.

```
WARM
```
Señales típicas de WARM: problema identificado pero sin urgencia inmediata, interlocutor que influye pero no decide solo, sin presupuesto confirmado todavía, interés genuino pero en fase de comparar opciones (menciona otros CRMs o Excel como punto de partida).

```
COLD
```
Señales que bajan a COLD: sin problema claro identificado ("solo estoy viendo qué hay"), sin autoridad ni influencia en la decisión, sin urgencia ("tal vez el próximo año"), interés genérico sin caso de uso concreto, solo pregunta precio sin dar ningún contexto adicional pese a que se le pregunta.

## Señales que hacen subir la prioridad

- Menciona un problema concreto de los listados en [[03_problemas-soluciones]], no uno genérico.
- Da una cifra de equipo, volumen de leads o tamaño de operación.
- Pregunta por pasos siguientes concretos (cómo empezar, cómo agendar, cuándo puede verlo).
- Menciona una fecha o evento que crea urgencia (temporada alta, meta trimestral, fin de contrato con otro proveedor).
- El interlocutor se identifica como dueño, director general, director comercial o director de TI.

## Señales que hacen bajar la prioridad

- Respuestas evasivas o muy breves ante preguntas de discovery.
- No hay claridad sobre quién más participa en la decisión.
- Solo pregunta por curiosidad general, sin ningún problema ni contexto de negocio.
- Rechaza dar cualquier dato de contacto incluso después de recibir valor en la conversación.
- El volumen de negocio (contactos, vendedores) es tan bajo que el propio prospecto reconoce que "tal vez no lo necesite todavía".
