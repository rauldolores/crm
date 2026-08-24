import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckSquare,
  Contact,
  Database,
  FileText,
  Globe,
  Handshake,
  Import,
  KeyRound,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Plug,
  Plus,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Webhook,
  Zap,
} from "lucide-react";

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
/* Cabecera                                                            */
/* ------------------------------------------------------------------ */

const NAV = [
  { href: "#funciones", label: "Funciones" },
  { href: "#producto", label: "Producto" },
  { href: "#integraciones", label: "Integraciones" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "FAQ" },
];

const Navbar = () => (
  <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
      <a href="#top" className="no-underline">
        <Logo />
      </a>
      <nav className="hidden items-center gap-1 md:flex">
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
        <a
          href="#cta"
          className="hidden rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 sm:block"
        >
          Iniciar sesión
        </a>
        <a
          href="#cta"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-all hover:bg-brand-700"
        >
          Probar la demo
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  </header>
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
        ▲ 128.400 € en juego
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
              monto: "24.500 €",
              iniciales: "AG",
              color: "#e2766a",
              etiqueta: "Nueva",
            },
            {
              nombre: "Luis Pérez",
              empresa: "Textiles del Norte",
              monto: "9.800 €",
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
              monto: "31.200 €",
              iniciales: "MR",
              color: "#3f8fd0",
              etiqueta: "Correo",
            },
            {
              nombre: "Carlos Soto",
              empresa: "Andina Foods",
              monto: "12.000 €",
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
              monto: "46.900 €",
              iniciales: "EV",
              color: "#b23b2e",
              etiqueta: "Caliente",
            },
            {
              nombre: "Pedro Linares",
              empresa: "Logística RM",
              monto: "18.600 €",
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
              monto: "27.300 €",
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
      Registrado como nota en la ficha de Ana automáticamente.
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
      un plan de precios por usuario…
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
      Enlace o iframe listo para pegar en tu web. Cada envío crea un contacto.
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
/* Secciones                                                           */
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

const Hero = () => (
  <section id="top" className="relative overflow-hidden">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-24">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Sparkles className="size-3.5" />
          CRM para equipos comerciales
        </span>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
          Todas tus relaciones comerciales,{" "}
          <span className="text-brand-600">en un solo lugar</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
          Vinqulia reúne contactos, empresas, oportunidades y tareas en un
          tablero Kanban que tu equipo entiende desde el primer día. Captura
          leads desde tu web, responde por WhatsApp y correo, y automatiza el
          seguimiento — sin hojas de cálculo ni pestañas perdidas.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
          >
            Probar la demo gratis
            <ArrowRight className="size-4" />
          </a>
          <a
            href="#funciones"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Ver funciones
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-emerald-600" /> Listo en minutos
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-emerald-600" /> Open source
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-emerald-600" /> Tus datos, tu control
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

const Problema = () => (
  <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="El problema"
        titulo="Hojas de cálculo, correos sueltos y «¿de quién era este cliente?»"
        subtitulo="Cada equipo comercial acaba con la misma acumulación: contactos en Excel, acuerdos por WhatsApp, seguimientos olvidados. Vinqulia ordena ese caos sin ponerse en medio."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {[
          {
            titulo: "Contactos dispersos",
            texto:
              "Mails, tarjetas, ferias, formularios… Todo termina en listas distintas que nadie mantiene.",
          },
          {
            titulo: "Seguimientos que se escapan",
            texto:
              "«Te llamo la semana que viene» y nunca llega. Sin tareas ni recordatorios, las oportunidades se enfrían.",
          },
          {
            titulo: "El equipo no reporta",
            texto:
              "Sin un pipeline visible, cada vendedor guarda su propia versión de la verdad en la cabeza.",
          },
        ].map((tarjeta) => (
          <div key={tarjeta.titulo} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-neutral-800">{tarjeta.titulo}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{tarjeta.texto}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FUNCIONES: {
  icono: React.ElementType;
  titulo: string;
  texto: string;
}[] = [
  {
    icono: Contact,
    titulo: "Contactos y empresas",
    texto:
      "Fichas completas con varios correos y teléfonos, etiquetas, campos personalizados y detección de duplicados antes de crearlos.",
  },
  {
    icono: Handshake,
    titulo: "Pipeline Kanban",
    texto:
      "Arrastra oportunidades entre etapas, define varios embudos con sus propias fases y sigue el dinero en juego con tu moneda.",
  },
  {
    icono: CheckSquare,
    titulo: "Tareas y recordatorios",
    texto:
      "Crea tareas con vencimiento, tipos y responsable. Nada de «se me pasó»: el seguimiento queda visible para todo el equipo.",
  },
  {
    icono: FileText,
    titulo: "Notas y actividad",
    texto:
      "Notas en markdown con estado (frío, templado, caliente), adjuntos y un historial que reconstruye cada interacción.",
  },
  {
    icono: Globe,
    titulo: "Captura de leads",
    texto:
      "Formularios públicos con enlace o iframe para tu web. Cada envío crea un contacto nuevo, con anti-spam incluido.",
  },
  {
    icono: MessageCircle,
    titulo: "WhatsApp y correo",
    texto:
      "Envía mensajes reales desde la ficha del contacto y deja constancia automática de la conversación en su historial.",
  },
  {
    icono: Zap,
    titulo: "Automatizaciones",
    texto:
      "«Cuando pase X, haz Y»: crea tareas, asigna responsables y deja que las reglas trabajen aunque nadie esté mirando.",
  },
  {
    icono: BarChart3,
    titulo: "Informes",
    texto:
      "Conversión, cierre por vendedor, motivos de pérdida y embudo por etapa. Las decisiones se toman con números, no con corazonadas.",
  },
];

const Funciones = () => (
  <section id="funciones" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Funciones"
        titulo="Todo lo que un equipo comercial necesita, sin plugins de quince proveedores"
        subtitulo="Vinqulia nace completo: la gestión de contactos, el pipeline, la comunicación y el análisis viven en la misma aplicación."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FUNCIONES.map((funcion) => (
          <div
            key={funcion.titulo}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <funcion.icono className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-neutral-900">
              {funcion.titulo}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              {funcion.texto}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Producto = () => (
  <section id="producto" className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-5 sm:px-8">
      {/* Pipeline */}
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Vende mejor</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            Un tablero que cuenta la verdad de tu negocio
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            Cada oportunidad vive en una tarjeta que se arrastra de etapa en
            etapa. Los responsables ven el mismo tablero que la dirección: qué
            hay abierto, cuánto vale y dónde se atasca.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Arrastra y suelta entre etapas, con historial de cada cambio.",
              "Varios embudos: ventas, proyectos, recurrencia… cada uno con sus fases.",
              "Importes en tu moneda, motivos de pérdida y oportunidades archivadas.",
              "Seguimiento del contacto y sus tareas dentro de la misma tarjeta.",
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

      {/* Comunicaciones */}
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
          <MockupWhatsApp />
          <MockupCorreo />
          <div className="sm:col-span-2">
            <MockupFormulario />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Eyebrow>Habla con tus clientes</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            WhatsApp, correo y formularios, dentro de la ficha
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            No hace falta salir del CRM para responder. Envía un WhatsApp o un
            correo real al contacto y la conversación queda registrada como
            nota, con su tipo y su hora.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "WhatsApp real vía Twilio, con constancia automática en el historial.",
              "Correo saliente con Reply-To inteligente: la respuesta se archiva sola en la misma ficha.",
              "Formularios públicos para tu web, listos como enlace o iframe, con anti-bots.",
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

      {/* Automatización e informes */}
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Trabaja menos, vende más</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            Reglas que trabajan mientras duermes
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            Define reglas en lenguaje llano —«cuando se cree una oportunidad,
            crea una tarea de propuesta en un día»— y Vinqulia las aplica en la
            base de datos, entre por donde entre el dato: la app, la API o una
            importación.
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

const INTEGRACIONES: {
  icono: React.ElementType;
  nombre: string;
  texto: string;
}[] = [
  {
    icono: Database,
    nombre: "Supabase",
    texto: "PostgreSQL, autenticación, almacenamiento y API en una sola plataforma.",
  },
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
    icono: KeyRound,
    nombre: "KontrolIA Auth",
    texto: "Inicio de sesión, usuarios, roles y organización gestionados por tu proveedor.",
  },
  {
    icono: ShieldCheck,
    nombre: "SSO",
    texto: "Entra con Google, Azure, Keycloak o Auth0, sin contraseñas de más.",
  },
  {
    icono: Webhook,
    nombre: "API y webhooks",
    texto: "API REST completa (la misma de la app) y webhooks firmados con HMAC.",
  },
  {
    icono: Plug,
    nombre: "Importación",
    texto: "Trae tu base desde CSV o JSON sin perder un campo.",
  },
  {
    icono: Smartphone,
    nombre: "Móvil",
    texto: "Interfaz táctil pensada para el teléfono, con listas y edición rápida.",
  },
];

const Integraciones = () => (
  <section id="integraciones" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Integraciones"
        titulo="Se conecta con las herramientas que ya usas"
        subtitulo="Vinqulia no te pide abandonar tu infraestructura: se apoya en ella."
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

const Pasos = () => (
  <section className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Cómo empezar"
        titulo="De cero a primer seguimiento en una tarde"
        subtitulo="Sin implementaciones de meses ni consultores. Vinqulia te guía paso a paso."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {[
          {
            paso: "01",
            icono: Settings2,
            titulo: "Configura tu organización",
            texto: "Nombre, logo, moneda, etapas del embudo y campos personalizados según tu industria.",
          },
          {
            paso: "02",
            icono: Import,
            titulo: "Trae tus contactos",
            texto: "Importa tu base en CSV o JSON. Los duplicados se detectan antes de crear nada.",
          },
          {
            paso: "03",
            icono: TrendingUp,
            titulo: "Empieza a vender",
            texto: "Mueve oportunidades en el tablero, conecta WhatsApp y correo, y deja que las reglas sigan solas.",
          },
        ].map((paso) => (
          <div key={paso.paso} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
                <paso.icono className="size-5" />
              </span>
              <span className="text-4xl font-bold tracking-tight text-neutral-100">
                {paso.paso}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-900">{paso.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{paso.texto}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQ = () => (
  <section id="faq" className="py-16 lg:py-24">
    <div className="mx-auto max-w-3xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Preguntas frecuentes"
        titulo="Lo que nos preguntan antes de probarlo"
        subtitulo=""
      />
      <div className="mt-10 space-y-3">
        {[
          {
            p: "¿Es difícil migrar desde Excel u otro CRM?",
            r: "No. Importas tus contactos y empresas desde CSV o JSON, y el propio Vinqulia te avisa de posibles duplicados durante la carga para que fusiones antes de duplicar la base.",
          },
          {
            p: "¿Mis datos están a salvo?",
            r: "La aplicación corre sobre Supabase (PostgreSQL gestionado): cifrado en tránsito y en reposo, copias de seguridad y acceso por roles. Además, al ser open source, puedes desplegarla en tu propia infraestructura si lo prefieres.",
          },
          {
            p: "¿Funciona para un equipo pequeño o solo para grandes empresas?",
            r: "Vinqulia está pensada para pymes y equipos comerciales de 2 a 50 personas: la configuración que necesitas (etapas, campos, moneda) se ajusta desde Ajustes sin tocar código.",
          },
          {
            p: "¿Qué pasa con el acceso de los usuarios?",
            r: "Los inicios de sesión y los permisos se gestionan con KontrolIA Auth e incluyen SSO con Google, Azure, Keycloak o Auth0. El equipo se sincroniza automáticamente con el CRM.",
          },
          {
            p: "¿Puedo conectar mi web para captar leads?",
            r: "Sí: creas un formulario público y lo pegas en tu web como enlace o iframe. Cada envío crea un contacto con su historial, listo para entrar en tu pipeline.",
          },
        ].map((faq) => (
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

const CtaFinal = () => (
  <section id="cta" className="px-5 pb-20 sm:px-8">
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
          Empieza hoy
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Deja de perseguir datos sueltos. Lleva tus ventas a un solo tablero.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-brand-50/90">
          Prueba la demo con datos de ejemplo, explórala sin compromiso y
          convéncete en la primera tarde. Cuando estés listo, migras tu base en
          minutos.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5"
          >
            Probar la demo gratis
            <ArrowRight className="size-4" />
          </a>
          <a
            href="#funciones"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Ver funciones
          </a>
        </div>
      </div>
    </div>
  </section>
);

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
        © {new Date().getFullYear()} Vinqulia · CRM
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
        <Problema />
        <Funciones />
        <Producto />
        <Integraciones />
        <Pasos />
        <FAQ />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
