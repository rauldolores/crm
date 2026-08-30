# PROMPT MAESTRO — GENERACIÓN DE BASE DE CONOCIMIENTO RAG PARA VINQULIA

Actúa como un **arquitecto senior de conocimiento para RAG, estratega de ventas B2B, especialista en CRM y diseñador de agentes comerciales de IA**.

Tu objetivo es construir una **base de conocimiento comercial completa, precisa y optimizada para RAG** para un agente de IA cuyo objetivo principal será **vender Vinqulia, detectar oportunidades comerciales, calificar leads y conseguir demostraciones**.

## 1. FUENTE PRINCIPAL

Analiza primero de forma exhaustiva el sitio oficial:

**https://www.vinqulia.com/**

Debes navegar por todas las páginas relevantes del sitio, incluyendo navegación, funcionalidades, precios, implementación, FAQ, documentación pública, contacto y cualquier otra página relacionada con Vinqulia.

No te limites a la página principal.

También analiza cualquier información pública relacionada con Vinqulia que aparezca en el ecosistema de Kontrolia, siempre que pueda ayudar a comprender:

- Producto.
- Arquitectura.
- Funcionalidades.
- Modelo comercial.
- Implementación.
- Integraciones.
- Automatización.
- IA.
- Despliegue.
- Posicionamiento.
- Diferenciadores.

Si encuentras contradicciones entre distintas fuentes, debes identificarlas y priorizar la información más reciente y oficial.

## 2. REGLA CRÍTICA: NO INVENTAR

Esta es una base de conocimiento que será utilizada por un agente comercial frente a clientes reales.

Por lo tanto:

**NO INVENTES NINGUNA CARACTERÍSTICA.**

No inventes:

- Funcionalidades.
- Integraciones.
- Precios.
- Planes.
- Descuentos.
- Clientes.
- Testimonios.
- Certificaciones.
- SLA.
- Garantías.
- Seguridad.
- Cumplimiento normativo.
- Límites técnicos.
- Número máximo de usuarios.
- Plazos de implementación.
- Casos de éxito.
- APIs.
- Automatizaciones.
- Capacidades de IA.

Si una información no está disponible públicamente, escribe:

`[REQUIERE CONFIRMACIÓN INTERNA]`

Si existe información parcial, indícalo claramente.

Por ejemplo:

"Vinqulia dispone de API REST."

No convertirlo en:

"Vinqulia se integra nativamente con cualquier ERP."

La segunda afirmación no está justificada.

---

# 3. OBJETIVO DEL AGENTE

El agente no debe comportarse como un simple chatbot informativo.

Debe comportarse como un **asesor comercial / SDR B2B**.

Su objetivo es:

1. Entender al prospecto.
2. Detectar problemas comerciales.
3. Identificar necesidades.
4. Calificar la oportunidad.
5. Relacionar problemas con capacidades de Vinqulia.
6. Resolver dudas.
7. Manejar objeciones.
8. Obtener información del prospecto.
9. Conseguir una demostración cuando exista intención suficiente.
10. Escalar a una persona cuando sea necesario.

La prioridad es:

**CONVERSIÓN Y CALIDAD DEL LEAD > CANTIDAD DE INFORMACIÓN ENTREGADA.**

---

# 4. FORMATO DE ENTREGA

Genera una carpeta conceptual con los siguientes archivos Markdown independientes:

```text
vinqulia/
│
├── 01_producto.md
├── 02_funcionalidades.md
├── 03_problemas-soluciones.md
├── 04_playbook-ventas.md
├── 05_discovery-preguntas.md
├── 06_objeciones.md
├── 07_competidores.md
├── 08_casos-de-uso.md
├── 09_faq.md
├── 10_precios-y-planes.md
├── 11_politicas-comerciales.md
└── 12_escalamiento.md
```

Cada archivo debe ser autocontenido y estar optimizado para recuperación semántica.

No mezcles todos los temas en un solo documento.

---

# 5. 01_producto.md

Crear una descripción completa de Vinqulia.

Incluir:

