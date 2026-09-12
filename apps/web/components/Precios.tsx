import { ArrowRight, Check } from "lucide-react";

import { PLANES, formatearPrecio } from "../content/planes";
import { URL_APP } from "../lib/sitio";
import { TituloDeSeccion } from "./comunes";

/**
 * Planes y precios, con los mismos planes que la aplicación ofrece en
 * «Plan y facturación». La prueba gratis solo existe en Impulso; Enterprise
 * no tiene precio y manda al formulario de demo.
 */
export const Precios = () => (
  <section id="precios" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Planes y precios"
        titulo="Un precio claro por equipo, en pesos mexicanos"
        subtitulo="Empieza con una prueba de 30 días sin tarjeta. Cambias de plan cuando tu equipo crezca; los datos se quedan donde están."
      />
      <div className="aparece-hijos mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANES.map((plan) => (
          <div
            key={plan.slug}
            className={
              "borde-degradado flex flex-col rounded-2xl border bg-white p-6 shadow-sm " +
              (plan.destacado
                ? "border-brand-300 ring-2 ring-brand-200"
                : "border-neutral-200")
            }
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-900">
                {plan.nombre}
              </h3>
              {plan.destacado && (
                <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  El más elegido
                </span>
              )}
            </div>
            <p className="mt-1.5 min-h-10 text-sm leading-snug text-neutral-600">
              {plan.para}
            </p>
            <div className="mt-5">
              {plan.precioMensual === null ? (
                <p className="text-3xl font-semibold tracking-tight text-neutral-900">
                  A tu medida
                </p>
              ) : (
                <p className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                    {formatearPrecio(plan.precioMensual)}
                  </span>
                  <span className="text-sm text-neutral-500">/ mes</span>
                </p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                {plan.usuarios}
                {plan.diasDePrueba > 0
                  ? ` · ${plan.diasDePrueba} días de prueba gratis`
                  : ""}
              </p>
            </div>
            <ul className="mt-5 flex-1 space-y-2">
              {plan.incluye.map((punto) => (
                <li
                  key={punto}
                  className="flex items-start gap-2 text-sm text-neutral-700"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {punto}
                </li>
              ))}
            </ul>
            {plan.precioMensual === null ? (
              <a
                href="#demo"
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Pedir una propuesta
                <ArrowRight className="size-4" />
              </a>
            ) : (
              <a
                href={URL_APP}
                className={
                  "mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors " +
                  (plan.destacado
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50")
                }
              >
                {plan.diasDePrueba > 0
                  ? "Empezar gratis"
                  : "Elegir " + plan.nombre}
                <ArrowRight className="size-4" />
              </a>
            )}
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-neutral-500">
        Precios mensuales en MXN más impuestos. El cobro se hace por Stripe
        desde la propia aplicación; puedes subir o bajar de plan en cualquier
        momento. La implementación guiada y los desarrollos a medida se cotizan
        aparte.
      </p>
    </div>
  </section>
);
