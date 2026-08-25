"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";

/**
 * Formulario de calificación comercial en DOS pasos.
 *
 * Paso 1: solo 4 campos (nombre, empresa, correo, WhatsApp/teléfono). Al
 *         enviarlo se crea el lead en el CRM (empresa + contacto +
 *         oportunidad). Si el visitante abandona aquí, ya tenemos un lead
 *         básico al que dar seguimiento.
 *
 * Paso 2: el resto de la calificación. Enriquece la MISMA oportunidad: los
 *         datos que no son campos del CRM se guardan en su descripción.
 *
 * El leadId se guarda en sessionStorage para que, si el visitante recarga en
 * el paso 2, no se cree un lead duplicado y pueda continuar donde iba.
 */

type DatosBasicos = {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
};

type Referencia = { leadId: number; companyId: number; contactId: number };

const CLAVE_SESION = "vinqulia_lead_v1";

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
  return (
    new URLSearchParams(window.location.search).get("interes") ?? undefined
  );
};

const leerSesion = (): {
  basicos: DatosBasicos;
  referencia: Referencia;
} | null => {
  if (typeof window === "undefined") return null;
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

const guardarSesion = (datos: {
  basicos: DatosBasicos;
  referencia: Referencia;
}) => {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento disponible: se continúa en memoria.
  }
};

const borrarSesion = () => {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // Sin almacenamiento disponible.
  }
};

const estilosCampo =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
const estilosEtiqueta = "mb-1.5 block text-sm font-medium text-neutral-700";

