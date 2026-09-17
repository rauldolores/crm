"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  DESCUENTO_2_ANIOS,
  DESCUENTO_3_ANIOS,
  MODALIDADES,
  estimar,
  type Modalidad,
} from "../../content/enterprise";
import { formatearPrecio } from "../../content/planes";

/**
 * Calculadora y formulario de Enterprise, juntos a propósito: la modalidad y
 * el número de usuarios que la persona mueve en la calculadora son los
 * mismos que viajan con su solicitud, así que la propuesta que recibe
 * después parte de la cifra que ya vio en pantalla.
 *
 * El envío va a /api/lead con paso "enterprise": crea empresa, contacto,
 * oportunidad (con la estimación como importe) y una tarea de llamada en el
 * propio Vinqulia de Kontrolia. Este formulario es Vinqulia.
 */

const PRESETS_DE_USUARIOS = [25, 50, 100, 150, 300];

const SISTEMAS_ACTUALES = [
  "Excel u hojas de cálculo",
  "HubSpot",
  "Salesforce",
  "Pipedrive",
  "Zoho",
  "Bitrix24",
  "Un desarrollo propio",
  "Otro",
];

const estilosCampo =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
const estilosEtiqueta = "mb-1.5 block text-sm font-medium text-neutral-700";

export function CotizadorEnterprise() {
  const [modalidad, setModalidad] = useState<Modalidad>("nube");
  const [usuarios, setUsuarios] = useState(50);
  const [estado, setEstado] = useState<"listo" | "enviando" | "hecho" | "error">(
    "listo",
  );
  const [error, setError] = useState("");

  const estimacion = estimar(modalidad, usuarios);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setEstado("enviando");
    setError("");
    const datos = new FormData(evento.currentTarget);
    try {
      const respuesta = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paso: "enterprise",
          nombre: datos.get("nombre"),
          empresa: datos.get("empresa"),
          email: datos.get("email"),
          telefono: datos.get("telefono"),
          usuarios,
          modalidad,
          sistema_actual: datos.get("sistema_actual"),
          comentarios: datos.get("comentarios"),
          sitio_web: datos.get("sitio_web"),
        }),
      });
      const resultado = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(resultado.message ?? "No se pudo enviar. Inténtalo de nuevo.");
        setEstado("error");
        return;
      }
      setEstado("hecho");
    } catch {
      setError("No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.");
      setEstado("error");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Calculadora */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="text-base font-semibold text-neutral-900">
          Estima tu inversión
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Elige cómo quieres Vinqulia y cuántas personas lo usarán.
        </p>

        <fieldset className="mt-5">
          <legend className={estilosEtiqueta}>Modalidad</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MODALIDADES) as Modalidad[]).map((clave) => (
              <label
                key={clave}
                className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modalidad"
                    value={clave}
                    checked={modalidad === clave}
                    onChange={() => setModalidad(clave)}
                    className="size-4 accent-brand-600"
                  />
                  <span className="font-medium text-neutral-800">
                    {MODALIDADES[clave].nombre}
                  </span>
                </span>
                <span className="pl-6 text-xs text-neutral-500">
                  {MODALIDADES[clave].frase}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5">
          <label htmlFor="ent-usuarios" className={estilosEtiqueta}>
            Usuarios que entrarán al CRM
          </label>
          <input
            id="ent-usuarios"
            type="number"
            min={1}
            max={10000}
            value={usuarios}
            onChange={(e) => setUsuarios(Number(e.target.value) || 1)}
            className={estilosCampo}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS_DE_USUARIOS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setUsuarios(preset)}
                className={
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors " +
                  (usuarios === preset
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300")
                }
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <dl className="mt-6 space-y-2 border-t border-neutral-200 pt-5 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-neutral-600">
              Licencia anual · {estimacion.banda.etiqueta.toLowerCase()}
            </dt>
            <dd className="font-semibold tabular-nums text-neutral-900">
              {formatearPrecio(estimacion.licenciaAnual)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-neutral-600">Implementación (una vez)</dt>
            <dd className="font-semibold tabular-nums text-neutral-900">
              desde {formatearPrecio(estimacion.implementacion)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-neutral-200 pt-3">
            <dt className="font-medium text-neutral-800">Primer año</dt>
            <dd className="text-xl font-semibold tabular-nums text-neutral-900">
              {formatearPrecio(estimacion.totalPrimerAnio)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-neutral-600">A partir del segundo año</dt>
            <dd className="tabular-nums text-neutral-800">
              {formatearPrecio(estimacion.licenciaAnual)} / año
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-neutral-600">
              Equivale por usuario
            </dt>
            <dd className="tabular-nums text-neutral-800">
              {formatearPrecio(estimacion.porUsuarioAlMes)} / mes
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
          Estimación en MXN más IVA. Con {DESCUENTO_2_ANIOS}% de descuento a
          2 años y {DESCUENTO_3_ANIOS}% a 3. La propuesta formal sale de una
          llamada de 30 minutos.
        </p>
      </div>

      {/* Formulario */}
      <div className="lg:col-span-3">
        {estado === "hecho" ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="size-12 text-emerald-600" />
            <h3 className="mt-4 text-xl font-semibold text-neutral-900">
              Recibimos tu solicitud
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
              Ya está registrada en nuestro propio Vinqulia, con la estimación
              que acabas de ver. Te llamamos en menos de un día hábil para
              agendar el diagnóstico.
            </p>
          </div>
        ) : (
          <form
            onSubmit={enviar}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h3 className="text-base font-semibold text-neutral-900">
              Hablemos de tu proyecto
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              Te contactamos en menos de un día hábil. La estimación de la
              izquierda viaja con tu solicitud.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ent-nombre" className={estilosEtiqueta}>
                  Nombre *
                </label>
                <input
                  id="ent-nombre"
                  name="nombre"
                  required
                  maxLength={120}
                  className={estilosCampo}
                />
              </div>
              <div>
                <label htmlFor="ent-empresa" className={estilosEtiqueta}>
                  Empresa *
                </label>
                <input
                  id="ent-empresa"
                  name="empresa"
                  required
                  maxLength={120}
                  className={estilosCampo}
                />
              </div>
              <div>
                <label htmlFor="ent-email" className={estilosEtiqueta}>
                  Correo de trabajo *
                </label>
                <input
                  id="ent-email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  className={estilosCampo}
                />
              </div>
              <div>
                <label htmlFor="ent-telefono" className={estilosEtiqueta}>
                  WhatsApp / teléfono
                </label>
                <input
                  id="ent-telefono"
                  name="telefono"
                  type="tel"
                  maxLength={50}
                  placeholder="+52 55 0000 0000"
                  className={estilosCampo}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ent-sistema" className={estilosEtiqueta}>
                  ¿Con qué gestionan hoy sus ventas?
                </label>
                <select
                  id="ent-sistema"
                  name="sistema_actual"
                  className={estilosCampo}
                  defaultValue=""
                >
                  <option value="">Selecciona…</option>
                  {SISTEMAS_ACTUALES.map((sistema) => (
                    <option key={sistema} value={sistema}>
                      {sistema}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ent-comentarios" className={estilosEtiqueta}>
                  ¿Qué te trae aquí?
                </label>
                <textarea
                  id="ent-comentarios"
                  name="comentarios"
                  rows={3}
                  maxLength={2000}
                  placeholder="Por ejemplo: tenemos 80 vendedores en 4 sucursales, usamos un ERP propio y el dato tiene que quedarse en nuestros servidores."
                  className={estilosCampo}
                />
              </div>
            </div>

            {/* Señuelo anti-bots: invisible para las personas. */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="ent-sitio-web">Sitio web</label>
              <input
                id="ent-sitio-web"
                name="sitio_web"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              Se enviará: {MODALIDADES[modalidad].nombre.toLowerCase()},{" "}
              {estimacion.usuarios} usuarios, estimación de{" "}
              {formatearPrecio(estimacion.totalPrimerAnio)} el primer año.
            </p>

            {estado === "error" && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={estado === "enviando"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
              >
                {estado === "enviando" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {estado === "enviando" ? "Enviando…" : "Pedir la propuesta"}
              </button>
              <p className="text-xs leading-relaxed text-neutral-500">
                Al enviar aceptas que Kontrolia te contacte. No compartimos tus
                datos con terceros.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
