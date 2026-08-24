import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vinqulia — CRM para equipos comerciales",
  description:
    "Vinqulia centraliza contactos, empresas, oportunidades y tareas en un solo lugar. Pipeline Kanban, captura de leads, WhatsApp, correo, automatizaciones e informes listos para usar.",
  applicationName: "Vinqulia",
  keywords: [
    "CRM",
    "CRM open source",
    "gestión de contactos",
    "pipeline de ventas",
    "kanban",
    "WhatsApp",
    "captura de leads",
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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
