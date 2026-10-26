import { CanAccess, useTranslate } from "ra-core";
import {
  Building2,
  ChartColumn,
  CheckSquare,
  CircleHelp,
  Contact,
  CreditCard,
  FileText,
  Handshake,
  Import,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { Link, useLocation } from "react-router";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { InformesPage } from "../misc/InformesPage";
import { ImportPage } from "../misc/ImportPage";
import { AyudaPage } from "../ayuda/AyudaPage";
import { MODULE_REGISTRY } from "../modules/registry";
import { MarcaVinqulia } from "./MarcaVinqulia";
import { FacturacionPage } from "../facturacion/FacturacionPage";
import { TarjetaDelPlan } from "../facturacion/TarjetaDelPlan";
import { useDerechos } from "../facturacion/useDerechos";
import { facturacionDisponible } from "@/lib/kontrolia-auth/facturacion";

/**
 * Navegación principal de Vinqulia, en una barra lateral.
 *
 * Antes vivía en una fila de pestañas dentro de la cabecera. Una barra lateral
 * escala mejor: caben más secciones sin apretar, cada una con su icono, y deja
 * la parte superior libre para lo que es contextual —organización, búsqueda,
 * perfil— en lugar de mezclarlo con la navegación.
 */

interface Seccion {
  etiqueta: string;
  ruta: string;
  Icono: typeof LayoutDashboard;
  /** Recurso a comprobar antes de mostrarla, si aplica. */
  recurso?: string;
  /** Lo pendiente de la sección (la bandeja), a la derecha del nombre. */
  Contador?: ComponentType;
}

const EnlaceDeSeccion = ({
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
 * Un grupo con su encabezado ("Principal", "Módulos", "Herramientas...").
 * No pinta nada si no tiene secciones — así un grupo dinámico (los módulos
 * activos, por ejemplo) desaparece entero en vez de dejar un título huérfano.
 */
const GrupoDeSecciones = ({
  titulo,
  secciones,
  estaActiva,
  esPrimero = false,
}: {
  titulo: string;
  secciones: Seccion[];
  estaActiva: (ruta: string) => boolean;
  /** El primer grupo no lleva el margen superior que separa a los demás. */
  esPrimero?: boolean;
}) => {
  if (secciones.length === 0) return null;
  return (
    <>
      <p
        className={[
          "px-3 pb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-sidebar-label",
          esPrimero ? "mt-2" : "mt-5",
        ].join(" ")}
      >
        {titulo}
      </p>
      <nav className="flex flex-col gap-0.5">
        {secciones.map((seccion) =>
          seccion.recurso ? (
            <CanAccess
              key={seccion.ruta}
              resource={seccion.recurso}
              action="list"
            >
              <EnlaceDeSeccion
                seccion={seccion}
                activa={estaActiva(seccion.ruta)}
              />
            </CanAccess>
          ) : (
            <EnlaceDeSeccion
              key={seccion.ruta}
              seccion={seccion}
              activa={estaActiva(seccion.ruta)}
            />
          ),
        )}
      </nav>
    </>
  );
};

export const BarraLateral = () => {
  const translate = useTranslate();
  const { darkModeLogo, title, modules } = useConfigurationContext();
  const { pathname } = useLocation();
  const { derechos } = useDerechos();

  // Un ítem por módulo ACTIVO, en el orden del catálogo. Un módulo apagado
  // simplemente no aparece — no hace falta más para "activar/desactivar sin
  // afectar el sistema" del lado de la navegación.
  const seccionesDeModulos: Seccion[] = MODULE_REGISTRY.filter(
    (modulo) => modules[modulo.key]?.active,
  ).flatMap((modulo) => [
    {
      etiqueta: translate(modulo.nameKey),
      ruta: modulo.path,
      Icono: modulo.icon,
      recurso: modulo.key,
      Contador: modulo.Contador,
    },
    ...(modulo.extraLinks ?? []).map((enlace) => ({
      etiqueta: translate(enlace.nameKey),
      ruta: enlace.path,
      Icono: enlace.icon,
      recurso: modulo.key,
    })),
  ]);

  const secciones: Seccion[] = [
    {
      etiqueta: translate("ra.page.dashboard"),
      ruta: "/",
      Icono: LayoutDashboard,
    },
    {
      etiqueta: translate("resources.contacts.name", { smart_count: 2 }),
      ruta: "/contacts",
      Icono: Contact,
      recurso: "contacts",
    },
    {
      etiqueta: translate("resources.companies.name", { smart_count: 2 }),
      ruta: "/companies",
      Icono: Building2,
      recurso: "companies",
    },
    {
      etiqueta: translate("resources.deals.name", { smart_count: 2 }),
      ruta: "/deals",
      Icono: Handshake,
      recurso: "deals",
    },
    {
      etiqueta: translate("resources.quotes.name", { smart_count: 2 }),
      ruta: "/quotes",
      Icono: ReceiptText,
      recurso: "quotes",
    },
    {
      etiqueta: translate("resources.tasks.name", { smart_count: 2 }),
      ruta: "/tasks",
      Icono: CheckSquare,
      recurso: "tasks",
    },
    {
      etiqueta: translate("resources.tickets.name", { smart_count: 2 }),
      ruta: "/tickets",
      Icono: Ticket,
      recurso: "tickets",
    },
    {
      etiqueta: translate("resources.sales.name", { smart_count: 2 }),
      ruta: "/sales",
      Icono: Users,
      recurso: "sales",
    },
    {
      etiqueta: translate("crm.reports.title", { _: "Informes" }),
      ruta: InformesPage.path,
      Icono: ChartColumn,
    },
  ];

  // Herramientas de uso ocasional, no de trabajo diario: plantillas y
  // carga masiva. Ninguna exige permiso de "configuration" —quien puede ver
  // plantillas o importar datos hoy sigue pudiendo verlo, solo que ya no
  // mezclado con lo personal dentro del menú del avatar.
  const seccionesDeHerramientas: Seccion[] = [
    {
      etiqueta: translate("crm.email_templates.title"),
      ruta: "/email_templates",
      Icono: FileText,
      recurso: "email_templates",
    },
    {
      etiqueta: translate("crm.header.import_data"),
      ruta: ImportPage.path,
      Icono: Import,
    },
  ];

  // La raíz solo se marca activa en coincidencia exacta: de otro modo lo
  // estaría siempre, porque toda ruta empieza por "/".
  const estaActiva = (ruta: string) =>
    ruta === "/" ? pathname === "/" : pathname.startsWith(ruta);

  return (
    // Pegada a la ventana, no a la página: `self-start` evita que el flex la
    // estire hasta el alto del contenido —que es lo que la hacía crecer y
    // dejar el consumo del plan al final de un scroll largo—, y `h-dvh` +
    // `sticky` la mantienen del alto de la pantalla mientras el contenido se
    // desplaza al lado. Ambos descuentan --kontrolia-band-height (la banda
    // del ecosistema, fija arriba; 0 si no se pinta).
    <aside className="sticky top-[var(--kontrolia-band-height,0px)] hidden h-[calc(100dvh_-_var(--kontrolia-band-height,0px))] w-60 shrink-0 flex-col self-start overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="relative flex min-h-0 flex-1 flex-col gap-1 p-3">
        {/* Encabezado de la marca, separado por una línea, como en AduaniaX. */}
        <Link
          to="/"
          aria-label={title}
          className="-mx-3 -mt-3 mb-2 flex h-16 shrink-0 items-center border-b border-sidebar-border px-5 no-underline transition-opacity hover:opacity-90"
        >
          <MarcaVinqulia logo={darkModeLogo} titulo={title} />
        </Link>

        {/* Lo único que se desplaza. Con muchos módulos activos la lista no
            cabe en una pantalla de portátil, y lo que se salía por abajo era
            justo lo de abajo: Ajustes, Ayuda y el consumo del plan. El
            margen negativo saca la barra de desplazamiento al borde del
            panel sin que el contenido pierda su margen. */}
        <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-3 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
          <GrupoDeSecciones
            titulo="Principal"
            secciones={secciones}
            estaActiva={estaActiva}
            esPrimero
          />
          <GrupoDeSecciones
            titulo={translate("crm.modules.title")}
            secciones={seccionesDeModulos}
            estaActiva={estaActiva}
          />
          <GrupoDeSecciones
            titulo={translate("crm.settings.sections.tools")}
            secciones={seccionesDeHerramientas}
            estaActiva={estaActiva}
          />
        </div>

        {/* Fijo al fondo: Ayuda, Ajustes y el plan siempre a la vista. Por
            encima del menú (z-20) para que el plan, al desplegarse, lo tape. */}
        <div className="relative z-20 shrink-0 border-t border-sidebar-border pt-4">
          {/* Ayuda: para todo el mundo, antes que Ajustes. Es lo primero que
              busca quien acaba de entrar y no sabe qué es un CRM. */}
          <Link
            to={AyudaPage.path}
            className={[
              "mb-1 flex items-center gap-3 rounded-[14px] px-3 py-2 text-[13px] font-semibold no-underline transition-colors",
              estaActiva(AyudaPage.path)
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            ].join(" ")}
          >
            <CircleHelp className="size-4 shrink-0 text-sidebar-icon" />
            Ayuda
          </Link>

          {/* Ajustes: la única puerta a la administración de la
              organización (automatizaciones, formularios, API, módulos,
              correo, IA viven todas ahí dentro). Antes se repartían sueltas
              en el menú del avatar, junto a lo personal; aquí quedan
              agrupadas y solo las ve quien puede editar la configuración. */}
          <CanAccess resource="configuration" action="edit">
            <Link
              to="/settings"
              className="mb-1 flex items-center gap-3 rounded-[14px] px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/70 no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Settings className="size-4 shrink-0 text-sidebar-icon" />
              {translate("crm.settings.title")}
            </Link>
          </CanAccess>

          {/* Plan plegado («Plan Max»): se despliega hacia arriba al pasar
              el ratón con el consumo de cada límite, como en AduaniaX. Sin
              suscripción todavía (nada que consumir) queda un enlace de texto
              plano, para que "Plan y facturación" nunca se quede sin entrada. */}
          {derechos?.subscription ? (
            <TarjetaDelPlan
              subscription={derechos.subscription}
              usage={derechos.usage}
            />
          ) : (
            facturacionDisponible() && (
              <Link
                to={FacturacionPage.path}
                className="mb-1 flex items-center gap-3 rounded-[14px] px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/70 no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CreditCard className="size-4 shrink-0 text-sidebar-icon" />
                {translate("crm.billing.title")}
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
};
