import { ArrowRight, ChevronRight } from "lucide-react";

import { URL_APP } from "../lib/sitio";

/**
 * Piezas compartidas por la landing y las páginas de industria.
 *
 * Vivían dentro de app/page.tsx; se extrajeron aquí para que las páginas de
 * industria reutilicen exactamente la misma marca y los mismos CTAs en lugar
 * de duplicar el marcado (y para que un cambio de marca se haga en un sitio).
 */

export const Logo = ({ small = false }: { small?: boolean }) => (
  <span className="flex items-center gap-2.5">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/vinqulia-icon.png"
      alt="Vinqulia"
      className={small ? "size-7 rounded-lg" : "size-9 rounded-lg"}
    />
    <span
      className={
        small
          ? "text-lg font-bold tracking-tight"
          : "text-xl font-bold tracking-tight"
      }
    >
      vinq<span className="text-brand-600">u</span>lia
    </span>
  </span>
);

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
    {children}
  </p>
);

export const TituloDeSeccion = ({
  eyebrow,
  titulo,
  subtitulo,
}: {
  eyebrow: string;
  titulo: string;
  subtitulo: string;
}) => (
  <div className="aparece mx-auto max-w-2xl text-center">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
      {titulo}
    </h2>
    <p className="mt-4 text-base leading-relaxed text-neutral-600">
      {subtitulo}
    </p>
  </div>
);

/**
 * CTA principal: registrarse en la aplicación. El plan Impulso da 30 días
 * gratis sin tarjeta, así que el camino corto es probarlo, no pedir una
 * demo. La demo queda como CTA secundario para quien necesita hablar antes
 * (infraestructura propia, SSO, implementación guiada).
 */
export const CtaRegistro = ({
  children = "Regístrate gratis",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <a
    href={URL_APP}
    className={
      "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 " +
      className
    }
  >
    {children}
    <ArrowRight className="size-4" />
  </a>
);

/** Lo que quita el miedo a pulsar «Regístrate»: va siempre junto al botón. */
export const NotaDePrueba = ({ className = "" }: { className?: string }) => (
  <span className={"text-sm text-neutral-500 " + className}>
    30 días gratis · sin tarjeta
  </span>
);

/** CTA secundario: lleva al formulario de calificación para una demo. */
export const CtaDemo = ({
  children = "Ver una demo",
  className = "",
  href = "#demo",
}: {
  children?: React.ReactNode;
  className?: string;
  href?: string;
}) => (
  <a
    href={href}
    className={
      "inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 " +
      className
    }
  >
    {children}
  </a>
);

/** CTA secundario: para el visitante que prefiere explorar primero. */
export const CtaExplorar = ({
  children = "Explorar Vinqulia",
  className = "",
  href = "#solucion",
}: {
  children?: React.ReactNode;
  className?: string;
  href?: string;
}) => (
  <a
    href={href}
    className={
      "inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 " +
      className
    }
  >
    {children}
  </a>
);

/** Banda de cierre reutilizable, con el CTA hablando de la industria. */
export const CtaBanda = ({
  eyebrow,
  titulo,
  subtitulo,
  boton,
}: {
  eyebrow: string;
  titulo: string;
  subtitulo: string;
  boton: string;
}) => (
  <section className="px-5 pb-20 sm:px-8">
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-16 shadow-2xl shadow-brand-900/30 sm:px-12 lg:py-20">
      <div
        aria-hidden
        className="animar-flotar pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="animar-flotar-lento pointer-events-none absolute -bottom-24 left-16 size-56 rounded-full bg-white/5 blur-2xl"
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-100">
          {eyebrow}
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {titulo}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-50/90">
          {subtitulo}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={URL_APP}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5"
          >
            Regístrate gratis
            <ArrowRight className="size-4" />
          </a>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {boton}
          </a>
        </div>
        <p className="mt-4 text-sm text-brand-100">
          30 días gratis · sin tarjeta
        </p>
      </div>
    </div>
  </section>
);

/**
 * Migas de pan. Visibles (ayudan a orientarse y a volver) y enlazadas, para
 * que el JSON-LD de BreadcrumbList de la página coincida con lo que se ve.
 */
export const Migas = ({
  items,
}: {
  items: { nombre: string; href?: string }[];
}) => (
  <nav aria-label="Ruta de navegación" className="text-sm">
    <ol className="flex flex-wrap items-center gap-1.5 text-neutral-500">
      {items.map((item, indice) => (
        <li key={item.nombre} className="flex items-center gap-1.5">
          {indice > 0 && (
            <ChevronRight className="size-3.5 text-neutral-300" aria-hidden />
          )}
          {item.href ? (
            <a
              href={item.href}
              className="transition-colors hover:text-brand-600"
            >
              {item.nombre}
            </a>
          ) : (
            <span className="font-medium text-neutral-700">{item.nombre}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
