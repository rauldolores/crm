"use client";

import { ArrowRight, Building2, Check } from "lucide-react";
import { useState } from "react";

import {
  PLANES,
  ahorroAnual,
  equivalenteMensual,
  formatearPrecio,
} from "../content/planes";
import { DESDE, IMPLEMENTACION_BASE } from "../content/enterprise";
import { URL_APP } from "../lib/sitio";
import { TituloDeSeccion } from "./comunes";

type Intervalo = "mes" | "año";

/**
 * Planes y precios, con los mismos planes que la aplicación ofrece en
 * «Plan y facturación», y el mismo interruptor Mensual/Anual: el precio
 * anual es una opción de cobro del mismo plan, con su ahorro frente a doce
 * mensualidades. La prueba gratis solo existe en Impulso; Enterprise no
 * tiene precio y manda al formulario de demo.
 */
export const Precios = () => {
  const [intervalo, setIntervalo] = useState<Intervalo>("mes");
  const anual = intervalo === "año";
  const hayAnual = PLANES.some((plan) => plan.precioAnual !== null);
  // Enterprise no es una columna más: no tiene precio mensual ni botón de
  // compra, así que va en una banda ancha debajo, con sus condiciones.
  const conPrecio = PLANES.filter((plan) => plan.precioMensual !== null);
  const enterprise = PLANES.find((plan) => plan.precioMensual === null);

  return (
    <section id="precios" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <TituloDeSeccion
          eyebrow="Planes y precios"
          titulo="Un precio claro por equipo, en pesos mexicanos"
          subtitulo="Empieza con 30 días de prueba en Impulso: registras tu tarjeta y no se cobra nada hasta que termine. Paga al mes o ahorra pagando el año; cambias de plan cuando tu equipo crezca y los datos se quedan donde están."
        />
        {hayAnual && (
          <div
            role="radiogroup"
            aria-label="Periodo de pago"
            className="mx-auto mt-10 flex w-fit items-center gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm"
          >
            {(
              [
                ["mes", "Mensual"],
                ["año", "Anual"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={intervalo === valor}
                onClick={() => setIntervalo(valor)}
                className={
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors " +
                  (intervalo === valor
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900")
                }
              >
                {etiqueta}
              </button>
            ))}
          </div>
        )}
        <div className="aparece-hijos mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-3">
          {conPrecio.map((plan) => (
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
                {anual && plan.precioAnual !== null ? (
                  <>
                    <p className="flex flex-wrap items-baseline gap-x-1">
                      <span className="text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                        {formatearPrecio(plan.precioAnual)}
                      </span>
                      <span className="text-sm text-neutral-500">/ año</span>
                      {(ahorroAnual(plan) ?? 0) > 0 && (
                        <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Ahorra {ahorroAnual(plan)}%
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      equivale a{" "}
                      {formatearPrecio(equivalenteMensual(plan) ?? 0)} / mes
                    </p>
                  </>
                ) : (
                  <p className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                      {formatearPrecio(plan.precioMensual ?? 0)}
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
            </div>
          ))}
        </div>

        {enterprise && (
          <div className="aparece mx-auto mt-4 max-w-6xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] lg:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                  <Building2 className="size-5 text-brand-600" />
                  {enterprise.nombre}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {enterprise.para} Licencia anual, no mensual.
                </p>
                <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-sm text-neutral-500">desde</span>
                  <span className="text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
                    {formatearPrecio(DESDE.nube)}
                  </span>
                  <span className="text-sm text-neutral-500">MXN / año</span>
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Nube dedicada · en tus servidores desde{" "}
                  {formatearPrecio(DESDE.onpremise)} · implementación desde{" "}
                  {formatearPrecio(IMPLEMENTACION_BASE)}, una vez
                </p>
              </div>
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {enterprise.incluye.map((punto) => (
                  <li
                    key={punto}
                    className="flex items-start gap-2 text-sm text-neutral-700"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {punto}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col items-start gap-2 lg:items-center">
                <a
                  href={enterprise.enlace ?? "#demo"}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                >
                  Hablemos
                  <ArrowRight className="size-4" />
                </a>
                <span className="text-xs text-neutral-500 lg:text-center">
                  Ver qué incluye y estimar tu inversión
                </span>
              </div>
            </div>
          </div>
        )}
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-neutral-500">
          Precios en MXN más impuestos, con pago mensual o anual. El cobro se
          hace por Stripe desde la propia aplicación; puedes subir o bajar de
          plan en cualquier momento. La implementación guiada y los desarrollos
          a medida se cotizan aparte.
        </p>
      </div>
    </section>
  );
};
