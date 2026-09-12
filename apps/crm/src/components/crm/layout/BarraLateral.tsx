import { CanAccess, useTranslate } from "ra-core";
import {
  Building2,
  ChartColumn,
  CheckSquare,
  Contact,
  CreditCard,
  FileText,
  Handshake,
  Import,
  LayoutDashboard,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { InformesPage } from "../misc/InformesPage";
import { ImportPage } from "../misc/ImportPage";
import { MODULE_REGISTRY } from "../modules/registry";
import { ConsumoDelPlan } from "../facturacion/ConsumoDelPlan";
import { FacturacionPage } from "../facturacion/FacturacionPage";
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
      "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm no-underline transition-all",
      activa
        ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
    ].join(" ")}
  >
    <seccion.Icono
      className={[
        "size-4 shrink-0 transition-transform",
        activa ? "scale-105" : "",
      ].join(" ")}
    />
    <span className="truncate">{seccion.etiqueta}</span>
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
          "px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
          esPrimero ? "" : "mt-4",
        ].join(" ")}
      >
        {titulo}
      </p>
      <nav className="flex flex-col gap-1">
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
  ).map((modulo) => ({
    etiqueta: translate(modulo.nameKey),
    ruta: modulo.path,
    Icono: modulo.icon,
    recurso: modulo.key,
  }));

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
    <aside className="relative hidden w-60 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="relative flex flex-1 flex-col gap-1 p-3">
        <Link
          to="/"
          className="group mb-5 flex items-center gap-2.5 px-2 py-1 no-underline text-sidebar-foreground"
        >
          <img
            src={darkModeLogo}
            alt={title}
            className="size-9 rounded-lg transition-opacity group-hover:opacity-90"
          />
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            {title}
          </span>
        </Link>

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

        <div className="mt-auto border-t border-sidebar-border pt-4">
          {/* Ajustes: la única puerta a la administración de la
              organización (automatizaciones, formularios, API, módulos,
              correo, IA viven todas ahí dentro). Antes se repartían sueltas
              en el menú del avatar, junto a lo personal; aquí quedan
              agrupadas y solo las ve quien puede editar la configuración. */}
          <CanAccess resource="configuration" action="edit">
            <Link
              to="/settings"
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Settings className="size-4 shrink-0" />
              {translate("crm.settings.title")}
            </Link>
          </CanAccess>

          {/* Consumo del plan, siempre a la vista: es lo que evita que el
              límite sorprenda a mitad de una importación. Sin suscripción
              todavía (nada que consumir) queda un enlace de texto plano, para
              que "Plan y facturación" nunca se quede sin una entrada. */}
          {derechos?.subscription ? (
            <Link
              to={FacturacionPage.path}
              className="mb-4 flex flex-col gap-2 rounded-lg px-2 py-2 text-sidebar-foreground no-underline hover:bg-sidebar-accent"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {translate("crm.billing.plan_named", {
                  // El nombre del plan ya suele venir como «Plan Impulso»:
                  // sin esto se leería «Plan Plan Impulso».
                  plan: derechos.subscription.planName.replace(/^plan\s+/i, ""),
                })}
              </span>
              <ConsumoDelPlan usage={derechos.usage} compacto />
            </Link>
          ) : (
            facturacionDisponible() && (
              <Link
                to={FacturacionPage.path}
                className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <CreditCard className="size-4 shrink-0" />
                {translate("crm.billing.title")}
              </Link>
            )
          )}
          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            <img src={darkModeLogo} alt="" className="h-4 w-4 opacity-60" />
            <span className="truncate">{title} · CRM</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
