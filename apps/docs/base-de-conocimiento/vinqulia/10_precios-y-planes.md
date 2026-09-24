```yaml
product: Vinqulia
category: precios-y-planes
audience: comercial
priority: alta
source: catálogo de planes de KontrolIA Auth (app crm), replicado en apps/web/content/planes.ts y apps/web/content/enterprise.ts
last_verified: 2026-09-24
sensitivity: >-
  Precios públicos: se pueden decir tal cual. Descuentos y condiciones
  contractuales, no: se escalan.
```

# Vinqulia — Precios y planes

Precios públicos en **MXN, sin IVA**. Cuatro planes; los tres primeros se compran con tarjeta desde la propia aplicación, Enterprise se cotiza. Se puede dar la cifra sin escalar; lo que no se improvisa es un descuento.

## Planes

| Plan | Al mes | Al año (≈2 meses gratis) | Usuarios | Contactos nuevos/mes | Embudos |
|---|---|---|---|---|---|
| **Impulso** | $499 | $4,990 | 3 | 150 | 1 |
| **Pro** (el más vendido) | $999 | $9,990 | 10 | 400 | 5 |
| **Max** | $1,999 | $19,990 | 25 | 1,000 | 15 |
| **Enterprise** | cotizado | — | 50+ / ilimitados | sin límite | sin límite |

El límite de contactos es de **altas nuevas por mes**, no de base total: los que ya están no caducan ni se borran.

**Qué añade cada salto** (el detalle completo, en [[02_funcionalidades]]):

- **Impulso**: contactos, empresas, oportunidades, un embudo Kanban, tareas, notas, panel, formularios web, versión móvil (PWA), soporte estándar.
- **Pro**: importación CSV/JSON, WhatsApp y correo desde la ficha con dominio propio, automatizaciones, plantillas de correo, informes, vistas guardadas y campos personalizados, tickets, módulo Clientes (contratos y renovaciones), cotizaciones, API + webhooks, asistente de IA por MCP, migración básica.
- **Max**: procesos personalizados con acompañamiento, automatizaciones avanzadas, integración con facturación/ERP/tienda, configuración guiada, más control de permisos, soporte prioritario.
- **Enterprise**: instancia dedicada (base, dominio y respaldos propios), en nuestra nube o en los servidores del cliente, SLA con responsable asignado, SSO e integraciones a medida.

## Prueba

**30 días en Impulso.** Se registra tarjeta al empezar y no se cobra nada hasta que termina; se cancela antes y no hay cargo. Pro y Max no tienen prueba: se contratan directo (quien viene de la prueba cambia de plan sin perder datos). Alta autoservicio en **app.vinqulia.com**.

## Facturación

Mensual o anual, a elección, en MXN y con tarjeta (Stripe, vía KontrolIA Auth). El anual equivale a 10 mensualidades: ~17 % de ahorro. Se factura CFDI con los datos fiscales que registre el cliente. Cambio de plan en cualquier momento; al cancelar, el servicio sigue hasta el final del periodo pagado.

## Enterprise

Licencia **anual** por banda de usuarios y modalidad:

| Banda | Nube dedicada | En tus servidores |
|---|---|---|
| Hasta 50 usuarios | $79,000 | $99,000 |
| Hasta 150 usuarios | $129,000 | $159,000 |
| Ilimitados | $199,000 | $249,000 |

- **Implementación**: $45,000 pago único (configuración, migración, usuarios y capacitación).
- **Trabajo fuera del alcance base** (integraciones a medida): $1,500/hora.
- **Descuentos existentes**, pero los aplica un especialista, no el agente: 10 % a dos años, 15 % a tres, y 20 % de fundador para los primeros 3 clientes Enterprise a cambio de ser caso de éxito.
- Quien quiera hacer sus cuentas antes de hablar: calculadora en **vinqulia.com/enterprise**.

## Costos que no cobra Vinqulia

WhatsApp (Twilio) y el envío de correo con dominio propio (Resend/Postmark) se pagan en la cuenta del cliente con esos proveedores; Vinqulia no los revende. La **IA viene incluida** (nuestra cuenta, modelo económico) y no se cobra aparte; si el cliente quiere otro modelo, pone su propia clave y paga ese consumo a su proveedor.

## Lo que sigue escalándose

Descuentos fuera de los publicados, condiciones contractuales, plazos de implementación comprometidos y precios para volúmenes fuera de tabla. Ver [[12_escalamiento]].
