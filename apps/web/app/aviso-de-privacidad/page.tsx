import type { Metadata } from "next";

import { PaginaLegal } from "../../components/PaginaLegal";
import { AVISO_DE_PRIVACIDAD } from "../../content/legal";
import { urlAbsoluta } from "../../lib/sitio";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Vinqulia",
  description: AVISO_DE_PRIVACIDAD.descripcion,
  alternates: { canonical: urlAbsoluta("/aviso-de-privacidad") },
  robots: { index: true, follow: false },
};

export default function Pagina() {
  return <PaginaLegal documento={AVISO_DE_PRIVACIDAD} />;
}
