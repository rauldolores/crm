import type { Metadata } from "next";
import { ArrowRight, Check, Minus, Server, Cloud } from "lucide-react";

import { BarraNavegacion } from "../../components/BarraNavegacion";
import { PieDePagina } from "../../components/PieDePagina";
import { Eyebrow, TituloDeSeccion } from "../../components/comunes";
import { CotizadorEnterprise } from "../../components/enterprise/CotizadorEnterprise";
import {
  BANDAS,
  CUPOS_FUNDADOR,
  DESCUENTO_2_ANIOS,
  DESCUENTO_3_ANIOS,
  DESCUENTO_FUNDADOR,
  DESDE,
  IMPLEMENTACION_BASE,
  IMPLEMENTACION_INCLUYE,
  INCLUYE,
  MODALIDADES,
  NO_INCLUYE,
  PREGUNTAS,
  PROCESO,
  TARIFA_HORA,
} from "../../content/enterprise";
import { formatearPrecio } from "../../content/planes";
import { metaDescripcion, urlAbsoluta } from "../../lib/sitio";

/**
 * Enterprise se vende en una conversación, no con tarjeta. Esta página tiene
 * un solo trabajo: que quien llegue a esa conversación ya entienda qué es,
 * qué implica y cuánto cuesta aproximadamente — y que pueda hacer sus
 * cuentas sin llamar. Todo el contenido sale de content/enterprise.ts.
 */

const DESCRIPCION =
  "Vinqulia completo en una instancia solo para tu empresa: en nube dedicada o instalado en tus servidores, con usuarios según tu tamaño, implementación acompañada y soporte con responsable asignado. Licencia anual desde " +
  formatearPrecio(DESDE.nube) +
  " MXN.";

export const metadata: Metadata = {
  title: "Vinqulia Enterprise | CRM en nube dedicada o en tus servidores",
  description: metaDescripcion(DESCRIPCION),
  keywords: [
    "CRM enterprise México",
    "CRM on-premise",
    "CRM instalable en servidores propios",
    "CRM nube dedicada",
    "licencia anual CRM",
    "CRM para empresas grandes",
  ],
  alternates: { canonical: urlAbsoluta("/enterprise") },
  openGraph: {
    title: "Vinqulia Enterprise",
    description: metaDescripcion(DESCRIPCION),
    url: urlAbsoluta("/enterprise"),
    siteName: "Vinqulia",
    locale: "es_MX",
    type: "website",
  },
};

const Marca = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5 text-sm text-neutral-700">
    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
      <Check className="size-3" />
    </span>
    {children}
  </li>
);

const Raya = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5 text-sm text-neutral-600">
    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
      <Minus className="size-3" />
    </span>
    {children}
  </li>
);

