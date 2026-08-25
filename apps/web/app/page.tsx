import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  Check,
  CheckSquare,
  Clock,
  Contact,
  Database,
  FileText,
  Globe,
  Handshake,
  Import,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  MessageCircle,
  Plug,
  Plus,
  Rocket,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";

import { FormularioDemo } from "../components/FormularioDemo";

/* ------------------------------------------------------------------ */
/* Marca                                                               */
/* ------------------------------------------------------------------ */

const Logo = ({ small = false }: { small?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-600/30">
      <svg
        width={small ? 16 : 20}
        height={small ? 16 : 20}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g fill="white">
          <rect x="16" y="14" width="16" height="72" rx="2" />
          <path d="M30.18 44.13 L76.18 14.13 L83.82 25.87 L37.82 55.87 Z" />
          <path d="M37.82 44.13 L83.82 74.13 L76.18 85.87 L30.18 55.87 Z" />
        </g>
      </svg>
    </span>
    <span
      className={
        small
          ? "text-lg font-semibold tracking-tight"
          : "text-xl font-semibold tracking-tight"
      }
    >
      Vinqulia
    </span>
  </span>
);

/* ------------------------------------------------------------------ */
/* CTAs                                                                */
/* ------------------------------------------------------------------ */

/** CTA comercial principal: lleva al formulario de calificación. */
const CtaDemo = ({
  children = "Quiero una demo personalizada",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <a
    href="#demo"
    className={
      "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 " +
      className
    }
  >
    {children}
    <ArrowRight className="size-4" />
  </a>
);

/** CTA secundario: para el visitante que prefiere explorar primero. */
const CtaExplorar = ({
  children = "Explorar Vinqulia",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <a
    href="#solucion"
    className={
      "inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 " +
      className
    }
  >
    {children}
  </a>
);

/* ------------------------------------------------------------------ */
/* Cabecera                                                            */
/* ------------------------------------------------------------------ */

const NAV = [
  { href: "#problemas", label: "El problema" },
  { href: "#solucion", label: "La solución" },
  { href: "#casos", label: "Casos de uso" },
  { href: "#migracion", label: "Migración" },
  { href: "#demo", label: "Demo" },
  { href: "#faq", label: "FAQ" },
];

const Navbar = () => (
  <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
      <a href="#top" className="no-underline">
        <Logo />
      </a>
      <nav className="hidden items-center gap-1 lg:flex">
        {NAV.map((enlace) => (
          <a
            key={enlace.href}
            href={enlace.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            {enlace.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <CtaExplorar className="hidden px-4 py-2 sm:inline-flex">
          Explorar Vinqulia
        </CtaExplorar>
        <a
          href="#demo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-all hover:bg-brand-700"
        >
          Quiero una demo personalizada
        </a>
      </div>
    </div>
  </header>
);

/* ------------------------------------------------------------------ */
/* Secciones compartidas                                               */
/* ------------------------------------------------------------------ */

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
    {children}
  </p>
);

const TituloDeSeccion = ({
  eyebrow,
  titulo,
  subtitulo,
}: {
  eyebrow: string;
  titulo: string;
  subtitulo: string;
}) => (
  <div className="mx-auto max-w-2xl text-center">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
      {titulo}
    </h2>
    <p className="mt-4 text-base leading-relaxed text-neutral-600">{subtitulo}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Mockups del producto                                                */
/* ------------------------------------------------------------------ */

const MarcoDelNavegador = ({ children }: { children: React.ReactNode }) => (
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

const AvatarIniciales = ({
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

const TarjetaDeOportunidad = ({
  nombre,
  empresa,
  monto,
  iniciales,
  color,
  etiqueta,
}: {
  nombre: string;
  empresa: string;
  monto: string;
  iniciales: string;
  color: string;
  etiqueta: string;
}) => (
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

const MockupKanban = () => (
  <div className="flex h-full flex-col">
    <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-3">
      <Handshake className="size-4 text-brand-600" />
      <p className="text-sm font-semibold text-neutral-800">Oportunidades</p>
      <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
        ▲ $128,400 MXN en juego
      </span>
    </div>
    <div className="grid flex-1 grid-cols-4 gap-3 bg-neutral-50/70 p-4">
      {[
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
      ].map((columna) => (
        <div key={columna.titulo} className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className={`size-2 rounded-full ${columna.color}`} />
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

const MockupWhatsApp = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <MessageCircle className="size-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-800">
          WhatsApp · Ana García
        </p>
        <p className="text-xs text-neutral-500">Enviado hace 2 h · +34 612 34 56 78</p>
      </div>
    </div>
    <div className="mt-3 space-y-2">
      <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-emerald-100 px-3 py-2 text-[13px] text-neutral-800">
        Hola Ana, te envío la propuesta revisada. ¿Quedamos el jueves para
        cerrarla?
      </div>
      <div className="max-w-[70%] rounded-xl rounded-tl-sm bg-neutral-100 px-3 py-2 text-[13px] text-neutral-700">
        ¡Hola! Perfecto, el jueves a las 10:00 me viene bien.
      </div>
    </div>
    <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <FileText className="size-3.5" />
      La conversación queda registrada en la ficha de Ana.
    </p>
  </div>
);

const MockupCorreo = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-sky-100 text-sky-600">
        <Mail className="size-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-800">
          Correo · Marta Ruiz
        </p>
        <p className="text-xs text-neutral-500">
          Enviado hoy · marta@distribuidorasur.com
        </p>
      </div>
    </div>
    <p className="mt-3 text-[13px] font-semibold text-neutral-800">
      Propuesta comercial — Distribuidora Sur
    </p>
    <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-neutral-600">
      Hola Marta, adjunto la propuesta con las condiciones que hablamos:
      implementación en 4 semanas, soporte incluido durante el primer año y
      y precios claros por usuario, en pesos mexicanos…
    </p>
    <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <Check className="size-3.5" />
      La respuesta se archiva sola en esta misma ficha.
    </p>
  </div>
);

const MockupFormulario = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-semibold text-neutral-800">Contáctanos</p>
    <div className="mt-3 space-y-2.5">
      {["Nombre completo *", "Correo electrónico *", "Teléfono"].map(
        (campo) => (
          <div
            key={campo}
            className="flex h-9 items-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-xs text-neutral-400"
          >
            {campo}
          </div>
        ),
      )}
      <div className="flex h-20 items-start rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400">
        Mensaje
      </div>
    </div>
    <div className="mt-3 flex h-9 items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white">
      Enviar
    </div>
    <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <Globe className="size-3.5" />
      Cada envío crea un contacto con su historial.
    </p>
  </div>
);

const MockupAutomatizacion = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-neutral-800">Mis reglas</p>
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        3 activas
      </span>
    </div>
    <div className="mt-3 space-y-2.5">
      {[
        {
          cuando: "Cuando se crea un contacto",
          entonces: "crear tarea «Llamar en 3 días» al responsable",
        },
        {
          cuando: "Cuando una oportunidad pasa a «En negociación»",
          entonces: "asignar a Elena Vidal",
        },
        {
          cuando: "Cuando se crea una oportunidad",
          entonces: "crear tarea «Enviar propuesta» en 1 día",
        },
      ].map((regla) => (
        <div
          key={regla.cuando}
          className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3"
        >
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 shrink-0 text-brand-600" />
            <p className="text-xs font-medium text-neutral-700">{regla.cuando}</p>
          </div>
          <p className="mt-1 text-xs text-neutral-500">{regla.entonces}</p>
        </div>
      ))}
    </div>
  </div>
);

const MockupInformes = () => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2">
      <TrendingUp className="size-4 text-brand-600" />
      <p className="text-sm font-semibold text-neutral-800">Informes del trimestre</p>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {[
        { etiqueta: "Oportunidades", valor: "42" },
        { etiqueta: "Ganadas", valor: "18" },
        { etiqueta: "Conversión", valor: "43 %" },
      ].map((kpi) => (
        <div key={kpi.etiqueta} className="rounded-xl bg-neutral-50 p-3 text-center ring-1 ring-neutral-200/60">
          <p className="text-lg font-bold tabular-nums text-neutral-900">{kpi.valor}</p>
          <p className="text-[11px] text-neutral-500">{kpi.etiqueta}</p>
        </div>
      ))}
    </div>
    <div className="mt-4 flex h-28 items-end gap-2">
      {[35, 55, 42, 70, 58, 88, 66, 95].map((alto, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-brand-200" style={{ height: `${alto}%` }} />
      ))}
    </div>
    <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
      <span>Ene</span>
      <span>Feb</span>
      <span>Mar</span>
      <span>Abr</span>
      <span>May</span>
      <span>Jun</span>
      <span>Jul</span>
      <span>Ago</span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

const Hero = () => (
  <section id="top" className="relative overflow-hidden">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-24">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Sparkles className="size-3.5" />
          Vinqulia · Parte del ecosistema Kontrolia
        </span>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
          Tu equipo comercial necesita un sistema.{" "}
          <span className="text-brand-600">No otro montón de herramientas.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
          Vinqulia centraliza clientes, oportunidades, seguimiento y
          comunicación en un CRM que se adapta a la forma en que trabaja tu
          empresa. Úsalo como servicio, instálalo en tu propia infraestructura
          o llévalo más lejos con automatización e IA de Kontrolia.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <CtaDemo />
          <CtaExplorar />
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-emerald-600" /> Se adapta a tu
            proceso, no al revés
          </span>
          <span className="flex items-center gap-1.5">
            <Server className="size-4 text-emerald-600" /> Instalable en tu
            propia infraestructura
          </span>
          <span className="flex items-center gap-1.5">
            <Rocket className="size-4 text-emerald-600" /> Crece contigo dentro
            del ecosistema Kontrolia
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-100 via-brand-50 to-transparent blur-2xl"
        />
        <MarcoDelNavegador>
          <div className="flex">
            <div className="hidden w-44 shrink-0 flex-col gap-1 bg-neutral-900 p-3 sm:flex">
              <div className="mb-3 flex items-center gap-1.5 px-1.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-brand-600">
                  <svg width="11" height="11" viewBox="0 0 100 100" fill="none" aria-hidden>
                    <g fill="white">
                      <rect x="16" y="14" width="16" height="72" rx="2" />
                      <path d="M30.18 44.13 L76.18 14.13 L83.82 25.87 L37.82 55.87 Z" />
                      <path d="M37.82 44.13 L83.82 74.13 L76.18 85.87 L30.18 55.87 Z" />
                    </g>
                  </svg>
                </span>
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
            <div className="min-w-0 flex-1">
              <MockupKanban />
            </div>
          </div>
        </MarcoDelNavegador>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Problemas                                                           */
/* ------------------------------------------------------------------ */

const PROBLEMAS = [
  {
    titulo: "Cada vendedor tiene su propio Excel",
    texto:
      "La información de ventas vive en archivos que nadie mantiene, y cada quien maneja su propia versión.",
  },
  {
    titulo: "Los prospectos llegan por WhatsApp y nadie sabe quién los atiende",
    texto:
      "Las conversaciones y los acuerdos se quedan en el teléfono de quien contestó el mensaje.",
  },
  {
    titulo: "Los seguimientos dependen de que alguien se acuerde",
    texto:
      "Sin tareas ni avisos, las oportunidades se enfrían en silencio y nadie se entera.",
  },
  {
    titulo: "La información del cliente está repartida en varias herramientas",
    texto:
      "Correo, WhatsApp, Excel, ERP… cada sistema guarda un pedazo del historial.",
  },
  {
    titulo: "El director comercial no tiene visibilidad real del pipeline",
    texto:
      "Preguntar «cómo vamos» significa pedirle a cada uno que actualice su hoja.",
  },
  {
    titulo: "El CRM actual no se adapta a cómo trabajan",
    texto:
      "O es demasiado complejo, o demasiado rígido, o demasiado caro para lo que aporta.",
  },
];

const Problemas = () => (
  <section id="problemas" className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="El problema"
        titulo="¿Tu operación comercial se parece a esto?"
        subtitulo="Si reconoces más de una de estas situaciones, no es falta de esfuerzo: es falta de un sistema."
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEMAS.map((problema) => (
          <div
            key={problema.titulo}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <AlertTriangle className="size-5 text-amber-500" />
            <p className="mt-3 text-sm font-semibold text-neutral-900">
              {problema.titulo}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              {problema.texto}
            </p>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-brand-600 px-6 py-5 text-center shadow-lg shadow-brand-600/25">
        <p className="text-base font-semibold text-white">
          Vinqulia convierte ese caos en un proceso comercial centralizado y
          medible.
        </p>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Resultados                                                          */
/* ------------------------------------------------------------------ */

const RESULTADOS: {
  icono: React.ElementType;
  titulo: string;
  texto: string;
}[] = [
  {
    icono: Handshake,
    titulo: "Ver qué oportunidades están abiertas y cuánto valen",
    texto: "El pipeline completo, siempre actualizado y en un solo tablero.",
  },
  {
    icono: CheckSquare,
    titulo: "Saber qué debe hacer cada vendedor hoy",
    texto: "Tareas con responsable y vencimiento: el seguimiento no depende de la memoria.",
  },
  {
    icono: Contact,
    titulo: "Centralizar clientes, empresas y contactos",
    texto: "Una sola base, con historial completo y sin duplicados.",
  },
  {
    icono: Clock,
    titulo: "Dar seguimiento sin depender de nadie",
    texto: "Automatizaciones que crean tareas y avisos en el momento justo.",
  },
  {
    icono: AlertTriangle,
    titulo: "Detectar oportunidades estancadas",
    texto: "Ver dónde se atasca el pipeline antes de que se enfríe una venta.",
  },
  {
    icono: MessageCircle,
    titulo: "Integrar WhatsApp, correo y formularios",
    texto: "Cada conversación queda en la ficha, sin copiar y pegar.",
  },
  {
    icono: Zap,
    titulo: "Automatizar el trabajo repetitivo",
    texto: "Reglas «cuando pase X, haz Y» que aplican solas, entre por donde entre el dato.",
  },
  {
    icono: BarChart3,
    titulo: "Medir el pipeline y la conversión",
    texto: "Informes de cierre, vendedores y motivos de pérdida, sin hojas aparte.",
  },
];

const Resultados = () => (
  <section id="solucion" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="El resultado"
        titulo="Con Vinqulia puedes…"
        subtitulo="Cada función existe para sostener uno de estos resultados. Primero el resultado, después el cómo."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RESULTADOS.map((resultado) => (
          <div
            key={resultado.titulo}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <resultado.icono className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">
              {resultado.titulo}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              {resultado.texto}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Cómo funciona                                                       */
/* ------------------------------------------------------------------ */

const ComoFunciona = () => (
  <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-5 sm:px-8">
      {/* Visibilidad */}
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Visibilidad</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            Un tablero que manda: cada oportunidad, cada tarea, en su lugar
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            Arrastras oportunidades entre etapas y el resto del equipo ve lo
            mismo que tú: qué hay abierto, cuánto vale y qué hay que hacer.
            El vendedor tiene su plan; la dirección tiene el pipeline.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Arrastra y suelta entre etapas, con historial de cada cambio.",
              "Varios embudos: ventas, proyectos, recurrencia… cada uno con sus fases.",
              "Importes en tu moneda y motivos de pérdida para aprender de cada cierre.",
              "Tareas y notas dentro de la misma tarjeta, sin cambiar de pantalla.",
            ].map((punto) => (
              <li key={punto} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
        </div>
        <MarcoDelNavegador>
          <MockupKanban />
        </MarcoDelNavegador>
      </div>

      {/* Comunicación */}
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
          <MockupWhatsApp />
          <MockupCorreo />
          <div className="sm:col-span-2">
            <MockupFormulario />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Eyebrow>Comunicación</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            WhatsApp, correo y formularios, dentro de la ficha
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            No hace falta salir del CRM para responder. Envías un WhatsApp o un
            correo real al contacto y la conversación queda registrada con su
            tipo y su hora. Tus formularios de captura crean contactos solos.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "WhatsApp real, con constancia automática en el historial.",
              "Correo con Reply-To inteligente: la respuesta se archiva sola en la misma ficha.",
              "Formularios públicos como enlace o iframe para tu web, con anti-bots.",
              "El correo entrante (CC a tu buzón Vinqulia) también crea o enriquece la ficha.",
            ].map((punto) => (
              <li key={punto} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Seguimiento y medición */}
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Seguimiento y medición</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            Reglas que trabajan solas y números que no mienten
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            Defines reglas en lenguaje llano —«cuando se cree una oportunidad,
            crea una tarea de propuesta en un día»— y Vinqulia las aplica en la
            base de datos, entre por donde entre el dato. Los informes te dicen
            dónde está el dinero y dónde se pierde.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Disparadores: contacto creado, oportunidad creada, etapa cambiada.",
              "Acciones: crear tareas con vencimiento o asignar responsable.",
              "Informes de conversión, cierre por vendedor y motivos de pérdida.",
              "Vistas guardadas y compartidas para que todo el equipo filtre igual.",
            ].map((punto) => (
              <li key={punto} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MockupAutomatizacion />
          <MockupInformes />
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Casos de uso                                                         */
/* ------------------------------------------------------------------ */

const CASOS: {
  icono: React.ElementType;
  titulo: string;
  texto: string;
  cta: string;
}[] = [
  {
    icono: FileText,
    titulo: "Vendes con Excel",
    texto:
      "Convierte hojas de cálculo en un proceso comercial: importa tu base y deja de vivir de archivos sueltos.",
    cta: "Ver cómo funciona",
  },
  {
    icono: Building2,
    titulo: "Ya usas otro CRM",
    texto:
      "Cambia a un CRM que se adapta a tu operación, sin empezar de cero: migramos tus datos y tu configuración.",
    cta: "Quiero migrar",
  },
  {
    icono: MessageCircle,
    titulo: "Vendes por WhatsApp",
    texto:
      "Centraliza las conversaciones y automatiza el seguimiento: cada mensaje queda en la ficha del cliente.",
    cta: "Quiero una demo",
  },
  {
    icono: Settings2,
    titulo: "Necesitas personalización",
    texto:
      "Adapta Vinqulia a tus procesos: campos, etapas, embudos, moneda y marca, sin tocar código.",
    cta: "Quiero personalizarlo",
  },
  {
    icono: Server,
    titulo: "Tienes infraestructura propia",
    texto:
      "Instala Vinqulia donde tu empresa lo necesita y mantén el control sobre dónde vive tu información.",
    cta: "Quiero instalarlo",
  },
  {
    icono: Bot,
    titulo: "Quieres automatización e IA",
    texto:
      "Añade procesos personalizados, integraciones y agentes inteligentes con el equipo de Kontrolia.",
    cta: "Quiero más",
  },
];

const CasosDeUso = () => (
  <section id="casos" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Casos de uso"
        titulo="¿Cuál es tu punto de partida?"
        subtitulo="Da igual de dónde vengas: Excel, WhatsApp, otro CRM o nada. Hay una forma de empezar."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CASOS.map((caso) => (
          <div
            key={caso.titulo}
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <caso.icono className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">
              {caso.titulo}
            </h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-600">
              {caso.texto}
            </p>
            <a
              href="#demo"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
            >
              {caso.cta}
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Tres niveles de solución                                            */
/* ------------------------------------------------------------------ */

const NIVELES: {
  icono: React.ElementType;
  nombre: string;
  descripcion: string;
  puntos: string[];
  destacado?: boolean;
}[] = [
  {
    icono: Layers,
    nombre: "Vinqulia",
    descripcion:
      "El sistema completo, listo para que tu equipo lo configure y lo ponga a trabajar.",
    puntos: [
      "Contactos, empresas, oportunidades y tareas",
      "Pipeline Kanban y varios embudos",
      "WhatsApp, correo y formularios",
      "Automatizaciones e informes",
      "API y webhooks",
    ],
  },
  {
    icono: Rocket,
    nombre: "Vinqulia + Implementación",
    descripcion:
      "Kontrolia configura el sistema, migra tu información y lo deja funcionando para tu equipo.",
    puntos: [
      "Configuración del pipeline, campos y moneda",
      "Migración de contactos, empresas y oportunidades",
      "Usuarios, roles y permisos",
      "Capacitación y puesta en marcha",
    ],
    destacado: true,
  },
  {
    icono: Bot,
    nombre: "Vinqulia + Automatización e IA",
    descripcion:
      "Cuando quieras ir más allá del CRM: procesos a medida e integraciones con el equipo de Kontrolia.",
    puntos: [
      "Automatizaciones personalizadas",
      "Integración con tus sistemas",
      "Agentes y seguimiento automático",
      "Desarrollo a medida de Kontrolia",
    ],
  },
];

const Niveles = () => (
  <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Cómo adquirirlo"
        titulo="Tres formas de empezar, una sola plataforma"
        subtitulo="No tienes que comprar todo de golpe: empieza con lo que necesitas hoy y crece después sin cambiar de proveedor."
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
        {NIVELES.map((nivel) => (
          <div
            key={nivel.nombre}
            className={
              "flex flex-col rounded-2xl border bg-white p-6 shadow-sm " +
              (nivel.destacado
                ? "border-brand-300 ring-2 ring-brand-200"
                : "border-neutral-200")
            }
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
              <nivel.icono className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-neutral-900">
              {nivel.nombre}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {nivel.descripcion}
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {nivel.puntos.map((punto) => (
                <li key={punto} className="flex items-start gap-2 text-sm text-neutral-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {punto}
                </li>
              ))}
            </ul>
            <a
              href="#demo"
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              {nivel.nombre === "Vinqulia"
                ? "Quiero configurarlo"
                : nivel.nombre === "Vinqulia + Implementación"
                  ? "Quiero implementación"
                  : "Quiero automatización e IA"}
              <ArrowRight className="size-4" />
            </a>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-neutral-500">
        Los precios se manejan en pesos mexicanos (MXN) y se definen según el
        tamaño del equipo y el alcance del proyecto. Cuéntanos tu caso en la
        demo y te enviamos una propuesta.
      </p>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Migración                                                           */
/* ------------------------------------------------------------------ */

const Migracion = () => (
  <section id="migracion" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Migración</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            ¿Ya utilizas otro CRM? No tienes que empezar de cero.
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            Cambiar de CRM da miedo por todo lo que hay que mover: contactos,
            empresas, oportunidades, configuraciones. Vinqulia te acompaña en
            la migración para que no pierdas nada por el camino — y detecta
            duplicados mientras importa.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Migración de contactos, empresas y oportunidades.",
              "Importación de datos desde CSV o JSON.",
              "Configuración del pipeline y los campos según tu operación.",
              "Puesta en marcha con el equipo de Kontrolia si lo necesitas.",
            ].map((punto) => (
              <li key={punto} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/?interes=migracion#demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
            >
              Quiero migrar a Vinqulia
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <Import className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                Importación de tu base
              </p>
              <p className="text-xs text-neutral-500">
                CSV o JSON · duplicados detectados
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { nombre: "Contactos", cuenta: "1.240" },
              { nombre: "Empresas", cuenta: "186" },
              { nombre: "Oportunidades", cuenta: "74" },
            ].map((fila) => (
              <div key={fila.nombre} className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2">
                <FileText className="size-4 text-neutral-400" />
                <span className="flex-1 text-sm text-neutral-700">{fila.nombre}</span>
                <span className="text-sm font-semibold tabular-nums text-neutral-900">{fila.cuenta}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  Listo
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            Nada de empezar en blanco: tu historial llega contigo.
          </p>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Kontrolia como expansión                                            */
/* ------------------------------------------------------------------ */

const KONTROLIA_PUNTOS = [
  {
    icono: Workflow,
    titulo: "Automatización de procesos",
    texto: "Reglas y flujos a medida de tu operación.",
  },
  {
    icono: Plug,
    titulo: "Integraciones a medida",
    texto: "Conexión con tus sistemas actuales y futuros.",
  },
  {
    icono: Bot,
    titulo: "Agentes e IA",
    texto: "Asistentes y seguimiento automático de tu proceso comercial.",
  },
  {
    icono: Target,
    titulo: "Desarrollo de Kontrolia",
    texto: "Un equipo que construye lo que tu empresa necesite después.",
  },
];

const Kontrolia = () => (
  <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Ecosistema Kontrolia"
        titulo="Vinqulia resuelve tu operación comercial. Kontrolia puede llevarla más lejos."
        subtitulo="Cuando tu empresa crezca, no tendrás que cambiar de proveedor: evolucionas dentro del mismo ecosistema."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KONTROLIA_PUNTOS.map((punto) => (
          <div key={punto.titulo} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <punto.icono className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">{punto.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{punto.texto}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-brand-200 bg-brand-50 px-6 py-5 text-center">
        <p className="text-sm leading-relaxed text-brand-900">
          Hoy necesitas ordenar tus ventas. Mañana puede que quieras automatizar
          procesos, integrar sistemas o sumar agentes inteligentes.{" "}
          <span className="font-semibold">
            Tu equipo crece, tu sistema también.
          </span>
        </p>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Integraciones                                                        */
/* ------------------------------------------------------------------ */

const INTEGRACIONES: {
  icono: React.ElementType;
  nombre: string;
  texto: string;
}[] = [
  {
    icono: MessageCircle,
    nombre: "Twilio WhatsApp",
    texto: "Mensajes de WhatsApp reales desde la ficha del contacto.",
  },
  {
    icono: Mail,
    nombre: "Postmark",
    texto: "Correo saliente fiable y captura del correo entrante como nota.",
  },
  {
    icono: Globe,
    nombre: "Formularios web",
    texto: "Captura de leads desde tu web con enlace o iframe.",
  },
  {
    icono: KeyRound,
    nombre: "KontrolIA Auth",
    texto: "Usuarios, roles y SSO con Google, Azure, Keycloak o Auth0.",
  },
  {
    icono: Webhook,
    nombre: "API y webhooks",
    texto: "API REST completa y webhooks firmados para conectar tus sistemas.",
  },
  {
    icono: Database,
    nombre: "Supabase",
    texto: "PostgreSQL gestionado: el motor de datos de la aplicación.",
  },
  {
    icono: Import,
    nombre: "Importación",
    texto: "Trae tu base desde CSV o JSON sin perder un campo.",
  },
  {
    icono: Smartphone,
    nombre: "Móvil",
    texto: "Interfaz táctil para gestionar ventas desde el teléfono.",
  },
];

const Integraciones = () => (
  <section id="integraciones" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Integraciones"
        titulo="Se conecta con las herramientas que ya usas… y con las que vengan"
        subtitulo="Vinqulia no te pide abandonar tu infraestructura: se apoya en ella y se integra con ella."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INTEGRACIONES.map((integracion) => (
          <div
            key={integracion.nombre}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <integracion.icono className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">
              {integracion.nombre}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              {integracion.texto}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Infraestructura y control de datos                                  */
/* ------------------------------------------------------------------ */

const Infraestructura = () => (
  <section id="infraestructura" className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Infraestructura y datos</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            Tu operación y tus datos, bajo el entorno que tu empresa necesita
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            No todas las empresas quieren gestionar sus ventas igual. Vinqulia
            también se adapta en dónde vive: como servicio gestionado o
            instalado en tu propia infraestructura, con control sobre dónde se
            aloja la información.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Despliegue en infraestructura propia, si tu política lo requiere.",
              "Control sobre el alojamiento de los datos de tu operación.",
              "Integración con tus sistemas vía API y webhooks.",
              "Arquitectura preparada para integrar y automatizar procesos.",
            ].map((punto) => (
              <li key={punto} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <a
              href="/?interes=instalacion#demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
            >
              Quiero instalarlo en mi infraestructura
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <Lock className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                Control sobre tus datos
              </p>
              <p className="text-xs text-neutral-500">
                Decide dónde vive tu información
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              {
                titulo: "Servicio gestionado",
                texto: "Kontrolia opera y mantiene la plataforma por ti.",
              },
              {
                titulo: "Infraestructura propia",
                texto: "Instalación en tus servidores, bajo tu control.",
              },
              {
                titulo: "Integraciones",
                texto: "API y webhooks para conectar tus sistemas existentes.",
              },
            ].map((opcion) => (
              <div key={opcion.titulo} className="rounded-lg border border-neutral-200 p-3">
                <p className="text-sm font-semibold text-neutral-800">{opcion.titulo}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{opcion.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Demo                                                                 */
/* ------------------------------------------------------------------ */

const Demo = () => (
  <section id="demo" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24">
          <Eyebrow>Demo personalizada</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Mira cómo funcionaría Vinqulia en tu empresa
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600">
            Cuéntanos cómo trabaja actualmente tu equipo y te mostramos cómo
            podrías llevar ese proceso a Vinqulia: tu pipeline, tus etapas,
            tus canales.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Una demo pensada para tu operación, no una visita genérica.",
              "Respondemos las dudas de migración y de integración.",
              "Sin compromiso: sal de la llamada con un plan claro.",
            ].map((punto) => (
              <li key={punto} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3" />
                </span>
                {punto}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
            <ShieldCheck className="size-4 text-emerald-600" />
            Solo te contacta el equipo comercial de Kontrolia. Nada de spam.
          </div>
        </div>
        <div>
          <FormularioDemo />
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    p: "¿Puedo instalar Vinqulia en mis servidores?",
    r: "Sí. La aplicación puede desplegarse en infraestructura propia; lo coordinamos contigo según tu entorno y tus políticas. En el formulario de demo puedes indicar que prefieres instalación propia.",
  },
  {
    p: "¿Puedo migrar desde otro CRM?",
    r: "Sí. Importamos contactos, empresas y oportunidades, y configuramos el pipeline para que tu equipo no empiece de cero. Con la modalidad de implementación, Kontrolia se encarga de la migración completa.",
  },
  {
    p: "¿Puedo importar mis datos?",
    r: "Sí, desde CSV o JSON. Durante la importación se detectan posibles duplicados para que los fusiones antes de duplicar la base.",
  },
  {
    p: "¿Puedo utilizarlo con WhatsApp?",
    r: "Sí. Vinqulia se integra con WhatsApp (vía Twilio) para enviar mensajes reales desde la ficha del contacto y registrar cada conversación en su historial.",
  },
  {
    p: "¿Puedo integrarlo con otros sistemas?",
    r: "Sí. Cuenta con API REST completa y webhooks firmados. Si necesitas una integración a medida con tu ERP, facturación u otro sistema, el equipo de Kontrolia puede construirla.",
  },
  {
    p: "¿Puedo personalizarlo?",
    r: "Sí. Campos personalizados, etapas y embudos, moneda, sectores y hasta la marca: la configuración se ajusta desde la propia aplicación, sin tocar código.",
  },
  {
    p: "¿Puedo contratar la implementación?",
    r: "Sí. En la modalidad «Vinqulia + Implementación», Kontrolia configura el sistema, migra tu información, da de alta usuarios y capacita a tu equipo.",
  },
  {
    p: "¿Puedo agregar automatización e IA?",
    r: "Sí. Las automatizaciones nativas cubren el seguimiento habitual. Cuando quieras procesos a medida, agentes o IA, se suman como expansión del ecosistema Kontrolia.",
  },
  {
    p: "¿Qué pasa si mi empresa crece?",
    r: "El sistema escala contigo: más usuarios, permisos, SSO y multi-organización. Y cuando necesites más que un CRM, evolucionas dentro del ecosistema Kontrolia sin cambiar de proveedor.",
  },
  {
    p: "¿Quién me ayuda durante la implementación?",
    r: "El equipo de Kontrolia acompaña la puesta en marcha en la modalidad de implementación guiada, incluida la capacitación de tus vendedores.",
  },
  {
    p: "¿Dónde se pueden alojar mis datos?",
    r: "Tú eliges: servicio gestionado por Kontrolia o instalación en tu propia infraestructura. La decisión se toma según la política de tu empresa.",
  },
];

const FAQ = () => (
  <section id="faq" className="py-16 lg:py-24">
    <div className="mx-auto max-w-3xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Preguntas frecuentes"
        titulo="Las dudas que resuelven antes de decidir"
        subtitulo=""
      />
      <div className="mt-10 space-y-3">
        {FAQS.map((faq) => (
          <details
            key={faq.p}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm open:shadow-md"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
              {faq.p}
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-transform group-open:rotate-45">
                <Plus className="size-3.5" />
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{faq.r}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* CTA final                                                           */
/* ------------------------------------------------------------------ */

const CtaFinal = () => (
  <section className="px-5 pb-20 sm:px-8">
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-16 text-center shadow-2xl shadow-brand-900/30 sm:px-12 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-16 size-56 rounded-full bg-white/5 blur-2xl"
      />
      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-100">
          Siguiente paso
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          ¿Quieres saber cómo funcionaría Vinqulia en tu empresa?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-brand-50/90">
          Cuéntanos cómo gestionas actualmente tus ventas y te mostramos cómo
          podrías centralizar, automatizar y mejorar tu operación comercial.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5"
          >
            Quiero una demo personalizada
            <ArrowRight className="size-4" />
          </a>
          <a
            href="#solucion"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Explorar Vinqulia
          </a>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

const Footer = () => (
  <footer className="border-t border-neutral-200/70 bg-white/60">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row sm:px-8">
      <Logo small />
      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-600">
        {NAV.map((enlace) => (
          <a key={enlace.href} href={enlace.href} className="transition-colors hover:text-brand-700">
            {enlace.label}
          </a>
        ))}
      </nav>
      <p className="text-sm text-neutral-400">
        © {new Date().getFullYear()} Vinqulia · Parte de Kontrolia
      </p>
    </div>
    <div className="border-t border-neutral-100 px-5 py-5 sm:px-8">
      <p className="mx-auto max-w-7xl text-center text-xs leading-relaxed text-neutral-400">
        Buscas: CRM con WhatsApp · CRM instalable en servidores propios · CRM
        personalizable para tu empresa · CRM para pymes y equipos comerciales ·
        Alternativa a HubSpot, Pipedrive o Zoho CRM.
      </p>
    </div>
  </footer>
);

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function Pagina() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problemas />
        <Resultados />
        <ComoFunciona />
        <CasosDeUso />
        <Niveles />
        <Migracion />
        <Kontrolia />
        <Integraciones />
        <Infraestructura />
        <Demo />
        <FAQ />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
