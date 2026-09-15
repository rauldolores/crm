"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dibuja un contenido a su tamaño natural (ancho fijo) y lo escala para
 * caber en el ancho disponible, como si fuera una captura de pantalla.
 *
 * Las maquetas de la aplicación necesitan sitio: un tablero con cuatro
 * columnas no cabe en 560 px sin recortar nombres e importes. En vez de
 * apretarlo, se maqueta a 1040 px (el ancho real de la app) y se reduce
 * entero; el texto sigue nítido porque es vectorial.
 */
export const Escalado = ({
  ancho,
  alto,
  children,
  className = "",
}: {
  /** Ancho natural del contenido, en px. */
  ancho: number;
  /** Alto natural del contenido, en px. */
  alto: number;
  children: React.ReactNode;
  className?: string;
}) => {
  const contenedor = useRef<HTMLDivElement>(null);
  // Antes de medir, una escala típica para que el servidor pinte algo
  // razonable y el primer frame no salte.
  const [escala, setEscala] = useState(0.56);

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => setEscala(el.clientWidth / ancho);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [ancho]);

  return (
    <div
      ref={contenedor}
      className={"relative w-full overflow-hidden " + className}
      style={{ height: alto * escala }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: ancho, height: alto, transform: `scale(${escala})` }}
      >
        {children}
      </div>
    </div>
  );
};
