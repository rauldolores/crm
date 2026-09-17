"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface EnlaceDeMenu {
  href: string;
  label: string;
  /** Una línea debajo del nombre; opcional. */
  descripcion?: string;
}

/**
 * Menú desplegable sencillo, para agrupar los enlaces secundarios de la
 * barra bajo una sola etiqueta («Más»). Misma mecánica que MenuIndustrias
 * —abre al pasar o enfocar, cierra con Escape o al pulsar fuera— pero con
 * una lista corta de anclas, no tarjetas de industria.
 */
export function MenuDesplegable({
  etiqueta,
  items,
}: {
  etiqueta: string;
  items: EnlaceDeMenu[];
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
        className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        {etiqueta}
        <ChevronDown
          className={
            "size-3.5 transition-transform " + (abierto ? "rotate-180" : "")
          }
        />
      </button>

      {abierto && (
        <div id={idPanel} className="absolute left-0 top-full z-50 w-64 pt-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl shadow-neutral-900/10">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className="block rounded-xl px-3 py-2.5 no-underline transition-colors hover:bg-brand-50"
              >
                <span className="block text-sm font-semibold text-neutral-900">
                  {item.label}
                </span>
                {item.descripcion && (
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                    {item.descripcion}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
