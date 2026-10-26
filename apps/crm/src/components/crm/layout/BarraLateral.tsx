import { useCanAccess, useCanAccessResources, useTranslate } from "ra-core";
import {
  Building2,
  CalendarCheck,
  ChartColumn,
  CheckSquare,
  CircleHelp,
  Contact,
  CreditCard,
  Handshake,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Ticket,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { InformesPage } from "../misc/InformesPage";
import { MiDiaPage } from "../mi-dia/MiDiaPage";
import { esPantallaDeAjustes } from "../settings/apartadosDeAjustes";
import { AyudaPage } from "../ayuda/AyudaPage";
import { MODULE_REGISTRY, type GrupoDelMenu } from "../modules/registry";
import { MarcaVinqulia } from "./MarcaVinqulia";
import { FacturacionPage } from "../facturacion/FacturacionPage";
import { TarjetaDelPlan } from "../facturacion/TarjetaDelPlan";
import { useDerechos } from "../facturacion/useDerechos";
import { facturacionDisponible } from "@/lib/kontrolia-auth/facturacion";
import {
  EnlaceDeSeccion,
  GrupoDesplegable,
  RotuloDelMenu,
  type Entrada,
  type Grupo,
  type Seccion,
} from "./ElementosDelMenu";

const esGrupo = (entrada: Entrada): entrada is Grupo => "secciones" in entrada;

/**
 * Navegación principal de Vinqulia, en una barra lateral.
 *
 * Ordenada como la de AduaniaX: Inicio arriba, y lo demás en bloques con
 * rótulo («Comercial», «Seguimiento», «Sistema») donde lo que va junto se
 * agrupa en un desplegable. Con todo suelto eran más de veinte entradas en
 * fila y no se encontraba nada; agrupadas caben en una pantalla de portátil
 * sin desplazarse.
 */

interface Bloque {
  /** Sin rótulo, el bloque de arriba (Inicio y lo que va a su lado). */
  titulo?: string;
  entradas: Entrada[];
}

export const BarraLateral = () => {
  const translate = useTranslate();
  const { darkModeLogo, title, modules } = useConfigurationContext();
  const { pathname } = useLocation();
  const { derechos } = useDerechos();
  const { canAccess: puedeConfigurar } = useCanAccess({
    resource: "configuration",
    action: "edit",
  });

  const plural = (recurso: string) =>
    translate(`resources.${recurso}.name`, { smart_count: 2 });

  // Lo que aporta cada módulo ACTIVO, repartido por el grupo que declara en
  // el catálogo. Un módulo apagado simplemente no aparece.
  const deModulos = (grupo: GrupoDelMenu | undefined): Seccion[] =>
    MODULE_REGISTRY.filter(
      (modulo) => modules[modulo.key]?.active && modulo.grupo === grupo,
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

  const bloques: Bloque[] = [
    {
      entradas: [
        {
          etiqueta: translate("ra.page.dashboard"),
          ruta: "/",
          Icono: LayoutDashboard,
        },
        {
          etiqueta: translate("crm.my_day.title"),
          ruta: MiDiaPage.path,
          Icono: CalendarCheck,
        },
        ...deModulos("inicio"),
      ],
    },
    {
      titulo: "Comercial",
      entradas: [
        {
          clave: "directorio",
          etiqueta: "Directorio",
          Icono: Contact,
          secciones: [
            {
              etiqueta: plural("contacts"),
              ruta: "/contacts",
              Icono: Contact,
              recurso: "contacts",
            },
            {
              etiqueta: plural("companies"),
              ruta: "/companies",
              Icono: Building2,
              recurso: "companies",
            },
            ...deModulos("directorio"),
          ],
        },
        {
          clave: "ventas",
          etiqueta: "Ventas",
          Icono: Handshake,
          secciones: [
            {
              etiqueta: plural("deals"),
              ruta: "/deals",
              Icono: Handshake,
              recurso: "deals",
            },
            {
              etiqueta: plural("quotes"),
              ruta: "/quotes",
              Icono: ReceiptText,
              recurso: "quotes",
            },
            ...deModulos("ventas"),
          ],
        },
        {
          clave: "facturacion",
          etiqueta: "Facturación",
          Icono: ReceiptText,
          secciones: deModulos("facturacion"),
        },
        // Un módulo que no declara grupo va suelto, al final del bloque.
        ...deModulos(undefined),
      ],
    },
    {
      titulo: "Seguimiento",
      entradas: [
        {
          etiqueta: plural("tasks"),
          ruta: "/tasks",
          Icono: CheckSquare,
          recurso: "tasks",
        },
        {
          etiqueta: plural("tickets"),
          ruta: "/tickets",
          Icono: Ticket,
          recurso: "tickets",
        },
        {
          etiqueta: translate("crm.reports.title", { _: "Informes" }),
          ruta: InformesPage.path,
          Icono: ChartColumn,
        },
      ],
    },
    {
      titulo: "Sistema",
      entradas: [
        // Ajustes: la puerta a la administración de la organización.
        // Usuarios, plantillas, importar, automatizaciones, correo… viven
        // ahí dentro, con su propio menú (ver settings/apartadosDeAjustes).
        // Solo para quien puede editar la configuración.
        ...(puedeConfigurar
          ? [
              {
                etiqueta: translate("crm.settings.title"),
                ruta: "/settings",
                Icono: Settings,
              },
            ]
          : []),
        // Para todo el mundo: es lo primero que busca quien acaba de
        // entrar y no sabe qué es un CRM.
        { etiqueta: "Ayuda", ruta: AyudaPage.path, Icono: CircleHelp },
      ],
    },
  ];

  // Una sola consulta de permisos para todo el menú, en vez de un
  // <CanAccess> por enlace: así se sabe qué grupos quedan vacíos y se
  // ocultan enteros en lugar de dejar un desplegable sin nada dentro.
  const recursos = [
    ...new Set(
      bloques
        .flatMap((bloque) => bloque.entradas)
        .flatMap((entrada) =>
          esGrupo(entrada) ? entrada.secciones : [entrada],
        )
        .flatMap((seccion) => (seccion.recurso ? [seccion.recurso] : [])),
    ),
  ];
  const { canAccess: permisos } = useCanAccessResources({
    action: "list",
    resources: recursos,
  });
  const visible = (seccion: Seccion) =>
    !seccion.recurso || permisos?.[seccion.recurso] === true;

  const bloquesVisibles = bloques
    .map((bloque) => ({
      ...bloque,
      entradas: bloque.entradas.flatMap((entrada): Entrada[] => {
        if (!esGrupo(entrada)) return visible(entrada) ? [entrada] : [];
        const secciones = entrada.secciones.filter(visible);
        return secciones.length > 0 ? [{ ...entrada, secciones }] : [];
      }),
    }))
    .filter((bloque) => bloque.entradas.length > 0);

  // La raíz solo se marca activa en coincidencia exacta: de otro modo lo
  // estaría siempre, porque toda ruta empieza por "/". Las pantallas de
  // Ajustes que viven bajo otra ruta (/sales, /bandeja/configurar…) marcan
  // Ajustes y no la sección con la que comparten prefijo.
  const enAjustes = esPantallaDeAjustes(pathname);
  const estaActiva = (ruta: string) => {
    if (ruta === "/settings") return enAjustes;
    if (ruta === "/") return pathname === "/";
    return !enAjustes && pathname.startsWith(ruta);
  };

  return (
    // Pegada a la ventana, no a la página: `self-start` evita que el flex la
    // estire hasta el alto del contenido —que es lo que la hacía crecer y
    // dejar el plan al final de un scroll largo—, y `h-dvh` + `sticky` la
    // mantienen del alto de la pantalla mientras el contenido se desplaza al
    // lado. Ambos descuentan --kontrolia-band-height (la banda del
    // ecosistema, fija arriba; 0 si no se pinta).
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

        {/* Lo único que se desplaza. El margen negativo saca la barra de
            desplazamiento al borde del panel sin que el contenido pierda su
            margen. */}
        <nav className="-mr-3 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pt-1 pr-3 pb-3 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
          {bloquesVisibles.map((bloque) => (
            <div
              key={bloque.titulo ?? "inicio"}
              className="flex flex-col gap-0.5"
            >
              {bloque.titulo && <RotuloDelMenu texto={bloque.titulo} />}
              {bloque.entradas.map((entrada) =>
                esGrupo(entrada) ? (
                  <GrupoDesplegable
                    key={entrada.clave}
                    grupo={entrada}
                    estaActiva={estaActiva}
                  />
                ) : (
                  <EnlaceDeSeccion
                    key={entrada.ruta}
                    seccion={entrada}
                    activa={estaActiva(entrada.ruta)}
                  />
                ),
              )}
            </div>
          ))}
        </nav>

        {/* Fijo al fondo: solo el plan. Por encima del menú (z-20) para que,
            al desplegarse, lo tape. */}
        {(derechos?.subscription || facturacionDisponible()) && (
          <div className="relative z-20 shrink-0 border-t border-sidebar-border pt-3">
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
              <Link
                to={FacturacionPage.path}
                className="flex items-center gap-3 rounded-[14px] px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/70 no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CreditCard className="size-4 shrink-0 text-sidebar-icon" />
                {translate("crm.billing.title")}
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
