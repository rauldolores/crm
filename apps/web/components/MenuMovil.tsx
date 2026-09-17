"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { EnlaceDeMenu } from "./MenuDesplegable";

interface Grupo {
  titulo: string;
  items: EnlaceDeMenu[];
}

/**
 * Menú de la barra en pantallas chicas: un botón de hamburguesa que abre un
 * panel con TODOS los enlaces agrupados, más los dos botones de acción. En
 * escritorio no se muestra; ahí los enlaces van en la propia barra.
 */
export function MenuMovil({
  grupos,
  urlApp,
  hrefDemo,
}: {
  grupos: Grupo[];
  urlApp: string;
  hrefDemo: string;
}) {
  const [abierto, setAbierto] = useState(false);

  // Con el panel abierto la página de atrás no debe hacer scroll.
  useEffect(() => {
    if (!abierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alPulsarTecla);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", alPulsarTecla);
    };
  }, [abierto]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex size-10 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
      >
        {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {abierto && (
        // Absoluto respecto de la cabecera, no fijo: el backdrop-blur de la
        // cabecera la convierte en contenedor de todo lo `fixed` que lleve
        // dentro, y el panel quedaba recortado a sus 64 px de alto.
        <div className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto border-t border-neutral-200 bg-white px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            {grupos.map((grupo) => (
              <div key={grupo.titulo}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {grupo.titulo}
                </p>
                <ul className="flex flex-col">
                  {grupo.items.map((item) => (
                    <li key={item.href}>
                      {item.href.startsWith("/") && !item.href.includes("#") ? (
                        <Link
                          href={item.href}
                          onClick={() => setAbierto(false)}
                          className="block rounded-lg px-2 py-2.5 text-base font-medium text-neutral-800 no-underline hover:bg-brand-50"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          onClick={() => setAbierto(false)}
                          className="block rounded-lg px-2 py-2.5 text-base font-medium text-neutral-800 no-underline hover:bg-brand-50"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex flex-col gap-2 border-t border-neutral-200 pt-6">
              <a
                href={urlApp}
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 no-underline"
              >
                Regístrate gratis
              </a>
              <a
                href={hrefDemo}
                onClick={() => setAbierto(false)}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 no-underline"
              >
                Ver una demo
              </a>
              <a
                href={urlApp}
                className="mt-2 text-center text-sm font-medium text-neutral-600 no-underline"
              >
                ¿Ya eres cliente? Entrar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
