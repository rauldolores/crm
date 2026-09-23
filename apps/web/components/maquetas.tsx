import {
  Building2,
  CheckSquare,
  Contact,
  Handshake,
  LayoutDashboard,
} from "lucide-react";

import { URL_APP } from "../lib/sitio";

import { Contador } from "./Contador";
import { Escalado } from "./Escalado";

/**
 * Maquetas del producto (no son capturas: son la interfaz dibujada con HTML y
 * CSS). Están parametrizadas para que cada página de industria muestre un
 * tablero con oportunidades propias de su negocio, en lugar de repetir los
 * mismos nombres genéricos en todas; una captura real no podría hacer eso
 * sin una organización demo por industria.
 *
 * Se dibujan al ancho real de la aplicación y se reducen con <Escalado>,
 * como haría una captura: así nunca desbordan ni recortan datos, y siguen
 * el diseño «Papel» actual (barra lateral clara, superficies planas).
 */

/** El dominio que se dibuja en la barra de direcciones, sin protocolo. */
const DOMINIO_DE_LA_APP = URL_APP.replace(/^https?:\/\//, "");

/** Ancho y alto naturales de la app en las maquetas, en px. */
const ANCHO_APP = 1040;
const ALTO_APP = 520;
const ANCHO_BARRA = 200;
/** El papel del CRM: el mismo fondo que la aplicación real. */
const PAPEL = "#fbf9f9";

export const MarcoDelNavegador = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10">
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="size-3 rounded-full bg-neutral-300" />
      <span className="size-3 rounded-full bg-neutral-300" />
      <span className="size-3 rounded-full bg-neutral-300" />
      <span className="ml-3 hidden flex-1 rounded-md bg-white px-3 py-1 text-xs text-neutral-400 ring-1 ring-neutral-200 sm:block">
        {DOMINIO_DE_LA_APP}
      </span>
    </div>
    {children}
  </div>
);

export const AvatarIniciales = ({
  iniciales,
  color,
}: {
  iniciales: string;
  color: string;
}) => (
  <span
    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
    style={{ backgroundColor: color }}
  >
    {iniciales}
  </span>
);

export type TarjetaTablero = {
  nombre: string;
  empresa: string;
  monto: string;
  iniciales: string;
  color: string;
  etiqueta: string;
};

export type ColumnaTablero = {
  titulo: string;
  color: string;
  tarjetas: TarjetaTablero[];
};

/** Tarjeta del kanban, con la misma jerarquía que la app: nombre, empresa, importe + categoría. */
export const TarjetaDeOportunidad = ({
  nombre,
  empresa,
  monto,
  iniciales,
  color,
  etiqueta,
}: TarjetaTablero) => (
  <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
    <div className="flex items-start gap-2">
      <p className="flex-1 text-[13px] leading-snug font-medium text-neutral-800">
        {nombre}
      </p>
      <AvatarIniciales iniciales={iniciales} color={color} />
    </div>
    <p className="mt-1 truncate text-xs text-neutral-500">{empresa}</p>
    <div className="mt-2 flex items-center justify-between">
      <span className="text-[13px] font-medium text-neutral-900 tabular-nums">
        {monto}
      </span>
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
        {etiqueta}
      </span>
    </div>
  </div>
);

/** Tablero de oportunidades por defecto (el de la página principal). */
export const COLUMNAS_POR_DEFECTO: ColumnaTablero[] = [
  {
    titulo: "Oportunidad",
    color: "bg-amber-400",
    tarjetas: [
      {
        nombre: "Ana García",
        empresa: "Grupo Nova",
        monto: "$24,500",
        iniciales: "AG",
        color: "#e2766a",
        etiqueta: "Nueva",
      },
      {
        nombre: "Luis Pérez",
        empresa: "Textiles del Norte",
        monto: "$9,800",
        iniciales: "LP",
        color: "#7d6ae2",
        etiqueta: "Web",
      },
    ],
  },
  {
    titulo: "Propuesta enviada",
    color: "bg-sky-400",
    tarjetas: [
      {
        nombre: "Marta Ruiz",
        empresa: "Distribuidora Sur",
        monto: "$31,200",
        iniciales: "MR",
        color: "#3f8fd0",
        etiqueta: "Correo",
      },
      {
        nombre: "Carlos Soto",
        empresa: "Andina Foods",
        monto: "$12,000",
        iniciales: "CS",
        color: "#4fb59a",
        etiqueta: "Propuesta",
      },
    ],
  },
  {
    titulo: "En negociación",
    color: "bg-brand-500",
    tarjetas: [
      {
        nombre: "Elena Vidal",
        empresa: "Innova Retail",
        monto: "$46,900",
        iniciales: "EV",
        color: "#b23b2e",
        etiqueta: "Caliente",
      },
      {
        nombre: "Pedro Linares",
        empresa: "Logística RM",
        monto: "$18,600",
        iniciales: "PL",
        color: "#9a7a3f",
        etiqueta: "Reunión",
      },
    ],
  },
  {
    titulo: "Ganada",
    color: "bg-emerald-500",
    tarjetas: [
      {
        nombre: "Sofía Castro",
        empresa: "Hábitat Build",
        monto: "$27,300",
        iniciales: "SC",
        color: "#3f8f7a",
        etiqueta: "Contrato",
      },
    ],
  },
];

