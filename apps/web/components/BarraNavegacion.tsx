import Link from "next/link";

import { INDUSTRIAS } from "../content/industrias";
import { CtaRegistro, Logo } from "./comunes";
import { URL_APP } from "../lib/sitio";
import { MenuDesplegable, type EnlaceDeMenu } from "./MenuDesplegable";
import { MenuIndustrias } from "./MenuIndustrias";
import { MenuMovil } from "./MenuMovil";

/**
 * Barra de navegación compartida por la landing, las páginas de industria y
 * Enterprise.
 *
 * Pocas cosas a la vista y el resto bajo «Más»: lo que decide una visita
 * (qué es, cuánto cuesta, la opción grande) va en la barra; lo que se
 * consulta después (casos, migración, integraciones, preguntas) se agrupa.
 * Ocho enlaces sueltos más dos botones no cabían y se amontonaban.
 *
 * Las anclas cambian según el contexto: en la landing son "#seccion" (scroll
 * suave, sin recargar); desde otra página llevan a "/#seccion", porque el
 * formulario de demo y las secciones comerciales viven en la raíz.
 */
export function BarraNavegacion({ enInicio = false }: { enInicio?: boolean }) {
  const prefijo = enInicio ? "" : "/";

  const principales: EnlaceDeMenu[] = [
    { href: prefijo + "#solucion", label: "Solución" },
    { href: prefijo + "#precios", label: "Precios" },
    { href: "/enterprise", label: "Enterprise" },
  ];

  const secundarios: EnlaceDeMenu[] = [
    {
      href: prefijo + "#casos",
      label: "Casos de uso",
      descripcion: "Cómo lo usan equipos como el tuyo",
    },
    {
      href: prefijo + "#migracion",
      label: "Migración",
      descripcion: "Trae tus datos de Excel o de otro CRM",
    },
    {
      href: prefijo + "#integraciones",
      label: "Integraciones",
      descripcion: "API, webhooks, WhatsApp y asistente de IA",
    },
    {
      href: prefijo + "#faq",
      label: "Preguntas frecuentes",
    },
  ];

  const hrefDemo = prefijo + "#demo";

  const industriasParaMenu = INDUSTRIAS.map((industria) => ({
    slug: industria.slug,
    nombre: industria.nombre,
    resumen: industria.resumen,
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="shrink-0 no-underline"
          aria-label="Vinqulia, inicio"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <MenuIndustrias items={industriasParaMenu} />
          {principales.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {enlace.label}
            </a>
          ))}
          <MenuDesplegable etiqueta="Más" items={secundarios} />
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <a
            href={hrefDemo}
            className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium text-neutral-700 no-underline transition-colors hover:text-neutral-900 md:inline-flex"
          >
            Ver una demo
          </a>
          {/* Quien ya es cliente entra desde aquí: la web no tiene login
              propio, la sesión vive en la aplicación. */}
          <a
            href={URL_APP}
            className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium text-neutral-700 no-underline transition-colors hover:text-neutral-900 md:inline-flex"
          >
            Entrar
          </a>
          <CtaRegistro className="whitespace-nowrap rounded-lg px-4 py-2 shadow-sm">
            Regístrate gratis
          </CtaRegistro>
          <MenuMovil
            grupos={[
              { titulo: "Producto", items: principales },
              { titulo: "Más", items: secundarios },
              {
                titulo: "Industrias",
                items: [
                  ...industriasParaMenu.map((i) => ({
                    href: "/industrias/" + i.slug,
                    label: i.nombre,
                  })),
                  { href: "/industrias", label: "Ver todas las industrias" },
                ],
              },
            ]}
            urlApp={URL_APP}
            hrefDemo={hrefDemo}
          />
        </div>
      </div>
    </header>
  );
}
