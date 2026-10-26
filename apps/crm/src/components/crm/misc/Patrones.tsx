import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * El patrón de página común del ecosistema Kontrolia: el mismo que AduaniaX
 * (apps/aduana/components/dashboard/page-patterns.tsx), con la paleta de
 * Vinqulia. Mismos nombres y misma forma de uso, para que una pantalla se
 * escriba igual en los dos productos:
 *
 *   <PageHero badge="Facturación" title="Cobranza" description="…"
 *     action={<Button>…</Button>} />
 *   <StatGrid><StatCard tono="total" … /></StatGrid>
 *   <SectionCard icon={<Coins />} title="Por cobrar" description="…">…</SectionCard>
 *
 * Sin estas piezas cada página terminaba con su propio encabezado y sus
 * propias tarjetas; aquí vive el patrón una sola vez.
 */

// ── Encabezado de página ─────────────────────────────────────

interface PageHeroProps {
  /** Contexto en píldora («Facturación», «Ajustes»…). */
  badge?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Distintivos junto al badge (HeroTag). */
  tag?: ReactNode;
  /** Acciones a la derecha. Se pintan con el tema oscuro, sobre el vino. */
  action?: ReactNode;
  /** Leyenda diminuta debajo de las acciones. */
  note?: ReactNode;
  /** Más bajo, para listas: el bloque no debe empujar la tabla fuera. */
  compacto?: boolean;
  className?: string;
}

export const PageHero = ({
  badge,
  title,
  description,
  tag,
  action,
  note,
  compacto = false,
  className,
}: PageHeroProps) => (
  <section
    className={cn(
      "relative overflow-hidden rounded-2xl bg-hero text-white shadow-hero",
      compacto ? "px-6 py-5" : "p-6 lg:p-8",
      className,
    )}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-linear-to-l from-hero-glow to-transparent"
    />
    {/* Envuelve en vez de encoger: con muchas acciones (oportunidades) el
        título no debe quedar debajo de los botones. */}
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="min-w-[14rem] flex-1 space-y-2">
        {(badge || tag) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge && (
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black tracking-[0.2em] text-primary-foreground uppercase">
                {badge}
              </span>
            )}
            {tag}
          </div>
        )}
        <h1
          className={cn(
            "font-black leading-tight tracking-tighter",
            compacto ? "text-2xl" : "text-2xl lg:text-3xl",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed font-medium text-hero-muted">
            {description}
          </p>
        )}
      </div>
      {action && (
        // `dark` cambia los tokens solo aquí dentro: los botones de siempre
        // se leen bien sobre el vino sin una variante propia.
        <div className="dark flex max-w-full flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {action}
          </div>
          {note && (
            <div className="text-center text-[10px] font-black tracking-widest text-hero-muted/60 uppercase md:text-right">
              {note}
            </div>
          )}
        </div>
      )}
    </div>
  </section>
);

