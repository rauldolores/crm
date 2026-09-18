import type { Metadata } from "next";

import { PaginaLegal } from "../../components/PaginaLegal";
import { TERMINOS } from "../../content/legal";
import { urlAbsoluta } from "../../lib/sitio";

export const metadata: Metadata = {
  title: "Términos y condiciones | Vinqulia",
  description: TERMINOS.descripcion,
  alternates: { canonical: urlAbsoluta("/terminos") },
  robots: { index: true, follow: false },
};

export default function Pagina() {
  return <PaginaLegal documento={TERMINOS} />;
}
