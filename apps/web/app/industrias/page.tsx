import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BarraNavegacion } from "../../components/BarraNavegacion";
import { PieDePagina } from "../../components/PieDePagina";
import { CtaBanda, Eyebrow, Migas } from "../../components/comunes";
import { HOJA_DE_RUTA, INDUSTRIAS, iconoDeIndustria } from "../../content/industrias";
import { urlAbsoluta } from "../../lib/sitio";

export const metadata: Metadata = {
  title: "Industrias | Vinqulia",
  description:
    "Cómo Vinqulia se adapta a la operación comercial de cada industria: distribuidoras, servicios profesionales y más. Problemas reales, casos de uso y objeciones de cada sector.",
  alternates: { canonical: urlAbsoluta("/industrias") },
  openGraph: {
    title: "Industrias | Vinqulia",
    description:
      "Soluciones comerciales por industria: qué problemas resuelve Vinqulia en cada tipo de negocio.",
    url: urlAbsoluta("/industrias"),
    siteName: "Vinqulia",
    locale: "es_MX",
    type: "website",
  },
};

export default function PaginaIndustrias() {
  return (
    <>
      <BarraNavegacion />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="animar-flotar pointer-events-none absolute -left-24 top-4 size-[420px] rounded-full bg-brand-300/25 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-5 pt-10 sm:px-8">
            <Migas
              items={[{ nombre: "Inicio", href: "/" }, { nombre: "Industrias" }]}
            />
            <div className="aparece mx-auto max-w-3xl pb-12 pt-12 text-center">
              <Eyebrow>Industrias</Eyebrow>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                Un mismo sistema, adaptado a cómo vende cada negocio
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-neutral-600">
                Un CRM genérico obliga a la empresa a traducir su operación a un
                formato ajeno. Aquí explicamos, industria por industria, qué
                problemas reales resuelve Vinqulia y con qué funcionalidades
                concretas.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="aparece-hijos grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRIAS.map((industria) => {
                const Icono = iconoDeIndustria(industria.icono);
                return (
                  <Link
                    key={industria.slug}
                    href={"/industrias/" + industria.slug}
                    className="borde-degradado group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 no-underline shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <Icono className="size-5" />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-neutral-900">
                      {industria.nombre}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                      {industria.resumen}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                      Ver la solución
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Hoja de ruta: solo aparece si queda alguna industria pendiente. */}
            {HOJA_DE_RUTA.length > 0 && (
            <div className="aparece mt-16 rounded-3xl border border-neutral-200 bg-white/70 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                En preparación
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
                Industrias que vienen después
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">
                Publicamos una industria cuando su página puede hablar con
                propiedad de su operación. Estas están priorizadas y aún no
                tienen página; las mostramos para que sepas qué sigue en lugar
                de dejar enlaces vacíos.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {HOJA_DE_RUTA.map((futura) => {
                  const Icono = iconoDeIndustria(futura.icono);
                  return (
                    <div
                      key={futura.nombre}
                      className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-4"
                    >
                      <div className="flex items-center gap-2">
                        <Icono className="size-4 text-neutral-400" />
                        <p className="text-sm font-semibold text-neutral-700">
                          {futura.nombre}
                        </p>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                        {futura.porQue}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        </section>

        <CtaBanda
          eyebrow="Siguiente paso"
          titulo="¿No ves tu industria en la lista?"
          subtitulo="Cuéntanos cómo vendes y lo evaluamos contigo. Si tu operación tiene un proceso comercial que seguir, probablemente Vinqulia encaje."
          boton="Quiero una demo personalizada"
        />
      </main>

      <PieDePagina />
    </>
  );
}
