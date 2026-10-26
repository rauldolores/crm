import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "../src/index.css";

// Solo para el wordmark (layout/MarcaVinqulia.tsx), como en AduaniaX: la
// familia de marca del ecosistema Kontrolia.
const marca = Manrope({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-marca",
});

export const metadata: Metadata = {
  title: "Vinqulia",
  applicationName: "Vinqulia",
  manifest: "/manifest.json",
  icons: {
    icon: "/vinqulia-favicon.png",
    shortcut: "/vinqulia-favicon.png",
    apple: "/appIcon/180.png",
  },
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
    <html lang="es" translate="no" className={`notranslate ${marca.variable}`}>
      <body>{children}</body>
    </html>
  );
}
