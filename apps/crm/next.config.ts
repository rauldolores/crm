import type { NextConfig } from "next";

/**
 * Vinqulia se ejecuta como aplicación de cliente dentro de Next.
 *
 * El CRM está construido sobre ra-core y shadcn-admin-kit, que son de
 * navegador: gestionan su propio enrutado, su caché y su sesión. Next aporta
 * lo que faltaba y es la razón de la migración: un servidor donde validar el
 * token de KontrolIA Auth y desde el que hablar con la base de datos con
 * credenciales propias, igual que hace Faqturia. Sin él, la única alternativa
 * era que la base del cliente confiara en el emisor del auth.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Genera PDFs en el servidor con dependencias nativas de Node (fontkit,
  // yoga); empaquetarlo lo rompe. Se carga tal cual desde node_modules.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
