import Link from "next/link";

import { HOJA_DE_RUTA, INDUSTRIAS } from "../content/industrias";
import { Logo } from "./comunes";

/**
 * Pie de página compartido.
 *
 * La columna de industrias cumple dos funciones: dar a todo el sitio un
 * enlazado interno hacia las páginas de industria (que es como un buscador
 * entiende que son parte del mismo sitio) y ofrecer una ruta de navegación
 * cuando el menú superior está oculto en pantallas pequeñas.
 */
export function PieDePagina({ enInicio = false }: { enInicio?: boolean }) {
  const prefijo = enInicio ? "" : "/";

  const enlaces = [
    { href: prefijo + "#solucion", label: "Solución" },
    { href: prefijo + "#casos", label: "Casos de uso" },
    { href: prefijo + "#precios", label: "Precios" },
    { href: prefijo + "#migracion", label: "Migración" },
    { href: prefijo + "#demo", label: "Demo" },
    { href: prefijo + "#faq", label: "FAQ" },
  ];

  return (
    <footer className="border-t border-neutral-200/70 bg-white/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo small />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">
            El sistema comercial que se adapta a la forma en que trabaja tu
            empresa: contactos, oportunidades, seguimiento y comunicación en un
            solo lugar.
          </p>
          <p className="mt-4 text-xs text-neutral-400">
            © {new Date().getFullYear()} Vinqulia · Parte de Kontrolia
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Producto
          </p>
          <ul className="mt-3 space-y-2">
            {enlaces.map((enlace) => (
              <li key={enlace.href}>
                <a
                  href={enlace.href}
                  className="text-sm text-neutral-600 transition-colors hover:text-brand-700"
                >
                  {enlace.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Industrias
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/industrias"
                className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
              >
                Todas las industrias
              </Link>
            </li>
            {INDUSTRIAS.map((industria) => (
              <li key={industria.slug}>
                <Link
                  href={"/industrias/" + industria.slug}
                  className="text-sm text-neutral-600 transition-colors hover:text-brand-700"
                >
                  {industria.nombre}
                </Link>
              </li>
            ))}
            {HOJA_DE_RUTA.slice(0, 3).map((futura) => (
              <li key={futura.nombre} className="text-sm text-neutral-400">
                {futura.nombre}{" "}
                <span className="text-[11px]">(en preparación)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-100 px-5 py-5 sm:px-8">
        <p className="mx-auto max-w-7xl text-center text-xs leading-relaxed text-neutral-400">
          Buscas: CRM con WhatsApp · CRM instalable en servidores propios · CRM
          personalizable para tu empresa · CRM para pymes y equipos comerciales
          · Alternativa a HubSpot, Pipedrive o Zoho CRM.
        </p>
      </div>
    </footer>
  );
}
