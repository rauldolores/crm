import { ImageResponse } from "next/og";

export const alt = "Vinqulia — El sistema comercial que se adapta a tu empresa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagen que sale al compartir la portada en WhatsApp, LinkedIn o X. Se
 * genera en el borde con next/og; sin ella, el enlace se comparte como
 * texto plano. Las páginas de industria y Enterprise ya traen su propio
 * Open Graph textual; esta imagen es la de respaldo para todo el sitio.
 */
export default function Imagen() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background:
          "linear-gradient(135deg, #fff7f5 0%, #ffffff 55%, #fbe9e6 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#171717",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "#b23b2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          v
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
          vinqulia
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          El sistema comercial que se adapta a tu empresa
        </div>
        <div style={{ fontSize: 30, color: "#525252", maxWidth: 1000 }}>
          Contactos, oportunidades, seguimiento y comunicación en un solo lugar.
          Con WhatsApp, automatizaciones e IA.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          color: "#737373",
        }}
      >
        <span>vinqulia.com</span>
        <span>30 días gratis · planes desde $499 MXN al mes</span>
      </div>
    </div>,
    size,
  );
}
