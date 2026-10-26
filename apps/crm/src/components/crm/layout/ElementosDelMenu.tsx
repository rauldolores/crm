import { ChevronRight, type LayoutDashboard } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router";

/** Un destino del menú lateral. */
export interface Seccion {
  etiqueta: string;
  ruta: string;
  Icono: typeof LayoutDashboard;
  /** Recurso a comprobar antes de mostrarla, si aplica. */
  recurso?: string;
  /** Lo pendiente de la sección (la bandeja), a la derecha del nombre. */
  Contador?: ComponentType;
}

/** Varios destinos bajo un mismo título que se despliega, como en AduaniaX. */
export interface Grupo {
  clave: string;
  etiqueta: string;
  Icono: typeof LayoutDashboard;
  secciones: Seccion[];
}

export type Entrada = Seccion | Grupo;

/** Rótulo diminuto que separa los bloques («Comercial», «Sistema»…). */
export const RotuloDelMenu = ({ texto }: { texto: string }) => (
  <p className="mt-5 px-3 pb-1.5 text-[9px] font-black tracking-[0.2em] text-sidebar-label uppercase">
    {texto}
  </p>
);

export const EnlaceDeSeccion = ({
  seccion,
  activa,
}: {
  seccion: Seccion;
  activa: boolean;
}) => (
  <Link
    to={seccion.ruta}
    aria-current={activa ? "page" : undefined}
    className={[
      // Como «Inicio» en AduaniaX: la sección activa en el color de marca
      // pleno; las demás, apagadas hasta pasar el ratón.
      "relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-semibold no-underline outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
      activa
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    ].join(" ")}
  >
    <seccion.Icono
      className={[
        "size-4 shrink-0",
        activa ? "text-primary-foreground" : "text-sidebar-icon/70",
      ].join(" ")}
    />
    <span className="truncate">{seccion.etiqueta}</span>
    {seccion.Contador && <seccion.Contador />}
  </Link>
);

/**
 * Un grupo que se despliega con sus secciones debajo, sangradas y sin
 * icono, como los submenús de AduaniaX. Abre solo cuando una de sus
 * secciones es la pantalla actual; si no, lo abre quien lo pulsa.
 */
export const GrupoDesplegable = ({
  grupo,
  estaActiva,
}: {
  grupo: Grupo;
  estaActiva: (ruta: string) => boolean;
}) => {
  const activo = grupo.secciones.some((seccion) => estaActiva(seccion.ruta));
  const [abierto, setAbierto] = useState(activo);

  // Al llegar a una de sus pantallas por otro camino (un enlace dentro de
  // la página, el historial), el grupo se abre para enseñar dónde se está.
  useEffect(() => {
    if (activo) setAbierto(true);
  }, [activo]);

  return (
    <div>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
        className={[
          "flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          activo
            ? "bg-sidebar-accent text-sidebar-strong"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        ].join(" ")}
      >
        <grupo.Icono
          className={[
            "size-4 shrink-0",
            activo ? "text-sidebar-icon" : "text-sidebar-icon/70",
          ].join(" ")}
        />
        <span className="flex-1 truncate">{grupo.etiqueta}</span>
        <ChevronRight
          className={[
            "size-3.5 shrink-0 transition-transform duration-200",
            abierto
              ? "rotate-90 text-sidebar-icon"
              : "text-sidebar-foreground/40",
          ].join(" ")}
        />
      </button>
      {/* 0fr → 1fr: anima la altura real del contenido, sin medirla. */}
      <div
        className={[
          "grid transition-[grid-template-rows] duration-200 ease-out",
          abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 pt-0.5">
            {grupo.secciones.map((seccion) => {
              const activa = estaActiva(seccion.ruta);
              return (
                <Link
                  key={seccion.ruta}
                  to={seccion.ruta}
                  tabIndex={abierto ? undefined : -1}
                  aria-current={activa ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-xl py-2 pr-3 pl-9 text-[12.5px] font-medium no-underline outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    activa
                      ? "bg-primary/15 text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "size-1 shrink-0 rounded-full",
                      activa ? "bg-primary" : "bg-sidebar-foreground/30",
                    ].join(" ")}
                  />
                  <span className="truncate">{seccion.etiqueta}</span>
                  {seccion.Contador && <seccion.Contador />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
