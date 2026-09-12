"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Menú desplegable de Industrias.
 *
 * Solo lista industrias que ya tienen página publicada (las recibe por props
 * desde el registro de contenido), así que nunca hay enlaces muertos.
 *
 * Se abre al pasar el ratón o al enfocar con teclado, y se cierra con Escape,
 * al salir del área o al pulsar fuera. Los enlaces son navegación interna de
 * Next, no anclas, porque llevan a otras rutas.
 */
export function MenuIndustrias({
  items,
  etiqueta = "Industrias",
}: {
  items: { slug: string; nombre: string; resumen: string }[];
  etiqueta?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;

    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener("keydown", alPulsarTecla);
    document.addEventListener("mousedown", alPulsarFuera);
    return () => {
      document.removeEventListener("keydown", alPulsarTecla);
      document.removeEventListener("mousedown", alPulsarFuera);
    };
  }, [abierto]);

  if (items.length === 0) return null;

  return (
    <div
      ref={contenedor}
      className="relative"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((valor) => !valor)}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        {etiqueta}
        <ChevronDown
          className={
            "size-3.5 transition-transform " + (abierto ? "rotate-180" : "")
          }
        />
      </button>

      {abierto && (
        <div
          id={idPanel}
          className="absolute left-0 top-full z-50 w-[min(46rem,calc(100vw-3rem))] pt-2"
        >
          <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl shadow-neutral-900/10">
            {/* Dos columnas: con diez industrias, una sola lista vertical no
                cabría en pantalla. El ancho se limita al viewport para no
                desbordar en pantallas anchas pero justas. */}
            <div className="grid grid-cols-2 gap-1">
              {items.map((item) => (
                <Link
                  key={item.slug}
                  href={"/industrias/" + item.slug}
                  onClick={() => setAbierto(false)}
                  className="block rounded-xl px-3 py-2.5 no-underline transition-colors hover:bg-brand-50"
                >
                  <span className="block text-sm font-semibold text-neutral-900">
                    {item.nombre}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-neutral-500">
                    {item.resumen}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/industrias"
              onClick={() => setAbierto(false)}
              className="mt-1 block rounded-xl bg-neutral-50 px-3 py-2.5 text-center text-sm font-semibold text-brand-700 no-underline transition-colors hover:bg-brand-50"
            >
              Ver todas las industrias
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
