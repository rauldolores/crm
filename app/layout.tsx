import type { Metadata, Viewport } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  title: "Vinqulia",
  applicationName: "Vinqulia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `translate="no"` evita que el traductor del navegador reescriba la
  // interfaz: la aplicación ya está en español y su traducción automática
  // rompe los textos con variables.
  return (
    <html lang="es" translate="no" className="notranslate">
      <body>{children}</body>
    </html>
  );
}
