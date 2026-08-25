"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

/**
 * Formulario de calificación comercial.
 *
 * No es un formulario de registro: su objetivo es calificar al visitante
 * (tamaño de equipo, CRM actual, necesidades) y llevarlo al contacto
 * comercial. Los nombres de los campos son estables y legibles para que el
 * endpoint /api/lead pueda calcular señales de scoring sin cambios.
 *
 * Soporta ?interes=migracion (o implementacion / automatizacion) para que
 * las campañas o los CTAs de sección preseleccionen el interés.
 */

type Estado = "listo" | "enviando" | "hecho" | "error";

const EMPLEADOS = [
  { valor: "1-10", etiqueta: "1 a 10" },
  { valor: "11-50", etiqueta: "11 a 50" },
  { valor: "51-150", etiqueta: "51 a 150" },
  { valor: "151-250", etiqueta: "151 a 250" },
  { valor: "251+", etiqueta: "Más de 250" },
];

const PERSONAS_EN_VENTAS = [
  { valor: "1-3", etiqueta: "1 a 3" },
  { valor: "4-10", etiqueta: "4 a 10" },
  { valor: "11-25", etiqueta: "11 a 25" },
  { valor: "26+", etiqueta: "Más de 25" },
];

const GESTION_ACTUAL = [
  { valor: "excel", etiqueta: "Excel u hojas de cálculo" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
  { valor: "correo", etiqueta: "Correo electrónico" },
  { valor: "crm", etiqueta: "Otro CRM" },
  { valor: "nada", etiqueta: "Nada centralizado" },
  { valor: "otro", etiqueta: "Otro" },
];

const NECESIDADES = [
  { valor: "integracion", etiqueta: "Integración con otros sistemas" },
  { valor: "automatizacion", etiqueta: "Automatización de procesos" },
  { valor: "ia", etiqueta: "IA / agentes inteligentes" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
];

const MODALIDADES = [
  { valor: "gestionado", etiqueta: "Servicio gestionado por Kontrolia" },
  { valor: "propia", etiqueta: "Instalación en nuestra infraestructura" },
  { valor: "indefinido", etiqueta: "Aún no lo sé" },
];

const interesesDesdeUrl = () => {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  return params.get("interes") ?? undefined;
};

export function FormularioDemo() {
  const [estado, setEstado] = useState<Estado>("listo");
  const [mensajeError, setMensajeError] = useState("");
  const [usaCrm, setUsaCrm] = useState("");
  const [interes] = useState(interesesDesdeUrl);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setEstado("enviando");
    setMensajeError("");

    const datos = new FormData(evento.currentTarget);

    const cuerpo = {
      nombre: datos.get("nombre"),
      empresa: datos.get("empresa"),
      email: datos.get("email"),
      telefono: datos.get("telefono"),
      empleados: datos.get("empleados"),
      personas_ventas: datos.get("personas_ventas"),
      gestion_actual: datos.get("gestion_actual"),
      usa_crm: datos.get("usa_crm"),
      crm_cual: datos.get("crm_cual"),
      problema: datos.get("problema"),
      necesidades: datos.getAll("necesidades"),
      modalidad: datos.get("modalidad"),
      interes: interes ?? datos.get("interes"),
      sitio_web: datos.get("sitio_web"),
    };

    try {
      const respuesta = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const resultado = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setMensajeError(
          resultado.message ?? "No se pudo enviar. Inténtalo de nuevo.",
        );
        setEstado("error");
        return;
      }
      setEstado("hecho");
    } catch {
      setMensajeError(
        "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.",
      );
      setEstado("error");
    }
  };

  if (estado === "hecho") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h3 className="mt-4 text-xl font-semibold text-neutral-900">
          ¡Gracias por tu interés!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
          Recibimos tu solicitud. El equipo comercial de Kontrolia te
          contactará para coordinar una demo pensada para tu operación.
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          ¿Prefieres explorar por tu cuenta?{" "}
          <a href="#solucion" className="font-medium text-brand-600 hover:underline">
            Mira cómo funciona Vinqulia
          </a>
        </p>
      </div>
    );
  }

  const estilosCampo =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
  const estilosEtiqueta = "mb-1.5 block text-sm font-medium text-neutral-700";

  return (
    <form
      onSubmit={enviar}
      data-lead-form
      className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-nombre" className={estilosEtiqueta}>
            Nombre *
          </label>
          <input
            id="lead-nombre"
            name="nombre"
            required
            maxLength={120}
            placeholder="Tu nombre"
            className={estilosCampo}
          />
        </div>
        <div>
          <label htmlFor="lead-empresa" className={estilosEtiqueta}>
            Empresa *
          </label>
          <input
            id="lead-empresa"
            name="empresa"
            required
            maxLength={120}
            placeholder="Nombre de tu empresa"
            className={estilosCampo}
          />
        </div>
        <div>
          <label htmlFor="lead-email" className={estilosEtiqueta}>
            Correo electrónico *
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder="tu@empresa.com"
            className={estilosCampo}
          />
        </div>
        <div>
          <label htmlFor="lead-telefono" className={estilosEtiqueta}>
            WhatsApp / teléfono
          </label>
          <input
            id="lead-telefono"
            name="telefono"
            type="tel"
            maxLength={50}
            placeholder="+34 600 000 000"
            className={estilosCampo}
          />
        </div>
        <div>
          <label htmlFor="lead-empleados" className={estilosEtiqueta}>
            Empleados
          </label>
          <select id="lead-empleados" name="empleados" className={estilosCampo}>
            <option value="">Selecciona…</option>
            {EMPLEADOS.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lead-personas" className={estilosEtiqueta}>
            Personas en ventas
          </label>
          <select id="lead-personas" name="personas_ventas" className={estilosCampo}>
            <option value="">Selecciona…</option>
            {PERSONAS_EN_VENTAS.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lead-gestion" className={estilosEtiqueta}>
            ¿Cómo gestionan hoy las ventas?
          </label>
          <select id="lead-gestion" name="gestion_actual" className={estilosCampo}>
            <option value="">Selecciona…</option>
            {GESTION_ACTUAL.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lead-crm" className={estilosEtiqueta}>
            ¿Usan otro CRM?
          </label>
          <select
            id="lead-crm"
            name="usa_crm"
            className={estilosCampo}
            value={usaCrm}
            onChange={(e) => setUsaCrm(e.target.value)}
          >
            <option value="">Selecciona…</option>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
          {usaCrm === "si" && (
            <input
              name="crm_cual"
              maxLength={120}
              placeholder="¿Cuál CRM? (ej. HubSpot, Pipedrive…)"
              className={estilosCampo + " mt-2"}
            />
          )}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="lead-problema" className={estilosEtiqueta}>
          ¿Cuál es el principal problema que quieres resolver?
        </label>
        <textarea
          id="lead-problema"
          name="problema"
          rows={3}
          maxLength={1000}
          placeholder="Por ejemplo: los seguimientos dependen de que nos acordemos y las oportunidades se enfrían."
          className={estilosCampo}
        />
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 block text-sm font-medium text-neutral-700">
          ¿Necesitas integración, automatización o IA?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {NECESIDADES.map((necesidad) => (
            <label
              key={necesidad.valor}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
            >
              <input
                type="checkbox"
                name="necesidades"
                value={necesidad.valor}
                className="size-4 accent-brand-600"
              />
              {necesidad.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 block text-sm font-medium text-neutral-700">
          ¿Cómo prefieres Vinqulia?
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODALIDADES.map((modalidad) => (
            <label
              key={modalidad.valor}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
            >
              <input
                type="radio"
                name="modalidad"
                value={modalidad.valor}
                className="size-4 accent-brand-600"
              />
              {modalidad.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Señuelo anti-bots: invisible para las personas. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="lead-sitio-web">Sitio web</label>
        <input id="lead-sitio-web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {estado === "error" && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {mensajeError}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
      >
        {estado === "enviando" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {estado === "enviando"
          ? "Enviando…"
          : interes === "migracion"
            ? "Quiero migrar a Vinqulia"
            : "Quiero mi demo personalizada"}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Al enviar aceptas que Kontrolia te contacte para coordinar la demo. No
        compartimos tus datos con terceros.
      </p>
    </form>
  );
}