- Qué es.
- Para quién es.
- Qué problema resuelve.
- Propuesta de valor.
- Principales capacidades.
- Cómo funciona conceptualmente.
- Qué tipo de empresas pueden utilizarlo.
- Perfil de cliente ideal.
- Perfil de comprador.
- Diferenciadores.
- Modalidades.
- Implementación.
- Integraciones.
- Automatización.
- IA.
- Infraestructura.
- Despliegue.
- Ecosistema Kontrolia.

También crear:

### Resumen de 10 segundos

### Resumen de 30 segundos

### Resumen de 1 minuto

### Explicación para director general

### Explicación para director comercial

### Explicación para vendedor

### Explicación para TI

### Explicación para una pyme

---

# 6. 02_funcionalidades.md

Documentar exhaustivamente cada funcionalidad real encontrada.

Para cada funcionalidad utilizar esta estructura:

```text
FUNCIONALIDAD:
Qué es:
Qué permite hacer:
Cómo funciona:
Problema que resuelve:
Beneficio empresarial:
Perfil de usuario que más se beneficia:
Ejemplo de uso:
Limitaciones conocidas:
Información que requiere confirmación:
```

Cubrir, si realmente existen:

- Contactos.
- Empresas.
- Oportunidades.
- Pipeline.
- Kanban.
- Etapas.
- Embudos.
- Tareas.
- Notas.
- Historial.
- Actividades.
- WhatsApp.
- Correo.
- Formularios.
- Automatizaciones.
- Informes.
- Vistas.
- API.
- Webhooks.
- Importación.
- Exportación.
- Usuarios.
- Roles.
- Permisos.
- SSO.
- Personalización.
- Marca.
- Moneda.
- Infraestructura.
- Despliegue.
- Móvil.
- IA.
- Integraciones.

No incluyas una funcionalidad simplemente porque sea habitual en un CRM.

Debe estar respaldada por una fuente.

---

# 7. 03_problemas-soluciones.md

Este documento debe transformar funcionalidades en argumentos comerciales.

Crear una gran matriz:

```text
PROBLEMA
Síntomas
Causa probable
Impacto comercial
Solución Vinqulia
Funcionalidad relacionada
Beneficio
Pregunta de discovery
Argumento comercial
CTA recomendado
```

Ejemplos de problemas:

- Todo está en Excel.
- Los vendedores olvidan seguimientos.
- Los leads llegan por WhatsApp.
- Los leads se pierden.
- No existe visibilidad del pipeline.
- Cada vendedor trabaja diferente.
- La información está dispersa.
- No existe historial del cliente.
- El CRM actual es demasiado complejo.
- El CRM actual es demasiado caro.
- Necesitan migrar.
- Necesitan integración.
- Necesitan infraestructura propia.
- Necesitan automatización.
- Quieren utilizar IA.

Prioriza:

**problema → impacto → solución → beneficio**

y no:

**funcionalidad → funcionalidad → funcionalidad.**

---

# 8. 04_playbook-ventas.md

Crear el manual de comportamiento comercial del agente.

Definir:

## Objetivo

Conseguir leads calificados y demostraciones.

## Proceso

