import type { DocumentoLegal } from "../content/legal";
import { BarraNavegacion } from "./BarraNavegacion";
import { PieDePagina } from "./PieDePagina";
import { Eyebrow } from "./comunes";

/**
 * Plantilla de los documentos legales: el mismo marco del sitio con el
 * texto en columna legible. Las secciones son datos (content/legal.ts).
 */
export function PaginaLegal({ documento }: { documento: DocumentoLegal }) {
  return (
    <>
      <BarraNavegacion />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          {documento.titulo}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-600">
          {documento.descripcion}
        </p>
        <div className="mt-10 space-y-8">
          {documento.secciones.map((seccion) => (
            <section key={seccion.titulo}>
              <h2 className="text-lg font-semibold text-neutral-900">
                {seccion.titulo}
              </h2>
              <div className="mt-2 space-y-3">
                {seccion.parrafos.map((parrafo) => (
                  <p
                    key={parrafo}
                    className={
                      "text-sm leading-relaxed text-neutral-700 " +
                      (parrafo.startsWith("• ") ? "pl-4" : "")
                    }
                  >
                    {parrafo}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <PieDePagina />
    </>
  );
}
