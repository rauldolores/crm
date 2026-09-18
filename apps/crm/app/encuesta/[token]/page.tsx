import type { Metadata } from "next";

import { EncuestaDeTicket } from "@/components/crm/public/EncuestaDeTicket";
import { encuestaPorToken } from "@/lib/server/tickets/encuesta";

type Props = { params: Promise<{ token: string }> };

/**
 * Página pública de la encuesta de satisfacción de un ticket: una pregunta
 * y un comentario opcional. La ve quien recibe el enlace, sin sesión.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PaginaDeEncuesta({ params }: Props) {
  const { token } = await params;
  const encuesta = await encuestaPorToken(token);

  if (!encuesta) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-center text-muted-foreground">
          Esta encuesta no existe o el enlace no es válido.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <main className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        <header className="mb-6 flex items-center gap-4">
          {encuesta.organizacion.logo ? (
            <img
              src={encuesta.organizacion.logo}
              alt={encuesta.organizacion.nombre}
              className="h-12 w-auto max-w-[160px] object-contain"
            />
          ) : null}
          {encuesta.organizacion.nombre && (
            <p className="text-lg font-semibold">
              {encuesta.organizacion.nombre}
            </p>
          )}
        </header>
        <EncuestaDeTicket token={token} encuesta={encuesta} />
      </main>
    </div>
  );
}
