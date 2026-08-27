import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vinqulia | El sistema comercial que se adapta a tu empresa",
  description:
    "Vinqulia centraliza clientes, oportunidades, seguimiento y comunicación en un CRM que se adapta a la forma en que trabaja tu empresa. Úsalo como servicio, instálalo en tu propia infraestructura o llévalo más lejos con automatización e IA de Kontrolia.",
  applicationName: "Vinqulia",
  keywords: [
    "CRM",
    "CRM para pymes",
    "CRM para equipos comerciales",
    "CRM con WhatsApp",
    "CRM instalable en servidores propios",
    "CRM personalizable para empresas",
    "gestión de clientes",
    "pipeline de ventas",
    "seguimiento comercial",
    "captura de leads",
    "alternativa a HubSpot",
    "alternativa a Pipedrive",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b23b2e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" translate="no" className="notranslate">
      <body className="min-h-screen">
        {children}
        {/* Widget de chat de Nodia */}
        <Script
          src="https://nodia-agents.vercel.app/widget.js"
          data-bot="534072dd-b853-463f-b33c-eaa41fed9162"
          data-key="61dad282-91c8-4995-9312-115ed742e888"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
