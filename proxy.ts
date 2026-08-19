import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * La página de un formulario público (/f/[clave]) está pensada para
 * incrustarse con un iframe en la web del cliente, un origen distinto al de
 * Vinqulia. Sin este permiso explícito, cualquier política de seguridad que
 * el hospedaje añada más adelante (X-Frame-Options, frame-ancestors) rompería
 * el iframe en todas partes sin avisar.
 */
export function proxy(_request: NextRequest) {
  const respuesta = NextResponse.next();
  respuesta.headers.set("Content-Security-Policy", "frame-ancestors *");
  return respuesta;
}

export const config = {
  matcher: "/f/:clave*",
};
