# Vinqulia · Sitio público

Página pública de Vinqulia: describe el producto y ayuda a venderlo. Es un
app Next.js independiente del CRM (que vive en la raíz del repositorio), para
que el sitio de ventas pueda desplegarse por separado y sin autenticación.

## Requisitos

- Node 22 o superior

## Ejecutar en desarrollo

```sh
cd apps/web
npm install
npm run dev
```

Se sirve en <http://localhost:4000> (el CRM usa el puerto 3001, así que no
chocan).

## Producción

```sh
cd apps/web
npm run build
npm run start
```

## Estructura

- `app/page.tsx` — la página de ventas completa (hero, funciones, producto,
  integraciones, cómo empezar, FAQ y llamada a la acción).
- `app/globals.css` — tema claro con la rampa de marca (carmesí) del CRM.
- `app/layout.tsx` — metadatos y estructura base.