export default function PaginaEnterprise() {
  const datosEstructurados = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: urlAbsoluta("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Enterprise",
          item: urlAbsoluta("/enterprise"),
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PREGUNTAS.map((p) => ({
        "@type": "Question",
        name: p.pregunta,
        acceptedAnswer: { "@type": "Answer", text: p.respuesta },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />
      <BarraNavegacion />

      <main>
        {/* Qué es, en una frase */}
        <section className="relative overflow-hidden border-b border-neutral-200/70 bg-gradient-to-b from-brand-50/60 to-white py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="aparece mx-auto max-w-3xl text-center">
              <Eyebrow>Vinqulia Enterprise</Eyebrow>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                Vinqulia completo, en una instancia solo para ti
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-neutral-600">
                Tu base de datos, tu dominio, tus respaldos. En nuestra nube o
                en tus servidores, con nosotros acompañando la puesta en marcha
                y un responsable asignado después.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#cotizar"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  Estimar mi inversión
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="#que-incluye"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  Ver qué incluye
                </a>
              </div>
              <p className="mt-6 text-sm text-neutral-500">
                Licencia anual desde {formatearPrecio(DESDE.nube)} en nube
                dedicada y desde {formatearPrecio(DESDE.onpremise)} en tus
                servidores, más implementación desde{" "}
                {formatearPrecio(IMPLEMENTACION_BASE)}. Precios en MXN más IVA.
              </p>
            </div>
          </div>
        </section>

        {/* Las dos modalidades */}
        <section id="modalidades" className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <TituloDeSeccion
              eyebrow="Dos modalidades"
              titulo="Decide dónde vive tu información"
              subtitulo="Mismo producto, mismos módulos, mismo soporte. Cambia quién opera la infraestructura y, con eso, qué te toca a ti."
            />
            <div className="aparece-hijos mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
              {(
                [
                  ["nube", Cloud],
                  ["onpremise", Server],
                ] as const
              ).map(([clave, Icono]) => {
                const m = MODALIDADES[clave];
                return (
                  <div
                    key={clave}
                    className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icono className="size-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {m.nombre}
                        </h3>
                        <p className="text-sm text-neutral-500">{m.frase}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                      {m.paraQuien}
                    </p>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Qué necesitas tener
                    </p>
                    <ul className="mt-2 space-y-2">
                      {m.queNecesitas.map((punto) => (
                        <Marca key={punto}>{punto}</Marca>
                      ))}
                    </ul>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Qué te toca a ti
                    </p>
                    <ul className="mt-2 space-y-2">
                      {m.queTeToca.map((punto) => (
                        <Raya key={punto}>{punto}</Raya>
                      ))}
                    </ul>
                    <p className="mt-6 border-t border-neutral-200 pt-4 text-sm text-neutral-700">
                      <span className="font-medium">Arranque:</span>{" "}
                      {m.tiempoDeArranque} ·{" "}
                      <span className="font-medium">Licencia:</span> desde{" "}
                      {formatearPrecio(DESDE[clave])} / año
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Qué incluye y qué no */}
        <section
          id="que-incluye"
          className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <TituloDeSeccion
              eyebrow="Alcance"
              titulo="Qué incluye la licencia, y qué no"
              subtitulo="Lo decimos completo desde el principio para que no haya sorpresas en la propuesta."
            />
            <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h3 className="text-base font-semibold text-neutral-900">
                  La licencia anual incluye
                </h3>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {INCLUYE.map((punto) => (
                    <Marca key={punto}>{punto}</Marca>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-neutral-900">
                  No incluye
                </h3>
                <ul className="mt-4 space-y-2">
                  {NO_INCLUYE.map((punto) => (
                    <Raya key={punto}>{punto}</Raya>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-neutral-500">
                  Trabajo a medida: {formatearPrecio(TARIFA_HORA)} por hora o
                  por proyecto cerrado.
                </p>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-neutral-900">
                  La implementación incluye
                </h3>
                <p className="text-sm text-neutral-600">
                  Pago único, desde{" "}
                  <span className="font-semibold text-neutral-900">
                    {formatearPrecio(IMPLEMENTACION_BASE)}
                  </span>
                </p>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {IMPLEMENTACION_INCLUYE.map((punto) => (
                  <Marca key={punto}>{punto}</Marca>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Precios por banda */}
        <section id="precios" className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <TituloDeSeccion
              eyebrow="Precios"
              titulo="Por tamaño de equipo, no por usuario"
              subtitulo="Una licencia anual según cuánta gente entra al CRM. Crecer de banda es cambiar el precio, no renegociar el contrato."
            />
            <div className="mx-auto mt-10 max-w-4xl overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
                    <th className="px-5 py-3 font-semibold">Tamaño</th>
                    <th className="px-5 py-3 font-semibold">Nube dedicada</th>
                    <th className="px-5 py-3 font-semibold">En tus servidores</th>
                  </tr>
                </thead>
                <tbody>
                  {BANDAS.map((banda) => (
                    <tr
                      key={banda.etiqueta}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium text-neutral-800">
                        {banda.etiqueta}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-neutral-900">
                        {formatearPrecio(banda.licencia.nube)} / año
                      </td>
                      <td className="px-5 py-3 tabular-nums text-neutral-900">
                        {formatearPrecio(banda.licencia.onpremise)} / año
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-800">
                      Implementación (pago único)
                    </td>
                    <td
                      className="px-5 py-3 tabular-nums text-neutral-900"
                      colSpan={2}
                    >
                      desde {formatearPrecio(IMPLEMENTACION_BASE)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mx-auto mt-6 grid max-w-4xl gap-3 text-sm text-neutral-600 sm:grid-cols-3">
              <p className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <span className="font-semibold text-neutral-900">
                  Anual y por adelantado.
                </span>{" "}
                Facturado con CFDI, en MXN más IVA.
              </p>
              <p className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <span className="font-semibold text-neutral-900">
                  {DESCUENTO_2_ANIOS}% a 2 años, {DESCUENTO_3_ANIOS}% a 3.
                </span>{" "}
                El descuento es por compromiso, no por regateo.
              </p>
              <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <span className="font-semibold text-neutral-900">
                  Precio fundador: {DESCUENTO_FUNDADOR}% el primer año
                </span>{" "}
                para las {CUPOS_FUNDADOR} primeras empresas, a cambio de ser
                caso de éxito.
              </p>
            </div>
          </div>
        </section>

        {/* Calculadora + formulario */}
        <section
          id="cotizar"
          className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <TituloDeSeccion
              eyebrow="Hablemos"
              titulo="Haz tus cuentas y pide la propuesta"
              subtitulo="La estimación es la que llega con tu solicitud. La propuesta formal sale de una llamada de 30 minutos y la tienes en cinco días hábiles."
            />
            <div className="mx-auto mt-10 max-w-6xl">
              <CotizadorEnterprise />
            </div>
          </div>
        </section>

        {/* Proceso */}
        <section id="proceso" className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <TituloDeSeccion
              eyebrow="Cómo es el proceso"
              titulo="De la primera llamada al arranque"
              subtitulo="Cuatro pasos, con tiempos. El piloto es la garantía: si no funciona para ustedes, no se paga el resto."
            />
            <ol className="aparece-hijos mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PROCESO.map((paso, indice) => (
                <li
                  key={paso.paso}
                  className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {indice + 1}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-neutral-900">
                    {paso.paso}
                  </h3>
                  <p className="text-xs font-medium text-brand-700">
                    {paso.duracion}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {paso.texto}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Preguntas */}
        <section
          id="preguntas"
          className="border-t border-neutral-200/70 bg-white/60 py-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <TituloDeSeccion
              eyebrow="Preguntas frecuentes"
              titulo="Lo que nos preguntan antes de firmar"
              subtitulo="Si la tuya no está, la respondemos en la llamada de diagnóstico."
            />
            <div className="mx-auto mt-10 max-w-3xl divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {PREGUNTAS.map((p) => (
                <details key={p.pregunta} className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900">
                    {p.pregunta}
                    <ArrowRight className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {p.respuesta}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-neutral-600">
              ¿Tu equipo es más chico?{" "}
              <a href="/#precios" className="font-medium text-brand-700">
                Mira los planes Impulso, Pro y Max
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <PieDePagina />
    </>
  );
}
