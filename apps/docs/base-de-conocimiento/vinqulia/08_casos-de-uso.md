```yaml
product: Vinqulia
category: casos-de-uso
audience: comercial
priority: media
source: capacidades reales de Vinqulia + criterio comercial
last_verified: 2026-08-26
sensitivity: pública
```

# Vinqulia — Casos de uso por industria

Nota importante: Vinqulia **no** tiene configuraciones o plantillas prearmadas por industria confirmadas públicamente. Cada pipeline, etapa y campo por industria descrito abajo es una **configuración que podría desarrollarse** sobre las capacidades reales del producto (embudos múltiples, campos personalizados, automatizaciones) — no una función lista de fábrica. Nunca afirmar que un caso de uso "ya viene configurado".

```
Industria: Servicios B2B
Problema: ciclos de venta largos con varios interlocutores por cuenta, seguimiento disperso entre correo y WhatsApp.
Proceso actual: hojas de cálculo o CRM genérico sin adaptar al ciclo de venta consultivo.
Proceso propuesto (configuración posible): un embudo de "Nuevo negocio" con etapas por nivel de interlocutor, empresas vinculadas a varios contactos.
Pipeline: embudo dedicado a ventas B2B (configuración posible).
Etapas (configuración posible): Prospección → Diagnóstico → Propuesta → Negociación → Cierre.
Automatizaciones posibles: tarea de seguimiento automática tras enviar propuesta.
Integraciones posibles: correo (Postmark) para propuestas formales, API para sincronizar con sistema de facturación.
Beneficios: visibilidad de cuentas con múltiples contactos, historial completo por empresa.
Preguntas de discovery: "¿Cuántas personas suelen participar en la decisión de compra de tu cliente típico?"
Argumento comercial: Vinqulia centraliza empresa + contactos + oportunidades, ideal cuando la venta involucra a varias personas del lado del cliente.
```

```
Industria: Consultoría
Problema: relación de largo plazo con clientes, donde el historial de conversaciones importa tanto como el pipeline de nuevos proyectos.
Proceso actual: notas dispersas en documentos personales de cada consultor.
Proceso propuesto (configuración posible): notas y actividades tipadas por cliente, tareas de seguimiento entre proyectos.
Pipeline: embudo de "Nuevos proyectos", separado de cuentas ya activas (configuración posible).
Etapas (configuración posible): Contacto inicial → Propuesta → Proyecto en curso → Cierre/Renovación.
Automatizaciones posibles: tarea de check-in periódico con clientes activos.
Integraciones posibles: correo para envío de propuestas y reportes.
Beneficios: continuidad del historial de cliente aunque cambie el consultor asignado.
Preguntas de discovery: "¿Qué pasa con la relación del cliente cuando cambia el consultor a cargo?"
Argumento comercial: el historial de cada cliente queda documentado en el sistema, no en la memoria de una persona.
```

```
Industria: Software
Problema: leads que llegan por formulario web o prueba gratuita necesitan calificación y seguimiento rápido antes de enfriarse.
Proceso actual: leads capturados en una hoja de cálculo o en el propio producto, sin conexión al proceso comercial.
Proceso propuesto: formularios web conectados directamente a Vinqulia, con lead scoring automático para priorizar.
Pipeline: embudo de ventas de producto (configuración posible).
Etapas (configuración posible): Lead capturado → Calificado → Demo → Propuesta → Cierre.
Automatizaciones posibles: tarea de contacto inmediato al crear un lead nuevo.
Integraciones posibles: API/webhooks para conectar el propio producto con Vinqulia; servidor MCP para consultar datos desde un asistente de IA.
Beneficios: priorización automática de leads mediante el puntaje de interés (lead scoring) — ver [[13_lead-scoring]].
Preguntas de discovery: "¿Cómo priorizan hoy a qué lead atender primero cuando llegan varios el mismo día?"
Argumento comercial: el puntaje de interés ordena la lista de contactos sin que nadie tenga que decidir manualmente por dónde empezar.
```

