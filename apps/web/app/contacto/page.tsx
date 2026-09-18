import type { Metadata } from "next";
import { ArrowRight, Mail, MessageCircle, LifeBuoy } from "lucide-react";
import Link from "next/link";

import { BarraNavegacion } from "../../components/BarraNavegacion";
import { PieDePagina } from "../../components/PieDePagina";
import { Eyebrow } from "../../components/comunes";
import { CONTACTO, URL_APP, urlAbsoluta, urlWhatsapp } from "../../lib/sitio";

export const metadata: Metadata = {
  title: "Contacto y soporte | Vinqulia",
  description:
    "Cómo hablar con el equipo de Vinqulia: ventas, soporte para clientes y demo.",
  alternates: { canonical: urlAbsoluta("/contacto") },
};

/**
 * Un solo sitio con los canales reales: correo, WhatsApp (si está
 * configurado), el formulario de demo y el centro de ayuda de la app.
 * Existe porque el formulario de demo, sin la clave del CRM, remite «a
 * WhatsApp» y no había ningún lugar donde encontrarlo.
 */
export default function Pagina() {
  const whatsapp = urlWhatsapp();
  const canales = [
    {
      icono: Mail,
      titulo: "Correo",
      texto:
        "Ventas, facturación y soporte. Respondemos en horario hábil de México.",
      href: `mailto:${CONTACTO.correo}`,
      etiqueta: CONTACTO.correo,
    },
    ...(whatsapp
      ? [
          {
            icono: MessageCircle,
            titulo: "WhatsApp",
            texto: "Para dudas rápidas antes de contratar o durante la prueba.",
            href: whatsapp,
            etiqueta: "Escribir por WhatsApp",
          },
        ]
      : []),
    {
      icono: LifeBuoy,
      titulo: "Centro de ayuda",
      texto:
        "Dentro de la aplicación: guías de cada pantalla, preguntas frecuentes y un formulario para pedir funcionalidades.",
      href: `${URL_APP}/#/ayuda`,
      etiqueta: "Abrir la ayuda",
    },
  ];

  return (
    <>
      <BarraNavegacion />
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-24">
        <Eyebrow>Contacto</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Hablemos
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600">
          Si quieres ver Vinqulia funcionando con tu caso, pide una demo y te
          contactamos. Si ya eres cliente, escríbenos por cualquiera de estos
          canales.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {canales.map((canal) => (
            <a
              key={canal.titulo}
              href={canal.href}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-300"
            >
              <canal.icono className="size-6 text-brand-600" />
              <h2 className="mt-4 text-base font-semibold text-neutral-900">
                {canal.titulo}
              </h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-600">
                {canal.texto}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                {canal.etiqueta}
                <ArrowRight className="size-4" />
              </span>
            </a>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-brand-50 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">
            ¿Quieres una demo?
          </h2>
          <p className="mt-1.5 text-sm text-neutral-600">
            Cuéntanos de tu empresa y te enviamos una propuesta o agendamos una
            sesión.
          </p>
          <Link
            href="/#demo"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-colors hover:bg-brand-700"
          >
            Pedir una demo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
      <PieDePagina />
    </>
  );
}
