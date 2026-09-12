import {
  BellRing,
  Bot,
  FileText,
  Handshake,
  LifeBuoy,
  Repeat,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Eyebrow, TituloDeSeccion } from "./comunes";

/**
 * Lo que el CRM hace después de cerrar la venta y lo que hace con IA.
 * Son las funciones más recientes del producto (tickets, módulo Clientes,
 * afiliados, plantillas con IA, asistente por MCP) y no estaban en la
 * landing; van en dos bloques con el mismo lenguaje que el resto.
 */

const POSTVENTA: {
  icono: React.ElementType;
  titulo: string;
  texto: string;
  puntos: string[];
}[] = [
  {
    icono: LifeBuoy,
    titulo: "Tickets de soporte",
    texto:
      "Cada petición o incidencia de un cliente, con estado, categoría y su propio hilo, enlazada a su ficha. Nadie se queda sin respuesta.",
    puntos: [
      "Entran solos desde un formulario en tu web o desde un asistente de IA",
      "En la ficha del cliente se ve cuántos tiene abiertos",
    ],
  },
  {
    icono: Repeat,
    titulo: "Clientes, contratos y renovaciones",
    texto:
      "Qué ha comprado cada cliente, qué tiene contratado y cuándo le vence. Es lo que permite vender lo siguiente y no dejar caer una renovación.",
    puntos: [
      "Contratos con periodicidad, importe y fecha de renovación",
      "Tu facturación o tu tienda registran cada venta por API",
      "Aviso automático N días antes de cada renovación",
    ],
  },
  {
    icono: Handshake,
    titulo: "Afiliados",
    texto:
      "Quien revende tus servicios, con su código de referido, su enlace y lo que ha generado: clientes traídos, ventas ganadas y comisión.",
    puntos: [
      "Se activa desde el catálogo de módulos, sin instalar nada",
      "Cada afiliado puede entrar y ver solo lo suyo",
    ],
  },
];

const IA: {
  icono: React.ElementType;
  titulo: string;
  texto: string;
}[] = [
  {
    icono: Bot,
    titulo: "Habla con tu CRM",
    texto:
      "Conecta Claude u otro asistente por MCP y dile «acabo de reunirme con Marta: quieren empezar en octubre por 900 al mes, apúntalo». Deja la nota, crea la oportunidad y la tarea. Con tus permisos y solo sobre tus datos.",
  },
  {
    icono: Wand2,
    titulo: "Plantillas de correo redactadas por IA",
    texto:
      "Describe el correo en una frase y la IA lo escribe con los datos del contacto ya colocados (nombre, empresa, tus campos propios). Tú lo revisas, lo guardas y lo usan las automatizaciones.",
  },
  {
    icono: BellRing,
    titulo: "Automatizaciones que no se olvidan",
    texto:
      "«Cuando se cree un contacto, envía la bienvenida». «Cuando una oportunidad llegue a Propuesta, crea la tarea de llamar a los dos días». «Treinta días antes de una renovación, avisa». El CRM lo hace, entre por donde entre el dato.",
  },
  {
    icono: FileText,
    titulo: "Correo desde tu propio dominio",
    texto:
      "Cada organización envía con su remitente y su dominio (Resend, Postmark o SendGrid), con un diseño que se ve bien en Gmail y Outlook. Tu clave se guarda cifrada y nunca se vuelve a mostrar.",
  },
];

export const MasAllaDeLaVenta = () => (
  <section id="postventa" className="py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <TituloDeSeccion
        eyebrow="Después de la venta"
        titulo="Un CRM normal termina cuando cierras. Este sigue."
        subtitulo="Soporte, contratos, renovaciones y afiliados viven en el mismo sitio que la venta: la ficha del cliente cuenta la historia completa, antes y después de firmar."
      />
      <div className="aparece-hijos mt-12 grid gap-4 md:grid-cols-3">
        {POSTVENTA.map((bloque) => (
          <div
            key={bloque.titulo}
            className="borde-degradado flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
              <bloque.icono className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-neutral-900">
              {bloque.titulo}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {bloque.texto}
            </p>
            <ul className="mt-4 space-y-1.5">
              {bloque.puntos.map((punto) => (
                <li
                  key={punto}
                  className="flex items-start gap-2 text-sm text-neutral-700"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
                  {punto}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const InteligenciaArtificial = () => (
  <section
    id="ia"
    className="border-y border-neutral-200/70 bg-white/60 py-16 lg:py-24"
  >
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Inteligencia artificial, de serie</Eyebrow>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          El CRM que trabaja mientras tú vendes
        </h2>
        <p className="mt-4 text-base leading-relaxed text-neutral-600">
          No es un chatbot pegado encima: la IA y las automatizaciones están
          dentro del producto, con tu clave y tu proveedor, y hacen el trabajo
          repetitivo que hoy se queda sin hacer.
        </p>
      </div>
      <div className="aparece-hijos mt-12 grid gap-4 sm:grid-cols-2">
        {IA.map((bloque) => (
          <div
            key={bloque.titulo}
            className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <bloque.icono className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                {bloque.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {bloque.texto}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 text-center text-sm text-neutral-500">
        <Sparkles className="size-4 text-brand-600" />
        Tú eliges el proveedor (Claude, OpenAI o DeepSeek); el consumo se paga
        en tu cuenta y la clave nunca sale del servidor.
      </p>
    </div>
  </section>
);