```
Industria: Inmobiliarias
Problema: alto volumen de leads (portales, formularios) que requieren respuesta muy rápida y seguimiento constante hasta el cierre.
Proceso actual: leads atendidos por WhatsApp personal de cada asesor, sin trazabilidad para la dirección.
Proceso propuesto: formularios web + WhatsApp integrados, con campos personalizados para datos propios del sector (por ejemplo, tipo de propiedad de interés).
Pipeline: embudo de ventas de propiedades (configuración posible).
Etapas (configuración posible): Lead nuevo → Contactado → Visita agendada → Oferta → Cierre.
Automatizaciones posibles: tarea de contacto inmediato al recibir un lead nuevo, dado lo sensible al tiempo de respuesta que es este sector.
Integraciones posibles: formularios web desde portales o el sitio propio; campos personalizados para atributos de propiedad.
Beneficios: ningún lead se pierde entre asesores; visibilidad de dirección sobre el pipeline completo.
Preguntas de discovery: "¿Qué tan rápido logran contactar hoy a un lead que llega por un portal inmobiliario?"
Argumento comercial: campos personalizados permiten adaptar Vinqulia al vocabulario propio del sector sin desarrollo adicional.
```

```
Industria: Seguros
Problema: relación de largo plazo con el cliente que incluye renovaciones periódicas, no solo una venta única.
Proceso actual: seguimiento de vencimientos de póliza llevado manualmente o en hojas de cálculo aparte.
Proceso propuesto: automatizaciones para crear tareas de renovación antes del vencimiento; campos personalizados para datos de póliza.
Pipeline: embudo separado para "Nuevas pólizas" vs. "Renovaciones" (embudos múltiples).
Etapas (configuración posible): Cotización → Emisión → Cliente activo → Renovación.
Automatizaciones posibles: tarea de contacto automática antes de la fecha de vencimiento de una póliza.
Integraciones posibles: API para sincronizar con el sistema de administración de pólizas.
Beneficios: cero renovaciones perdidas por falta de seguimiento a tiempo.
Preguntas de discovery: "¿Cómo se aseguran hoy de contactar a un cliente antes de que venza su póliza?"
Argumento comercial: los embudos múltiples permiten separar la venta nueva de la gestión de renovaciones sin mezclar procesos distintos.
```

```
Industria: Distribución
Problema: relación comercial con múltiples cuentas (distribuidores, puntos de venta) que requiere visibilidad consolidada.
Proceso actual: cada representante de ventas maneja su cartera de cuentas de forma independiente.
Proceso propuesto: fichas de empresa por punto de venta/distribuidor, con oportunidades y tareas asociadas a cada una.
Pipeline: embudo de "Cuentas de distribución" (configuración posible).
Etapas (configuración posible): Prospecto → Negociación de condiciones → Cuenta activa → Recompra.
Automatizaciones posibles: tarea periódica de seguimiento a cuentas sin actividad reciente.
Integraciones posibles: API para sincronizar con sistema de inventario o facturación.
Beneficios: visibilidad consolidada de toda la red de cuentas, no solo de la cartera de un representante.
Preguntas de discovery: "¿Cómo visualiza hoy la dirección el estado de toda la red de distribuidores?"
Argumento comercial: cada cuenta queda documentada de forma consistente, sin depender de la memoria de un representante.
```

```
Industria: Manufactura
Problema: ventas complejas con cotizaciones técnicas y ciclos largos, a menudo ligadas a sistemas de producción o ERP.
Proceso actual: cotizaciones y seguimiento gestionados fuera del sistema comercial, en documentos técnicos aparte.
Proceso propuesto: oportunidades con campos personalizados para especificaciones técnicas, integración vía API con el ERP existente.
Pipeline: embudo de ventas técnicas/industriales (configuración posible).
Etapas (configuración posible): Solicitud de cotización → Cotización enviada → Negociación técnica → Orden de compra.
Automatizaciones posibles: tarea de seguimiento tras el envío de una cotización.
Integraciones posibles: API para sincronizar con ERP de producción — integración específica a validar con un especialista.
Beneficios: trazabilidad de cada cotización y su estado, sin depender de documentos sueltos.
Preguntas de discovery: "¿Qué sistema usan hoy para generar y dar seguimiento a cotizaciones técnicas?"
Argumento comercial: Vinqulia no reemplaza el ERP — se conecta con él vía API para mantener sincronizada la parte comercial.
```