const importeDe = (monto: string) => Number(monto.replace(/[^0-9]/g, ""));

/** El tablero a tamaño natural; siempre va dentro de un <Escalado>. */
const TableroNatural = ({
  columnas = COLUMNAS_POR_DEFECTO,
  titulo = "Oportunidades",
  montoEnJuego = 128400,
}: {
  columnas?: ColumnaTablero[];
  titulo?: string;
  montoEnJuego?: number;
}) => (
  <div className="flex h-full flex-col" style={{ backgroundColor: PAPEL }}>
    <div className="flex items-center gap-3 px-6 pt-5 pb-4">
      <p className="text-xl font-semibold tracking-tight text-neutral-900">
        {titulo}
      </p>
      <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
        ▲ <Contador valor={montoEnJuego} prefijo="$" sufijo=" MXN" /> en juego
      </span>
      <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
        + Nueva oportunidad
      </span>
    </div>
    <div
      className="grid flex-1 gap-3 px-6 pb-6"
      style={{
        gridTemplateColumns: `repeat(${columnas.length}, minmax(0, 1fr))`,
      }}
    >
      {columnas.map((columna) => {
        const total = columna.tarjetas.reduce(
          (suma, tarjeta) => suma + importeDe(tarjeta.monto),
          0,
        );
        return (
          <div key={columna.titulo} className="flex flex-col gap-2">
            <div className="flex flex-col items-center gap-0.5 pb-1">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-800">
                {columna.titulo}
                <span className="rounded-full bg-neutral-200/70 px-1.5 text-[10px] text-neutral-600">
                  {columna.tarjetas.length}
                </span>
              </p>
              <p className="text-[11px] text-neutral-500 tabular-nums">
                ${total.toLocaleString("es-MX")}
              </p>
            </div>
            {columna.tarjetas.map((tarjeta) => (
              <TarjetaDeOportunidad key={tarjeta.nombre} {...tarjeta} />
            ))}
            {columna.tarjetas.length === 0 && (
              <div className="min-h-24 rounded-xl border border-dashed border-neutral-300" />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

/** Tablero solo (sin barra lateral), escalado al ancho disponible. */
export const MockupTablero = (props: {
  columnas?: ColumnaTablero[];
  titulo?: string;
  montoEnJuego?: number;
}) => (
  <Escalado ancho={ANCHO_APP - ANCHO_BARRA} alto={ALTO_APP - 60}>
    <TableroNatural {...props} />
  </Escalado>
);

/** Barra lateral dibujada dentro de la maqueta, con el diseño «Papel». */
const BarraLateralMaqueta = () => (
  <div
    className="flex shrink-0 flex-col gap-0.5 border-r border-neutral-200 p-3"
    style={{ width: ANCHO_BARRA, backgroundColor: PAPEL }}
  >
    <div className="mb-4 flex items-center gap-2 px-2 py-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/vinqulia-icon.png"
        alt=""
        aria-hidden
        className="size-8 rounded-lg"
      />
      <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
        Vinqulia
      </span>
    </div>
    <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
      Principal
    </p>
    {[
      { icono: LayoutDashboard, etiqueta: "Panel" },
      { icono: Contact, etiqueta: "Contactos" },
      { icono: Building2, etiqueta: "Empresas" },
      { icono: Handshake, etiqueta: "Oportunidades", activo: true },
      { icono: CheckSquare, etiqueta: "Tareas" },
    ].map((item) => (
      <span
        key={item.etiqueta}
        className={
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] " +
          (item.activo
            ? "bg-brand-100/70 font-medium text-brand-800"
            : "text-neutral-600")
        }
      >
        <item.icono className="size-4" />
        {item.etiqueta}
      </span>
    ))}
  </div>
);

/** Maqueta completa (navegador + barra lateral + tablero), escalada. */
export const MaquetaAplicacion = ({
  columnas,
  montoEnJuego,
  titulo,
}: {
  columnas?: ColumnaTablero[];
  montoEnJuego?: number;
  titulo?: string;
}) => (
  <MarcoDelNavegador>
    <Escalado ancho={ANCHO_APP} alto={ALTO_APP}>
      <div className="flex h-full">
        <BarraLateralMaqueta />
        <div className="min-w-0 flex-1">
          <TableroNatural
            columnas={columnas}
            montoEnJuego={montoEnJuego}
            titulo={titulo}
          />
        </div>
      </div>
    </Escalado>
  </MarcoDelNavegador>
);
