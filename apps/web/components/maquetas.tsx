import {
  Building2,
  Contact,
  Handshake,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";

import { Contador } from "./Contador";

/**
 * Maquetas del producto (no son capturas: son la interfaz dibujada con HTML y
 * CSS). Están parametrizadas para que cada página de industria muestre un
 * tablero con oportunidades propias de su negocio, en lugar de repetir los
 * mismos nombres genéricos en todas.
 */

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
        app.vinqulia.com
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
    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
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

export const TarjetaDeOportunidad = ({
  nombre,
  empresa,
  monto,
  iniciales,
  color,
  etiqueta,
}: TarjetaTablero) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
    <div className="flex items-center gap-2">
      <AvatarIniciales iniciales={iniciales} color={color} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-neutral-800">
          {nombre}
        </p>
        <p className="truncate text-xs text-neutral-500">{empresa}</p>
      </div>
    </div>
    <div className="mt-2.5 flex items-center justify-between">
      <span className="text-[13px] font-bold tabular-nums text-neutral-900">
        {monto}
      </span>
      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
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

export const MockupTablero = ({
  columnas = COLUMNAS_POR_DEFECTO,
  titulo = "Oportunidades",
  montoEnJuego = 128400,
}: {
  columnas?: ColumnaTablero[];
  titulo?: string;
  montoEnJuego?: number;
}) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-3">
      <Handshake className="size-4 text-brand-600" />
      <p className="text-sm font-semibold text-neutral-800">{titulo}</p>
      <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
        ▲ <Contador valor={montoEnJuego} prefijo="$" sufijo=" MXN" /> en juego
      </span>
    </div>
    <div className="grid flex-1 grid-cols-4 gap-3 bg-neutral-50/70 p-4">
      {columnas.map((columna) => (
        <div key={columna.titulo} className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className={"size-2 rounded-full " + columna.color} />
            <p className="truncate text-xs font-semibold text-neutral-700">
              {columna.titulo}
            </p>
            <span className="ml-auto rounded-full bg-neutral-200/70 px-1.5 text-[10px] font-medium text-neutral-600">
              {columna.tarjetas.length}
            </span>
          </div>
          {columna.tarjetas.map((tarjeta) => (
            <TarjetaDeOportunidad key={tarjeta.nombre} {...tarjeta} />
          ))}
          <div className="flex h-9 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-neutral-400">
            <Plus className="size-3.5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Barra lateral dibujada dentro de la maqueta. */
const BarraLateralMaqueta = () => (
  <div className="hidden w-44 shrink-0 flex-col gap-1 bg-neutral-900 p-3 sm:flex">
    <div className="mb-3 flex items-center gap-1.5 px-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/vinqulia-icon.png"
        alt=""
        aria-hidden
        className="size-6 rounded-md"
      />
      <span className="text-[13px] font-semibold text-white">Vinqulia</span>
    </div>
    {[
      { icono: LayoutDashboard, etiqueta: "Tablero" },
      { icono: Contact, etiqueta: "Contactos" },
      { icono: Building2, etiqueta: "Empresas" },
      { icono: Handshake, etiqueta: "Oportunidades", activo: true },
      { icono: Users, etiqueta: "Equipo" },
    ].map((item) => (
      <span
        key={item.etiqueta}
        className={
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] " +
          (item.activo
            ? "bg-brand-600 font-medium text-white"
            : "text-neutral-400")
        }
      >
        <item.icono className="size-3" />
        {item.etiqueta}
      </span>
    ))}
  </div>
);

/** Maqueta completa (navegador + barra lateral + tablero). */
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
    <div className="flex">
      <BarraLateralMaqueta />
      <div className="min-w-0 flex-1">
        <MockupTablero
          columnas={columnas}
          montoEnJuego={montoEnJuego}
          titulo={titulo}
        />
      </div>
    </div>
  </MarcoDelNavegador>
);
