Actúa como arquitecto de software, especialista en sistemas de pricing B2B, cotización de software e ingeniería de producto.

Quiero que diseñes e implementes una CALCULADORA DE PRECIOS / PRICING ENGINE reutilizable para vender software, aplicaciones, plataformas, implementaciones, desarrollos e integraciones.

IMPORTANTE:
No quiero una simple calculadora que sume conceptos.
Quiero un motor de pricing configurable que determine un precio comercial justo con base en:

1. Costo/base del producto.
2. Módulos contratados.
3. Complejidad.
4. Número de usuarios.
5. Número de empresas/RFC/entidades.
6. Volumen de operación.
7. Integraciones.
8. Migración de información.
9. Implementación.
10. Capacitación.
11. Infraestructura.
12. Soporte.
13. Nivel de servicio.
14. Urgencia.
15. Personalizaciones.
16. Valor económico generado para el cliente.
17. ROI esperado.
18. Margen mínimo deseado.
19. Segmento/tamaño del cliente.
20. Nivel de riesgo o complejidad del proyecto.

La arquitectura debe permitir reutilizar el motor para diferentes productos y proyectos sin modificar código.

--------------------------------------------------
OBJETIVO
--------------------------------------------------

El sistema debe poder recibir las características de un proyecto y devolver:

- Precio mínimo permitido.
- Precio recomendado.
- Precio premium.
- Desglose completo.
- Costo de implementación.
- Costos recurrentes.
- Descuentos permitidos.
- ROI estimado para el cliente.
- Periodo estimado de recuperación de inversión.
- Margen estimado.
- Explicación de por qué se recomienda ese precio.

El resultado debe ser determinístico:
si dos personas introducen exactamente los mismos datos, deben obtener exactamente la misma cotización.

--------------------------------------------------
CONFIGURACIÓN
--------------------------------------------------

Todos los valores económicos deben ser configurables.

NO quemes precios directamente en componentes o lógica de negocio.

Diseña una estructura de configuración que permita definir:

- productos
- licencias
- módulos
- funcionalidades
- paquetes
- integraciones
- servicios
- costos únicos
- costos recurrentes
- factores de complejidad
- factores por volumen
- factores por usuarios
- factores por empresas
- factores por urgencia
- descuentos
- márgenes
- precios mínimos
- precios máximos
- reglas comerciales
- impuestos
- monedas

Debe ser posible cambiar los precios sin modificar el código.

--------------------------------------------------
PROPUESTA INICIAL DE PRECIOS
--------------------------------------------------

Antes de implementar la configuración definitiva, analiza el modelo comercial y PROPÓN valores iniciales razonables.

No inventes precios arbitrariamente.

Para cada precio sugerido explica:

- qué estás cobrando
- por qué tiene sentido
- qué tipo de cliente soporta ese precio
- qué costo/valor representa
- qué margen busca proteger
- cuándo debería aumentar
- cuándo debería disminuir

Utiliza como referencia inicial este tipo de estructura:

LICENCIA / PRODUCTO BASE
- producto básico
- producto profesional
- producto enterprise

MÓDULOS
- módulo básico
- módulo avanzado
- módulo especializado

INTEGRACIONES
- API
- ERP
- CRM
- ecommerce
- servicios externos
- integración personalizada

SERVICIOS
- instalación
- configuración
- migración
- capacitación
- personalización
- consultoría

INFRAESTRUCTURA
- cloud administrado
- instalación on-premise
- infraestructura del cliente

RECURRENCIA
- soporte
- mantenimiento
- actualizaciones
- SLA
- administración de infraestructura

Toma como punto de partida un software B2B que puede instalarse on-premise o en cloud, pero diseña el sistema para que posteriormente pueda utilizarse para cualquier otro software.

--------------------------------------------------
MODELO DE VALOR
--------------------------------------------------

El motor debe permitir calcular el valor económico generado al cliente.

Por ejemplo:

AHORRO MENSUAL =
horas ahorradas × costo/hora
+
personal/recurso evitado
+
errores evitados
+
software sustituido
+
otros costos eliminados

BENEFICIO ANUAL =
ahorro mensual × 12
+
ingresos adicionales estimados
+
otros beneficios cuantificables

ROI =
(beneficio anual - costo anual del sistema) / costo anual del sistema

PAYBACK =
inversión inicial / beneficio mensual

Utiliza estos cálculos como una referencia comercial, no como una verdad absoluta.

--------------------------------------------------
PRECIO BASADO EN VALOR
--------------------------------------------------

El precio no debe depender exclusivamente del costo de desarrollar el software.

Implementa una estrategia que compare:

A) Precio basado en costos.
B) Precio basado en alcance.
C) Precio basado en valor.
D) Precio mínimo comercial.

El sistema debe seleccionar un precio recomendado utilizando reglas configurables.

Ejemplo conceptual:

precio_minimo =
costo_interno / (1 - margen_minimo)

precio_alcance =
licencia
+ módulos
+ servicios
+ integraciones
+ complejidad

precio_valor =
beneficio_anual × porcentaje_de_captura_del_valor

