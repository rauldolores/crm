"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que cuenta hacia arriba cuando entra en pantalla.
 *
 * En el HTML servido se pinta ya el valor final (sin JavaScript, o si el
 * navegador no puede animar, el dato siempre se lee bien); al montar, si el
 * elemento aún no está en pantalla, arranca desde cero y cuenta al aparecer.
 * Respeta la preferencia de movimiento reducido.
 */
export function Contador({
  valor,
  prefijo = "",
  sufijo = "",
  decimales = 0,
  duracion = 1400,
}: {
  valor: number;
  prefijo?: string;
  sufijo?: string;
  decimales?: number;
  duracion?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mostrado, setMostrado] = useState(valor);
  const yaAnimo = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const animar = () => {
      if (yaAnimo.current) return;
      yaAnimo.current = true;
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const avance = Math.min((ahora - inicio) / duracion, 1);
        // Suavizado de salida: rápido al principio, se asienta al final.
        const suave = 1 - Math.pow(1 - avance, 3);
        setMostrado(valor * suave);
        if (avance < 1) requestAnimationFrame(paso);
        else setMostrado(valor);
      };
      setMostrado(0);
      requestAnimationFrame(paso);
    };

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            animar();
            observador.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [valor, duracion]);

  const formateador = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

  return (
    <span ref={ref} className="tabular-nums">
      {prefijo}
      {formateador.format(mostrado)}
      {sufijo}
    </span>
  );
}