export function FormularioDemo() {
  const sesionInicial = useMemo(leerSesion, []);

  const [paso, setPaso] = useState<1 | 2>(sesionInicial ? 2 : 1);
  const [basicos, setBasicos] = useState<DatosBasicos>(
    sesionInicial?.basicos ?? {
      nombre: "",
      empresa: "",
      email: "",
      telefono: "",
    },
  );
  const [referencia, setReferencia] = useState<Referencia | null>(
    sesionInicial?.referencia ?? null,
  );

  const [estado1, setEstado1] = useState<"listo" | "enviando" | "error">(
    "listo",
  );
  const [estado2, setEstado2] = useState<
    "listo" | "enviando" | "hecho" | "error"
  >("listo");
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");
  const [usaCrm, setUsaCrm] = useState("");
  const [interes] = useState(interesesDesdeUrl);

  const enviarPaso1 = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setEstado1("enviando");
    setError1("");

    const datos = new FormData(evento.currentTarget);
    const basico: DatosBasicos = {
      nombre: String(datos.get("nombre") ?? ""),
      empresa: String(datos.get("empresa") ?? ""),
      email: String(datos.get("email") ?? ""),
      telefono: String(datos.get("telefono") ?? ""),
    };
    setBasicos(basico);

    try {
      const respuesta = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paso: "1",
          ...basico,
          sitio_web: datos.get("sitio_web"),
        }),
      });
      const resultado = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError1(
          resultado.message ?? "No se pudo enviar. Inténtalo de nuevo.",
        );
        setEstado1("error");
        return;
      }
      const nuevaReferencia: Referencia = {
        leadId: Number(resultado.leadId),
        companyId: Number(resultado.companyId),
        contactId: Number(resultado.contactId),
      };
      setReferencia(nuevaReferencia);
      guardarSesion({ basicos: basico, referencia: nuevaReferencia });
      setPaso(2);
      setEstado1("listo");
    } catch {
      setError1("No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.");
      setEstado1("error");
    }
  };

  const enviarPaso2 = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!referencia) return;
    setEstado2("enviando");
    setError2("");

    const datos = new FormData(evento.currentTarget);

    const cuerpo = {
      paso: "2",
      leadId: referencia.leadId,
      companyId: referencia.companyId,
      ...basicos,
      empleados: datos.get("empleados"),
      personas_ventas: datos.get("personas_ventas"),
      gestion_actual: datos.get("gestion_actual"),
      usa_crm: datos.get("usa_crm"),
      crm_cual: datos.get("crm_cual"),
      problema: datos.get("problema"),
      necesidades: datos.getAll("necesidades"),
      modalidad: datos.get("modalidad"),
      interes: interes ?? datos.get("interes"),
    };

    try {
      const respuesta = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const resultado = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError2(
          resultado.message ?? "No se pudo enviar. Inténtalo de nuevo.",
        );
        setEstado2("error");
        return;
      }
      setEstado2("hecho");
    } catch {
      setError2("No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.");
      setEstado2("error");
    }
  };

  const empezarDeNuevo = () => {
    borrarSesion();
    setReferencia(null);
    setPaso(1);
    setEstado2("listo");
  };

  if (estado2 === "hecho") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h3 className="mt-4 text-xl font-semibold text-neutral-900">
          ¡Gracias por tu interés!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
          Recibimos tu solicitud y ya la tenemos registrada. El equipo
          comercial de Kontrolia te contactará para coordinar una demo pensada
          para tu operación.
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          ¿Prefieres explorar por tu cuenta?{" "}
          <a
            href="#solucion"
            className="font-medium text-brand-600 hover:underline"
          >
            Mira cómo funciona Vinqulia
          </a>
        </p>
      </div>
    );
  }


  if (paso === 1) {
    return (
      <form
        onSubmit={enviarPaso1}
        data-lead-form
        data-paso="1"
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ArrowRight className="size-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              ¿Quieres ver cómo funcionaría Vinqulia en tu empresa?
            </h3>
            <p className="text-xs text-neutral-500">
              Solo 4 datos para empezar. En el siguiente paso afinamos tu caso.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-nombre" className={estilosEtiqueta}>
              Nombre *
            </label>
            <input
              id="lead-nombre"
              name="nombre"
              required
              maxLength={120}
              defaultValue={basicos.nombre}
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
              defaultValue={basicos.empresa}
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
              defaultValue={basicos.email}
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
              defaultValue={basicos.telefono}
              placeholder="+52 55 0000 0000"
              className={estilosCampo}
            />
          </div>
        </div>

        {/* Señuelo anti-bots: invisible para las personas. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="lead-sitio-web">Sitio web</label>
          <input
            id="lead-sitio-web"
            name="sitio_web"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {estado1 === "error" && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error1}
          </p>
        )}

        <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={estado1 === "enviando"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
          >
            {estado1 === "enviando" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {estado1 === "enviando" ? "Guardando…" : "Continuar"}
          </button>
          <p className="text-xs leading-relaxed text-neutral-500">
            Al continuar aceptas que Kontrolia te contacte para coordinar la
            demo. No compartimos tus datos con terceros.
          </p>
        </div>
      </form>
    );
  }


  // Paso 2: enriquecer el lead ya capturado.
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            ¡Datos básicos guardados!{" "}
            <span className="font-normal">
              {basicos.nombre} · {basicos.empresa}
            </span>
          </p>
          <p className="text-xs text-emerald-700">
            Ahora cuéntanos un poco más para preparar tu demo a medida.
          </p>
        </div>
      </div>

      <form
        onSubmit={enviarPaso2}
        data-lead-form
        data-paso="2"
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
            <select
              id="lead-personas"
              name="personas_ventas"
              className={estilosCampo}
            >
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
            <select
              id="lead-gestion"
              name="gestion_actual"
              className={estilosCampo}
            >
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

        {estado2 === "error" && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error2}
          </p>
        )}

        <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={estado2 === "enviando"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
          >
            {estado2 === "enviando" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {estado2 === "enviando"
              ? "Enviando…"
              : interes === "migracion"
                ? "Quiero migrar a Vinqulia"
                : "Enviar solicitud de demo"}
          </button>
          <button
            type="button"
            onClick={empezarDeNuevo}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-600"
          >
            Empezar de nuevo
          </button>
        </div>
      </form>
    </div>
  );
}