```
Industria: Comercio
Problema: alto volumen de clientes con relaciones más transaccionales, donde el seguimiento post-venta suele descuidarse.
Proceso actual: ventas registradas en el sistema de punto de venta, sin conexión con seguimiento comercial o postventa.
Proceso propuesto: contactos enriquecidos con historial de interacción, automatizaciones de seguimiento postventa.
Pipeline: embudo de recompra/fidelización (configuración posible).
Etapas (configuración posible): Cliente nuevo → Seguimiento postventa → Cliente recurrente.
Automatizaciones posibles: tarea de contacto de seguimiento tras una compra.
Integraciones posibles: API para recibir eventos del sistema de punto de venta.
Beneficios: seguimiento postventa sistemático en vez de depender de que alguien se acuerde.
Preguntas de discovery: "¿Qué hacen hoy después de que un cliente compra, para que vuelva a comprar?"
Argumento comercial: la automatización convierte el seguimiento postventa en un proceso, no en una excepción.
```

```
Industria: Agencias (marketing, publicidad, medios)
Problema: gestión de múltiples cuentas de cliente en paralelo, cada una con su propio ciclo de proyectos y renovaciones.
Proceso actual: cada cuenta se gestiona en documentos o tableros separados, sin visibilidad consolidada para dirección.
Proceso propuesto: empresas como cuentas de cliente, con oportunidades por proyecto/campaña y notas de seguimiento.
Pipeline: embudo de "Nuevas cuentas" y otro de "Proyectos activos" (embudos múltiples).
Etapas (configuración posible): Propuesta → Aprobación → Proyecto en curso → Renovación.
Automatizaciones posibles: tarea de seguimiento antes de la fecha de renovación de contrato.
Integraciones posibles: correo para envío de propuestas y reportes de resultados.
Beneficios: visibilidad consolidada de todas las cuentas activas y sus fechas clave.
Preguntas de discovery: "¿Cómo llevan hoy el seguimiento de cuándo renueva cada cuenta?"
Argumento comercial: los embudos múltiples separan la captación de nuevas cuentas de la gestión de las ya activas.
```

```
Industria: Empresas de servicios (general)
Problema: mezcla de ventas nuevas y soporte postventa dentro del mismo equipo, sin separación clara de procesos.
Proceso actual: solicitudes de soporte y oportunidades de venta mezcladas en el mismo canal (correo o WhatsApp).
Proceso propuesto: pipeline de ventas separado de tickets de soporte, ambos asociados al mismo contacto/empresa.
Pipeline: embudo de ventas + módulo de tickets, separados pero conectados por el contacto.
Etapas (configuración posible): (ventas) Prospecto → Propuesta → Cierre; (tickets) Abierto → En atención → Resuelto.
Automatizaciones posibles: tarea de seguimiento tras el cierre de un ticket, para detectar oportunidades de venta adicional.
Integraciones posibles: formulario web de tipo "ticket" para reportes de soporte entrantes.
Beneficios: venta y soporte quedan documentados por separado, sin perder la vista unificada del cliente.
Preguntas de discovery: "¿Hoy separan de alguna forma las solicitudes de soporte de las oportunidades de venta?"
Argumento comercial: tickets y oportunidades conviven en la misma ficha de contacto sin mezclarse entre sí.
```

```
Industria: Empresas con fuerza de ventas externa
Problema: vendedores en calle que necesitan actualizar el CRM fuera de la oficina, sin depender de una computadora.
Proceso actual: notas tomadas en papel o en el teléfono personal, capturadas al sistema (si acaso) horas después.
Proceso propuesto: interfaz móvil para registrar notas, tareas y avances de oportunidad justo después de cada visita.
Pipeline: el mismo pipeline de ventas de la empresa, actualizado desde el teléfono.
Etapas: las etapas ya definidas por el negocio del cliente.
Automatizaciones posibles: tarea de seguimiento automática tras registrar una visita.
Integraciones posibles: no aplica específicamente — el valor central aquí es la interfaz móvil.
Beneficios: datos actualizados en tiempo real, sin la pérdida de información que implica capturar horas después.
Preguntas de discovery: "¿Cuánto tiempo pasa hoy entre que un vendedor visita a un cliente y que esa información llega al sistema?"
Argumento comercial: la interfaz móvil permite registrar la visita justo al salir de ella, mientras el detalle todavía está fresco.
```
