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
/** Donde vive el CRM hoy. Es el único origen que el cliente OAuth acepta. */
const DOMINIO_ACTUAL = "https://app.vinqulia.com";

/**
 * Dominios por los que se entraba antes y que siguen apuntando aquí.
 * Quitar uno rompe los enlaces que la gente tenga guardados, así que se
 * quedan hasta que dejen de recibir tráfico.
 */
const DOMINIOS_ANTERIORES = ["crm.kontrolia.io", "panel.vinqulia.com"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Genera PDFs en el servidor con dependencias nativas de Node (fontkit,
  // yoga); empaquetarlo lo rompe. Se carga tal cual desde node_modules.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Los dominios anteriores siguen asignados en Vercel, y el cliente OAuth
  // solo acepta el actual: quien entre por uno de ellos no podría iniciar
  // sesión (y crm.kontrolia.io, además, comparte cookies con
  // auth.kontrolia.io). Se mandan al dominio actual conservando la ruta, para
  // que un enlace guardado o un marcador siga funcionando.
  async redirects() {
    return DOMINIOS_ANTERIORES.map((host) => ({
      source: "/:ruta*",
      has: [{ type: "host" as const, value: host }],
      destination: `${DOMINIO_ACTUAL}/:ruta*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
