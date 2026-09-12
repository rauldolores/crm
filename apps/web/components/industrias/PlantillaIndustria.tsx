import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  MessageCircle,
  Rocket,
  X,
} from "lucide-react";

import { CtaBanda, Eyebrow, Migas, TituloDeSeccion } from "../comunes";
import { MaquetaAplicacion } from "../maquetas";
import type { Industria } from "../../content/industrias/tipos";
import { URL_APP } from "../../lib/sitio";

/**
 * Plantilla de una página de industria.
 *
 * Una sola plantilla para todas: recibe el objeto de contenido y compone los
 * bloques. El contenido es lo que cambia por completo entre industrias
 * (problemas, día a día, casos de uso, objeciones, FAQ), no el marcado.
 *
 * Orden de los bloques: problema antes que producto. Primero el prospecto se
 * reconoce en su propia operación; después ve cómo se resuelve.
 */
export function PlantillaIndustria({ industria }: { industria: Industria }) {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="animar-flotar pointer-events-none absolute -left-24 top-4 size-[420px] rounded-full bg-brand-300/25 blur-3xl"
        />
        <div
          aria-hidden
          className="animar-flotar-lento pointer-events-none absolute -right-32 top-40 size-[520px] rounded-full bg-brand-200/35 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 pt-10 sm:px-8">
          <Migas
            items={[
              { nombre: "Inicio", href: "/" },
              { nombre: "Industrias", href: "/industrias" },
              { nombre: industria.nombre },
            ]}
          />

          <div className="grid items-center gap-12 pb-16 pt-10 lg:grid-cols-2 lg:pb-24">
            <div>
              <Eyebrow>{industria.hero.eyebrow}</Eyebrow>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl">
                {industria.hero.titulo}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
                {industria.hero.subtitulo}
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {industria.hero.puntos.map((punto) => (
                  <li
                    key={punto}
                    className="flex items-center gap-1.5 text-sm text-neutral-600"
                  >
                    <Check className="size-4 text-emerald-600" />
                    {punto}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={URL_APP}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  Regístrate gratis
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  {industria.hero.ctaPrincipal}
                </a>
                <span className="basis-full text-sm text-neutral-500 sm:basis-auto">
                  30 días gratis · sin tarjeta
                </span>
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-100 via-brand-50 to-transparent blur-2xl"
              />
              <MaquetaAplicacion
                columnas={industria.tablero.columnas}
                montoEnJuego={industria.tablero.montoEnJuego}
                titulo={industria.tablero.titulo}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* El problema                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="El problema"
            titulo={industria.problema.titulo}
            subtitulo={industria.problema.intro}
          />
          <div className="aparece-hijos mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industria.problema.puntos.map((punto) => (
              <div
                key={punto.titulo}
                className="borde-degradado rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <AlertTriangle className="size-5 text-amber-500" />
                <p className="mt-3 text-sm font-semibold text-neutral-900">
                  {punto.titulo}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {punto.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Un día en la operación                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Un día en la operación"
            titulo={industria.dia.titulo}
            subtitulo={industria.dia.intro}
          />
          <ol className="mx-auto mt-12 max-w-3xl">
            {industria.dia.momentos.map((momento, indice) => (
              <li
                key={momento.hora}
                className="aparece relative flex gap-5 pb-8"
              >
                {/* Línea de tiempo */}
                <div className="flex flex-col items-center">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-xs font-bold text-brand-700">
                    {momento.hora}
                  </span>
                  {indice < industria.dia.momentos.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-neutral-200" />
                  )}
                </div>
                <div className="borde-degradado flex-1 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-neutral-900">
                    {momento.titulo}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                    {momento.narrativa}
                  </p>
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    {momento.conVinqulia}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Problema → solución → beneficio                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Problema y solución"
            titulo="Qué se resuelve, cómo y para qué"
            subtitulo="Cada fila es una fricción concreta de la operación, la pieza del producto que la atiende y el resultado que se persigue."
          />
          <div className="aparece mt-12 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {[
                    "Problema real",
                    "Cómo lo resuelve Vinqulia",
                    "Beneficio",
                  ].map((columna) => (
                    <th
                      key={columna}
                      scope="col"
                      className="border-b border-neutral-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400"
                    >
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {industria.problemaSolucion.map((fila) => (
                  <tr key={fila.problema} className="align-top">
                    <td className="border-b border-neutral-100 px-4 py-4 text-sm font-medium text-neutral-800">
                      {fila.problema}
                    </td>
                    <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-600">
                      {fila.solucion}
                    </td>
                    <td className="border-b border-neutral-100 px-4 py-4 text-sm text-neutral-600">
                      {fila.beneficio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Casos de uso                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section id="casos" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Casos de uso"
            titulo="Los escenarios que más se repiten en esta industria"
            subtitulo="Cada caso incluye la funcionalidad real del producto que lo hace posible."
          />
          <div className="aparece-hijos mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industria.casosDeUso.map((caso) => (
              <div
                key={caso.titulo}
                className="borde-degradado flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-neutral-900">
                  {caso.titulo}
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-600">
                  {caso.texto}
                </p>
                <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-700">
                    Funcionalidad:
                  </span>{" "}
                  {caso.funcionalidad}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Caso práctico                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Caso práctico"
            titulo="Cómo se ve el antes y el después"
            subtitulo={industria.casoPractico.escenario}
          />
          <div className="aparece-hijos mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-100/70 p-6">
              <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Situación inicial
              </span>
              <ul className="mt-5 space-y-3">
                {industria.casoPractico.inicial.map((linea) => (
                  <li
                    key={linea}
                    className="flex items-start gap-2.5 text-sm text-neutral-600"
                  >
                    <X className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                    {linea}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-xl shadow-brand-600/5">
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Con Vinqulia
              </span>
              <ul className="mt-5 space-y-3">
                {industria.casoPractico.conVinqulia.map((linea) => (
                  <li
                    key={linea}
                    className="flex items-start gap-2.5 text-sm text-neutral-700"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {linea}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-6 flex max-w-3xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            <Info className="mt-0.5 size-4 shrink-0" />
            {industria.casoPractico.notaSimulacion}
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* ¿Para quién es?                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Encaje"
            titulo="¿Para quién es y para quién no?"
            subtitulo="Preferimos decirte con claridad cuándo este producto no es la respuesta. Ahorra tiempo a los dos lados."
          />
          <div className="aparece-hijos mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
            <div className="borde-degradado rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Check className="size-4" />
                Es para ti si…
              </p>
              <ul className="mt-4 space-y-3">
                {industria.paraQuien.si.map((linea) => (
                  <li
                    key={linea}
                    className="flex items-start gap-2.5 text-sm text-neutral-700"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-3" />
                    </span>
                    {linea}
                  </li>
                ))}
              </ul>
            </div>
            <div className="borde-degradado rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <X className="size-4 text-neutral-400" />
                Probablemente no sea para ti si…
              </p>
              <ul className="mt-4 space-y-3">
                {industria.paraQuien.no.map((linea) => (
                  <li
                    key={linea}
                    className="flex items-start gap-2.5 text-sm text-neutral-600"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                      <X className="size-3" />
                    </span>
                    {linea}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Beneficios                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Beneficios"
            titulo="De la función al resultado de negocio"
            subtitulo="Qué gana la empresa con cada capacidad, explicado en términos de operación y no de características."
          />
          <div className="aparece-hijos mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industria.beneficios.map((beneficio) => (
              <div
                key={beneficio.titulo}
                className="borde-degradado rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-neutral-900">
                  {beneficio.titulo}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {beneficio.resultado}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Comparación                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Comparación"
            titulo={industria.comparacion.titulo}
            subtitulo="Sin dramatizar: simplemente cómo se reparte el trabajo en cada caso."
          />
          <div className="aparece-hijos mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-100/70 p-6">
              <p className="text-sm font-semibold text-neutral-700">
                Forma tradicional
              </p>
              <ul className="mt-4 space-y-3">
                {industria.comparacion.tradicional.map((linea) => (
                  <li
                    key={linea}
                    className="flex items-start gap-2.5 text-sm text-neutral-600"
                  >
                    <X className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                    {linea}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-brand-200 bg-white p-6 shadow-xl shadow-brand-600/5">
              <p className="text-sm font-semibold text-brand-700">
                Con Vinqulia
              </p>
              <ul className="mt-4 space-y-3">
                {industria.comparacion.conVinqulia.map((linea) => (
                  <li
                    key={linea}
                    className="flex items-start gap-2.5 text-sm text-neutral-700"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {linea}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Objeciones                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Objeciones"
            titulo="Las dudas que aparecen antes de decidir"
            subtitulo="Respuestas directas, incluidas las que no te gustaría leer en un folleto."
          />
          <div className="aparece-hijos mt-10 space-y-3">
            {industria.objeciones.map((objecion) => (
              <details
                key={objecion.pregunta}
                className="borde-degradado group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                  {objecion.pregunta}
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-transform group-open:rotate-45">
                    <span className="text-base leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {objecion.respuesta}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section id="faq" className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <TituloDeSeccion
            eyebrow="Preguntas frecuentes"
            titulo={
              "Preguntas frecuentes sobre " + industria.nombre.toLowerCase()
            }
            subtitulo=""
          />
          <div className="aparece-hijos mt-10 space-y-3">
            {industria.faq.map((pregunta) => (
              <details
                key={pregunta.pregunta}
                className="borde-degradado group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                  {pregunta.pregunta}
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-transform group-open:rotate-45">
                    <span className="text-base leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {pregunta.respuesta}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Oportunidades futuras (lo que el producto HOY no hace)           */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-amber-200/70 bg-amber-50/50 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="aparece">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              Oportunidad futura de producto
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
              Lo que este sector suele pedir y hoy no está disponible
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Estas capacidades no forman parte del producto actual. Las
              listamos porque son las peticiones más frecuentes de esta
              industria y algunas pueden abordarse como integración o desarrollo
              a medida; no las presentamos como funcionalidades existentes.
            </p>
          </div>
          <div className="aparece-hijos mt-8 space-y-3">
            {industria.oportunidadesFuturas.map((futura) => (
              <div
                key={futura.titulo}
                className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Rocket className="size-4 text-amber-600" />
                  {futura.titulo}
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800">
                    No disponible hoy
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {futura.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Demo (el formulario vive en la portada)                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="demo" className="py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <div className="aparece rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <MessageCircle className="mx-auto size-10 text-brand-600" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
              Cuéntanos cómo opera tu negocio
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">
              La demo se prepara sobre tu operación real: cuántas personas
              venden, por dónde llegan los clientes y qué siguen usando hoy. Son
              cuatro datos para empezar.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/#demo"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
              >
                {industria.hero.ctaPrincipal}
                <ArrowRight className="size-4" />
              </a>
              <a
                href="/industrias"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Ver otras industrias
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CTA final                                                        */}
      {/* ---------------------------------------------------------------- */}
      <CtaBanda
        eyebrow={industria.cta.eyebrow}
        titulo={industria.cta.titulo}
        subtitulo={industria.cta.subtitulo}
        boton={industria.cta.boton}
      />
    </>
  );
}
