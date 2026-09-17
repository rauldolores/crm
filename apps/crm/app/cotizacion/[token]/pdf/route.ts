import { cotizacionPorToken } from "@/lib/server/cotizaciones/cotizaciones";
import { generarPdfDeCotizacion } from "@/lib/server/cotizaciones/pdf";

/**
 * La cotización en PDF, por su token público: la descarga el cliente desde
 * su enlace y el equipo desde la oportunidad. No marca «vista»: descargar
 * no es abrir la página.
 */
export const runtime = "nodejs";

type Contexto = { params: Promise<{ token: string }> };

export async function GET(_peticion: Request, { params }: Contexto) {
  const { token } = await params;
  const completa = await cotizacionPorToken(token);
  if (!completa) {
    return Response.json({ message: "No encontrada." }, { status: 404 });
  }

  const pdf = await generarPdfDeCotizacion(completa);
  const nombre = `${completa.cotizacion.number}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
