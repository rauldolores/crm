"use client";

import dynamic from "next/dynamic";

/**
 * Punto de entrada del CRM.
 *
 * Se carga sin renderizado en servidor a propósito: ra-core y
 * shadcn-admin-kit dependen de APIs del navegador (localStorage, el enrutador
 * por hash, la sesión de Supabase) y no tienen equivalente en servidor.
 * Intentar prerenderizarlos rompe la compilación.
 *
 * El servidor de Next no está aquí para pintar estas pantallas, sino para
 * ofrecer rutas /api donde validar el token de KontrolIA Auth y hablar con la
 * base de datos con credenciales propias.
 */
const Aplicacion = dynamic(
  () => import("@/components/crm/root/CRM").then((m) => m.CRM),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    ),
  },
);

export default function Pagina() {
  return <Aplicacion />;
}