interface FichaHeroProps {
  /** Avatar o logo; va sobre un cuadro blanco para que se lea en el vino. */
  avatar?: ReactNode;
  /** Qué es («Contacto», «Empresa», «Oportunidad»). */
  badge?: string;
  title: ReactNode;
  /** Cargo, empresa, sector… Sus enlaces se pintan en blanco. */
  subtitle?: ReactNode;
  /** Distintivos y etiquetas bajo el título. */
  tags?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Encabezado de una ficha (contacto, empresa, oportunidad): el mismo bloque
 * vino que PageHero, con el avatar a la izquierda.
 */
export const FichaHero = ({
  avatar,
  badge,
  title,
  subtitle,
  tags,
  action,
  className,
}: FichaHeroProps) => (
  <section
    className={cn(
      "relative overflow-hidden rounded-2xl bg-hero px-6 py-5 text-white shadow-hero",
      className,
    )}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-linear-to-l from-hero-glow to-transparent"
    />
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex min-w-[14rem] flex-1 items-center gap-4">
        {avatar && (
          <div className="shrink-0 rounded-2xl bg-white p-1 shadow-sm">
            {avatar}
          </div>
        )}
        <div className="min-w-0 space-y-1.5">
          {badge && (
            <span className="inline-block rounded-full bg-primary px-3 py-0.5 text-[10px] font-black tracking-[0.2em] text-primary-foreground uppercase">
              {badge}
            </span>
          )}
          <h1 className="flex flex-wrap items-center gap-2 text-2xl leading-tight font-black tracking-tighter">
            {title}
          </h1>
          {subtitle && (
            <div className="text-sm font-medium text-hero-muted [&_a]:text-white [&_a]:underline [&_a]:decoration-white/40 [&_a:hover]:decoration-white">
              {subtitle}
            </div>
          )}
          {tags && <div className="flex flex-wrap gap-1.5">{tags}</div>}
        </div>
      </div>
      {action && (
        <div className="dark flex max-w-full flex-wrap items-center gap-2">
          {action}
        </div>
      )}
    </div>
  </section>
);

/** Distintivo de estado dentro del encabezado. */
export const HeroTag = ({
  children,
  tono = "emerald",
}: {
  children: ReactNode;
  tono?: "emerald" | "amber" | "sky";
}) => (
  <span
    className={cn(
      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black tracking-widest uppercase",
      {
        emerald: "border-emerald-400/25 bg-emerald-500/15 text-emerald-200",
        amber: "border-amber-400/25 bg-amber-500/15 text-amber-200",
        sky: "border-sky-400/25 bg-sky-500/15 text-sky-200",
      }[tono],
    )}
  >
    {children}
  </span>
);

// ── Tarjetas de cifra ────────────────────────────────────────

/**
 * Colores por propósito. «error» es naranja quemado y no rojo: en Vinqulia
 * el rojo es la marca, y una cifra mala no debe leerse como «lo nuestro».
 * Tonos elegidos para que el texto blanco pase AA a 10 px.
 */
const TONOS = {
  total: "bg-primary",
  ok: "bg-emerald-700",
  error: "bg-orange-700",
  fecha: "bg-amber-700",
  info: "bg-sky-700",
  neutro: "bg-stone-800",
} as const;

export type TonoDeCifra = keyof typeof TONOS;

interface StatCardProps {
  title: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  tono?: TonoDeCifra;
  /** Píldora arriba a la derecha («+14 este mes»). */
  trend?: ReactNode;
  /** Sin icono y más bajo: para tres cifras en una fila de móvil. */
  compacto?: boolean;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  description,
  tono = "total",
  trend,
  compacto = false,
  className,
}: StatCardProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl text-white shadow-tarjeta",
      compacto ? "p-3" : "p-5",
      TONOS[tono],
      className,
    )}
  >
    {!compacto && (icon || trend) && (
      <div className="mb-4 flex items-start justify-between">
        {icon && (
          <div className="rounded-lg border border-white/15 bg-white/10 p-2.5 [&_svg]:size-5">
            {icon}
          </div>
        )}
        {trend && (
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black tracking-tight uppercase">
            {trend}
          </span>
        )}
      </div>
    )}
    <p
      className={cn(
        "truncate font-extrabold text-white/80 uppercase",
        compacto ? "text-[9px] tracking-wider" : "text-[10px] tracking-widest",
      )}
    >
      {title}
    </p>
    <p
      className={cn(
        "mt-1 font-black tracking-tight tabular-nums",
        compacto ? "text-xl" : "text-2xl",
      )}
    >
      {value}
    </p>
    {description && (
      <p className="pt-2 text-[10px] font-extrabold tracking-widest text-white/70 uppercase">
        {description}
      </p>
    )}
    <div
      aria-hidden
      className="pointer-events-none absolute -right-4 -bottom-4 size-24 rounded-full bg-white/5 blur-2xl"
    />
  </div>
);

export const StatGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
      className,
    )}
  >
    {children}
  </div>
);

// ── Tarjeta de contenido ─────────────────────────────────────

interface SectionCardProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Buscador, filtros, botones… a la derecha del encabezado. */
  tools?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** `false` quita el relleno del cuerpo (tablas a sangre). */
  padded?: boolean;
  className?: string;
}

export const SectionCard = ({
  icon,
  title,
  description,
  tools,
  children,
  footer,
  padded = true,
  className,
}: SectionCardProps) => (
  <section
    className={cn(
      "overflow-hidden rounded-2xl bg-card text-card-foreground shadow-tarjeta dark:border dark:border-border",
      className,
    )}
  >
    <header className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="rounded-lg bg-accent p-2.5 text-primary [&_svg]:size-5">
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          <h2 className="text-base font-black tracking-tight">{title}</h2>
          {description && (
            <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
              {description}
            </p>
          )}
        </div>
      </div>
      {tools && (
        <div className="flex flex-wrap items-center gap-2">{tools}</div>
      )}
    </header>
    <div className={padded ? "p-6" : undefined}>{children}</div>
    {footer && (
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/50 px-6 py-4">
        {footer}
      </footer>
    )}
  </section>
);

/** Leyenda de pie de tarjeta con un punto de color. */
export const CardNote = ({
  children,
  tono = "neutro",
}: {
  children: ReactNode;
  tono?: "marca" | "ok" | "neutro";
}) => (
  <span
    className={cn(
      "flex items-center gap-2 text-[10px] font-black tracking-widest uppercase",
      {
        marca: "text-primary [&>span]:bg-primary",
        ok: "text-emerald-700 [&>span]:bg-emerald-600 dark:text-emerald-400",
        neutro: "text-muted-foreground [&>span]:bg-muted-foreground/40",
      }[tono],
    )}
  >
    <span aria-hidden className="size-1.5 rounded-full" />
    {children}
  </span>
);

/** Estado vacío dentro de una tarjeta. */
export const EmptyState = ({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
    {icon && (
      <div className="rounded-2xl bg-muted p-3 text-muted-foreground [&_svg]:size-6">
        {icon}
      </div>
    )}
    <p className="font-black">{title}</p>
    {text && (
      <div className="max-w-lg text-sm text-muted-foreground">{text}</div>
    )}
    {action}
  </div>
);

/** Página completa cuando falta el permiso de verla. */
export const SinAcceso = ({
  titulo,
  texto,
}: {
  titulo: string;
  texto?: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-16 text-center shadow-tarjeta">
    <div className="rounded-2xl bg-muted p-3 text-muted-foreground [&_svg]:size-6">
      <Lock />
    </div>
    <p className="font-black">{titulo}</p>
    {texto && <p className="max-w-md text-sm text-muted-foreground">{texto}</p>}
  </div>
);