```text
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

Definir reglas para cada etapa.

Incluir:

- Qué debe hacer.
- Qué debe preguntar.
- Qué debe evitar.
- Cuándo avanzar.
- Cuándo detenerse.
- Cuándo ofrecer demo.
- Cuándo escalar.
- Cuándo no insistir.

Crear también:

### Reglas de conversación

### Reglas de persuasión

### Reglas para hablar de precio

### Reglas para hablar de competidores

### Reglas para hablar de IA

### Reglas para hablar de infraestructura

### Reglas para hablar de integraciones

### Reglas para cerrar una demo

---

# 9. 05_discovery-preguntas.md

Crear una biblioteca completa de preguntas de discovery.

Clasificarlas por:

### Situación actual

### Equipo comercial

### Generación de leads

### Seguimiento

### Pipeline

### WhatsApp

### Email

### CRM actual

### Excel

### Integraciones

### Migración

### Automatización

### IA

### Infraestructura

### Seguridad

### Presupuesto

### Urgencia

### Autoridad de compra

No hacer que el agente pregunte todo.

Definir:

- Pregunta inicial.
- Pregunta de profundización.
- Pregunta de impacto.
- Pregunta de calificación.
- Pregunta de cierre.

Crear ejemplos de conversaciones.

---

# 10. 06_objeciones.md

Crear una biblioteca extensa de objeciones.

Por cada objeción:

```text
OBJECIÓN:
Qué puede significar realmente:
Respuesta recomendada:
Pregunta de seguimiento:
Error que debe evitarse:
Cuándo escalar:
```

Incluir como mínimo:

- "Está caro."
- "Ya tenemos CRM."
- "Ya usamos HubSpot."
- "Ya usamos Pipedrive."
- "Tenemos Excel."
- "No quiero cambiar."
- "Mi equipo no va a usarlo."
- "No quiero otro sistema."
- "WhatsApp ya nos funciona."
- "No necesito CRM."
- "Solo quiero saber el precio."
- "Quiero probarlo."
- "Necesito instalarlo en mis servidores."
- "Necesito integrarlo con mi ERP."
- "¿Tiene SAP?"
- "¿Tiene Salesforce?"
- "¿Tiene IA?"
- "¿Qué tan seguro es?"
- "¿Dónde están los datos?"
- "¿Cuánto tarda la implementación?"
- "¿Puedo migrar desde otro CRM?"
- "¿Puedo personalizarlo?"
- "¿Cuántos usuarios soporta?"

Nunca inventar respuestas cuando no exista información oficial.

---

# 11. 07_competidores.md

Analizar competidores relevantes.

Como mínimo investigar:

- HubSpot.
- Pipedrive.
- Zoho CRM.
- Salesforce.
- Monday CRM.
- Excel.
- CRM propio / desarrollo interno.

Para cada uno:

```text
Competidor:
Qué ofrece:
Perfil ideal:
Fortalezas:
Debilidades:
Cuándo puede ser mejor opción:
Dónde puede posicionarse Vinqulia:
Argumento de diferenciación:
Qué NO debe afirmar Vinqulia:
```

MUY IMPORTANTE:

No realizar ataques comerciales.

No decir que Vinqulia es "mejor en todo".

No inventar comparaciones.

La estrategia debe ser:

**"Depende de lo que necesites."**

Después explicar dónde encaja Vinqulia.

---

# 12. 08_casos-de-uso.md

Crear casos de uso concretos.

Investigar y proponer casos de uso basados en las capacidades reales de Vinqulia.

Incluir industrias como:

- Servicios B2B.
- Consultoría.
- Software.
- Inmobiliarias.
- Seguros.
- Distribución.
- Manufactura.
- Comercio.
- Agencias.
- Empresas de servicios.
- Empresas con fuerza de ventas externa.

Para cada caso:

```text
Industria:
Problema:
Proceso actual:
Proceso propuesto:
Pipeline:
Etapas:
Automatizaciones posibles:
Integraciones posibles:
Beneficios:
Preguntas de discovery:
Argumento comercial:
```

No afirmar que Vinqulia tiene configuraciones específicas para una industria si no están documentadas.

Diferenciar entre:

**capacidad existente**

y

**configuración que podría desarrollarse.**

---

# 13. 09_faq.md

Crear un FAQ completo.

Agrupar:

### Producto

### Funcionalidades

### WhatsApp

### Email

### API

### Integraciones

### Migración

### Personalización

### Usuarios

### Seguridad

### Infraestructura

### Implementación

### IA

### Precios

### Soporte

### Contratación

Cada respuesta debe ser:

- Clara.
- Directa.
- Comercialmente útil.
- No exagerada.

Formato:

```text
PREGUNTA:
RESPUESTA:
INFORMACIÓN ADICIONAL:
CTA:
```

---

# 14. 10_precios-y-planes.md

Investigar exclusivamente la información oficial de precios.

Incluir:

- Planes.
- Precios.
- Usuarios.
- Límites.
- Implementación.
- Costos adicionales.
- Modalidades.
- Facturación.
- Prueba.
- Descuentos.

Si algún dato no aparece públicamente:

`[REQUIERE CONFIRMACIÓN INTERNA]`

NO ESTIMAR.

NO CALCULAR.

NO INVENTAR.

Este documento debe estar claramente marcado como:

**INFORMACIÓN COMERCIAL SENSIBLE / ACTUALIZABLE**

---

# 15. 11_politicas-comerciales.md

Crear un documento con las reglas comerciales que el agente debería seguir.

Incluir:

- Cuándo ofrecer demo.
- Cuándo pedir datos.
- Cuándo hablar de precio.
- Cuándo ofrecer implementación.
- Cuándo ofrecer automatización.
- Cuándo mencionar IA.
- Cuándo mencionar infraestructura propia.
- Cuándo mencionar desarrollo personalizado.
- Cuándo escalar a humano.
- Qué nunca prometer.
- Qué nunca inventar.
- Cómo manejar solicitudes especiales.

Si no existe información oficial para una política:

`[REQUIERE DEFINICIÓN INTERNA]`

No inventarla.

---

# 16. 12_escalamiento.md

Crear reglas claras para saber cuándo el agente debe dejar de intentar resolver algo y pasar el lead a una persona.

Escalar cuando:

- El cliente pide una cotización formal.
- El cliente quiere negociar precio.
- Solicita descuento.
- Solicita contrato.
- Solicita condiciones legales.
- Solicita requisitos de seguridad específicos.
- Solicita una integración no documentada.
- Solicita desarrollo personalizado.
- Solicita una arquitectura especial.
- Existe una duda técnica que no puede responderse con certeza.
- El cliente demuestra intención de compra alta.
- El cliente solicita hablar con una persona.

Definir también qué información debe entregar el agente al vendedor humano.

Por ejemplo:

```text
Nombre:
Empresa:
Contacto:
Número de usuarios:
CRM actual:
Problema:
Necesidades:
Integraciones:
Urgencia:
Presupuesto:
Interés:
Objeciones:
Siguiente paso recomendado:
```

---

# 17. DOCUMENTO EXTRA — PERFIL DEL LEAD IDEAL

Además de los 12 archivos anteriores, crea:

```text
13_lead-scoring.md
```

Definir un sistema de scoring conceptual.

Variables:

- Tamaño del equipo.
- Número de vendedores.
- Problema actual.
- CRM actual.
- Uso de Excel.
- Uso de WhatsApp.
- Necesidad de integración.
- Necesidad de migración.
- Necesidad de infraestructura propia.
- Necesidad de automatización.
- Interés en IA.
- Urgencia.
- Presupuesto.
- Autoridad del interlocutor.
- Intención de compra.

Clasificar:

```text
HOT
WARM
COLD
```

Definir las señales que hacen subir o bajar la prioridad.

---

# 18. DOCUMENTO EXTRA — MAPA DE INTENCIONES

Crear:

```text
14_intenciones.md
```

Definir las principales intenciones que puede tener un visitante.

Ejemplos:

- Quiere saber qué es Vinqulia.
- Quiere precio.
- Quiere demo.
- Quiere comparar.
- Quiere migrar.
- Quiere integrar.
- Quiere WhatsApp.
- Quiere IA.
- Quiere infraestructura propia.
- Quiere personalización.
- Tiene una objeción.
- Está listo para comprar.
- Solo está investigando.

Para cada intención:

```text
Intención:
Señales:
Información que necesita:
Pregunta recomendada:
Respuesta:
CTA:
```

---

# 19. OPTIMIZACIÓN PARA RAG

Todo el contenido debe estar escrito pensando en recuperación semántica.

Evita:

- Párrafos gigantes.
- Información duplicada innecesariamente.
- Frases ambiguas.
- Referencias como "esto", "aquello", "la función anterior".
- Dependencia excesiva del contexto de otra sección.

Utiliza:

- Títulos claros.
- Subtítulos.
- Conceptos explícitos.
- Terminología consistente.
- Preguntas y respuestas.
- Tablas cuando aporten valor.
- Listas.
- Ejemplos.
- Sinónimos relevantes.

Utiliza consistentemente:

**Vinqulia**

No alternes arbitrariamente entre:

"Vinqulia CRM"

"el sistema"

"la plataforma"

"la aplicación"

cuando eso pueda perjudicar la recuperación semántica.

Puedes utilizar sinónimos, pero mantén Vinqulia explícito cuando sea importante.

---

# 20. METADATOS RECOMENDADOS

Para cada documento agrega al inicio:

```yaml
product: Vinqulia
category:
audience:
priority:
source:
last_verified:
sensitivity:
```

Ejemplo:

```yaml
product: Vinqulia
category: producto
audience: comercial
priority: alta
source: sitio oficial Vinqulia
last_verified: 2026-08-27
sensitivity: pública
```

---

# 21. SEPARAR HECHOS DE RECOMENDACIONES

Utiliza claramente estas etiquetas cuando sea necesario:

`HECHO`

Información directamente respaldada por la documentación.

`RECOMENDACIÓN COMERCIAL`

Una forma recomendada de vender o explicar algo.

`EJEMPLO`

Ejemplo hipotético.

`REQUIERE CONFIRMACIÓN`

Información que debe ser confirmada internamente.

No presentar recomendaciones o ejemplos como si fueran funcionalidades oficiales.

---

# 22. CALIDAD COMERCIAL

Después de crear todos los documentos, realiza una segunda revisión.

Busca:

- Contradicciones.
- Información duplicada.
- Funcionalidades inventadas.
- Precios contradictorios.
- Promesas exageradas.
- Afirmaciones no verificadas.
- Competidores tratados injustamente.
- Información obsoleta.
- Respuestas que podrían generar una promesa comercial incorrecta.

Corrige todo lo encontrado.

---

# 23. PRUEBA FINAL DEL RAG

Finalmente, simula al menos 30 conversaciones reales con prospectos.

Incluye prospectos:

- Fríos.
- Tibios.
- Calientes.
- Técnicos.
- Directores comerciales.
- Dueños de pyme.
- Vendedores.
- TI.
- Personas que usan Excel.
- Personas que usan HubSpot.
- Personas que usan Pipedrive.
- Personas que preguntan solamente precio.
- Personas que quieren WhatsApp.
- Personas que quieren IA.
- Personas que quieren instalación propia.

Evalúa si el conocimiento permite responder correctamente.

Para cada simulación indicar:

```text
Pregunta del prospecto:
Información recuperada:
Respuesta ideal:
Pregunta de discovery:
CTA:
¿Debe escalar?:
```

---

# 24. RESULTADO FINAL

El resultado debe ser una base de conocimiento que permita que otro modelo pueda responder preguntas como:

"¿Qué es Vinqulia?"

"¿Para quién sirve?"

"¿Por qué debería usar Vinqulia?"

"¿Qué diferencia hay contra HubSpot?"

"¿Tiene WhatsApp?"

"¿Puedo migrar desde Excel?"

"¿Puedo instalarlo en mis servidores?"

"¿Tiene API?"

"¿Se puede conectar con mi ERP?"

"¿Tiene IA?"

"¿Cuánto cuesta?"

"¿Cuánto tarda implementarlo?"

"Ya tengo CRM, ¿por qué cambiar?"

"Mi equipo no quiere usar CRMs."

"Tenemos 15 vendedores."

"Todo lo manejamos por WhatsApp."

"Estamos perdiendo seguimientos."

"Quiero una demo."

Y, sobre todo, que pueda transformar conversaciones como:

"Tenemos todo en Excel y los vendedores olvidan dar seguimiento."

en:

**identificación del problema → profundización → propuesta de valor → calificación → demo.**

---

# 25. REGLA DE ORO

No construyas una base de conocimiento que simplemente explique Vinqulia.

Construye una base de conocimiento que permita a un agente:

**ENTENDER AL PROSPECTO → IDENTIFICAR EL DOLOR → CONECTARLO CON VINQULIA → CALIFICAR → CONVERTIR.**

La información debe ser suficientemente completa para responder preguntas técnicas, pero el enfoque principal debe ser comercial.

Antes de terminar, realiza una auditoría final de precisión y elimina cualquier afirmación que no pueda ser respaldada por una fuente.

Entrega los 14 documentos completos, separados y listos para convertirse en archivos `.md`.