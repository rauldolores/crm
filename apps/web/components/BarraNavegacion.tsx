import Link from "next/link";

import { INDUSTRIAS } from "../content/industrias";
import { CtaDemo, CtaRegistro, Logo } from "./comunes";
import { MenuIndustrias } from "./MenuIndustrias";

/**
 * Barra de navegación compartida por la landing y las páginas de industria.
 *
 * Las anclas cambian según el contexto: en la landing son "#seccion" (scroll
 * suave, sin recargar); desde una página de industria llevan a "/#seccion",
 * porque el formulario de demo y las secciones comerciales viven en la raíz.
 */
export function BarraNavegacion({ enInicio = false }: { enInicio?: boolean }) {
  const prefijo = enInicio ? "" : "/";

  const enlaces = [
    { href: prefijo + "#solucion", label: "Solución" },
    { href: prefijo + "#casos", label: "Casos de uso" },
    { href: prefijo + "#precios", label: "Precios" },
    { href: prefijo + "#migracion", label: "Migración" },
    { href: prefijo + "#demo", label: "Demo" },
    { href: prefijo + "#faq", label: "FAQ" },
  ];

  const industriasParaMenu = INDUSTRIAS.map((industria) => ({
    slug: industria.slug,
    nombre: industria.nombre,
    resumen: industria.resumen,
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="no-underline" aria-label="Vinqulia, inicio">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <MenuIndustrias items={industriasParaMenu} />
          {enlaces.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {enlace.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CtaDemo
            className="hidden px-4 py-2 sm:inline-flex"
            href={prefijo + "#demo"}
          >
            Ver una demo
          </CtaDemo>
          <CtaRegistro className="rounded-lg px-4 py-2 shadow-sm">
            Regístrate gratis
          </CtaRegistro>
        </div>
      </div>
    </header>
  );
}