precio_recomendado =
una función configurable de esos valores.

NO asumas que esta fórmula exacta debe utilizarse.
Evalúa el modelo y propón una fórmula mejor si existe.

--------------------------------------------------
NIVELES DE PRECIO
--------------------------------------------------

Genera:

PRECIO MÍNIMO
El menor precio comercialmente aceptable.

PRECIO RECOMENDADO
El precio que debería ofrecer normalmente ventas.

PRECIO PREMIUM
Precio para proyectos donde existe alto valor, urgencia, complejidad o capacidad de pago.

El sistema debe poder definir reglas para evitar descuentos excesivos.

--------------------------------------------------
REGLAS COMERCIALES
--------------------------------------------------

Implementa un sistema de reglas configurable.

Ejemplos:

- descuento máximo permitido
- descuento que requiere autorización
- margen mínimo
- precio mínimo
- incremento por urgencia
- incremento por complejidad
- descuento por volumen
- descuento por contrato anual
- descuento por múltiples productos
- precio especial enterprise

Debe existir una explicación legible de qué reglas afectaron el precio.

Ejemplo:

"Precio base: $40,000
+ API: $10,000
+ integración ERP: $20,000
+ implementación: $15,000
+ complejidad alta: $8,000
- descuento anual: $5,000
= $88,000"

--------------------------------------------------
SALIDA
--------------------------------------------------

La calculadora debe devolver una estructura clara y reutilizable, por ejemplo:

{
  "currency": "MXN",
  "one_time": 89000,
  "recurring_monthly": 2500,
  "minimum_price": 72000,
  "recommended_price": 89000,
  "premium_price": 112000,
  "discount_limit": 10000,
  "estimated_annual_benefit": 180000,
  "roi": 1.02,
  "payback_months": 5.9,
  "margin": 0.XX,
  "items": [...],
  "rules_applied": [...],
  "explanation": "..."
}

La estructura final debe ser diseñada profesionalmente y pensada para que posteriormente pueda ser consumida por:

- frontend
- API
- CRM
- chatbot
- agente de IA
- llamada de voz
- generador de cotizaciones
- panel administrativo

--------------------------------------------------
ADMINISTRACIÓN
--------------------------------------------------

Diseña una interfaz administrativa para modificar:

- precios
- productos
- módulos
- reglas
- factores
- márgenes
- descuentos
- vigencias

Debe existir versionado o al menos historial de cambios para poder saber qué configuración produjo una cotización determinada.

Una cotización existente NO debe cambiar retroactivamente solamente porque posteriormente cambió un precio.

Cada cotización debe guardar el snapshot de la configuración utilizada.

--------------------------------------------------
COTIZACIONES
--------------------------------------------------

Permite guardar una cotización con:

- cliente
- vendedor
- fecha
- configuración utilizada
- parámetros introducidos
- precios calculados
- descuentos
- vigencia
- estado
- notas
- resultado del ROI

Debe poder regenerarse la misma cotización utilizando exactamente los mismos datos y configuración.

--------------------------------------------------
ARQUITECTURA
--------------------------------------------------

Diseña la solución como un componente independiente.

Separar claramente:

1. Pricing Engine.
2. Configuración.
3. Reglas.
4. Persistencia.
5. API.
6. UI.
7. Cotizaciones.
8. Reportes.

No mezcles lógica de pricing con la interfaz.

El motor debe poder utilizarse desde backend y API sin depender del frontend.

--------------------------------------------------
TECNOLOGÍA
--------------------------------------------------

Si no se especifica stack, propone uno adecuado.

Si existe un stack existente, respétalo.

Prioriza:

- mantenibilidad
- tipado
- pruebas
- determinismo
- trazabilidad
- extensibilidad
- seguridad
- facilidad para modificar precios
- facilidad para integrar IA posteriormente

Implementa pruebas unitarias para las reglas y escenarios principales.

--------------------------------------------------
EXPERIENCIA DEL USUARIO
--------------------------------------------------

La calculadora debe poder utilizarse como un wizard comercial.

Ejemplo:

PASO 1 — Tipo de cliente
PASO 2 — Producto
PASO 3 — Módulos
PASO 4 — Usuarios/empresas/volumen
PASO 5 — Integraciones
PASO 6 — Implementación
PASO 7 — Complejidad
PASO 8 — Beneficio económico
PASO 9 — Resultado

Al final mostrar:

"Precio recomendado"

y debajo:

- inversión inicial
- costo recurrente
- ahorro estimado
- ROI
- payback
- desglose

No muestres necesariamente al cliente final el "precio mínimo" o "precio premium"; esos valores pueden ser información exclusiva de ventas.

--------------------------------------------------
ENTREGABLE
--------------------------------------------------

Primero analiza y propone:

1. Modelo de pricing.
2. Fórmula.
3. Parámetros.
4. Reglas.
5. Precios iniciales sugeridos.
6. Arquitectura.
7. Modelo de datos.
8. API.
9. Flujo UX.

Después implementa la solución.

No simplifiques el problema convirtiéndolo en una calculadora de suma.
Construye un verdadero motor de pricing B2B reutilizable.