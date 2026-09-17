import type { Metadata } from "next";

import { AccionesDeCotizacion } from "@/components/crm/public/AccionesDeCotizacion";
import {
  cotizacionPorToken,
  fechaLegible,
  importeLegible,
} from "@/lib/server/cotizaciones/cotizaciones";

type Props = { params: Promise<{ token: string }> };

/**
 * Página pública de una cotización: la ve quien recibe el enlace, sin
 * sesión. Es el documento completo —emisor, cliente, líneas, totales,
 * condiciones— con los botones de aceptar o rechazar, y está pensada para
 * imprimirse o guardarse en PDF tal cual (ver los estilos `print:`).
 *
 * Abrirla marca la cotización como «vista» la primera vez: es lo que le
 * dice al vendedor que el cliente ya la tiene delante.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const ETIQUETA_DE_ESTADO: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  viewed: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
};

const PERIODO: Record<string, string> = {
  monthly: "mensual",
  quarterly: "trimestral",
  yearly: "anual",
};

export default async function PaginaDeCotizacion({ params }: Props) {
  const { token } = await params;
  const completa = await cotizacionPorToken(token, { marcarVista: true });

  if (!completa) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-center text-muted-foreground">
          Esta cotización no existe o el enlace no es válido.
        </p>
      </div>
    );
  }

  const { cotizacion, lineas, emisor, empresa, contacto } = completa;
  const moneda = cotizacion.currency;
  const nombreDelContacto = contacto
    ? `${contacto.first_name} ${contacto.last_name ?? ""}`.trim()
    : "";

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <main className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-4">
            {emisor.logo_url ? (
              <img
                src={emisor.logo_url}
                alt={emisor.name}
                className="h-14 w-auto max-w-[180px] object-contain"
              />
            ) : null}
            <div>
              <p className="text-lg font-semibold">
                {emisor.name || "Cotización"}
              </p>
              {emisor.tax_id && (
                <p className="text-sm text-neutral-600">RFC {emisor.tax_id}</p>
              )}
              {emisor.address && (
                <p className="text-sm text-neutral-600">{emisor.address}</p>
              )}
              {(emisor.email || emisor.phone) && (
                <p className="text-sm text-neutral-600">
                  {[emisor.email, emisor.phone].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Cotización
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {cotizacion.number}
            </p>
            <p className="text-sm text-neutral-600">
              {fechaLegible(cotizacion.created_at)}
            </p>
            <p className="mt-1 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
              {ETIQUETA_DE_ESTADO[cotizacion.status] ?? cotizacion.status}
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Para
            </p>
            <p className="mt-1 font-medium">
              {empresa?.name ?? nombreDelContacto}
            </p>
            {empresa && nombreDelContacto && (
              <p className="text-sm text-neutral-600">{nombreDelContacto}</p>
            )}
            {contacto?.email && (
              <p className="text-sm text-neutral-600">{contacto.email}</p>
            )}
          </div>
          <div className="sm:text-right">
            {cotizacion.valid_until && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Válida hasta
                </p>
                <p className="mt-1 font-medium">
                  {fechaLegible(cotizacion.valid_until)}
                </p>
              </>
            )}
            {cotizacion.contract_period && (
              <p className="mt-1 text-sm text-neutral-600">
                Servicio {PERIODO[cotizacion.contract_period]}, se renueva al
                vencer cada periodo.
              </p>
            )}
          </div>
        </section>

        <h1 className="mt-8 text-xl font-semibold">{cotizacion.title}</h1>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="py-2 pr-3 font-semibold">Concepto</th>
                <th className="py-2 px-3 text-right font-semibold">Cant.</th>
                <th className="py-2 px-3 text-right font-semibold">Precio</th>
                <th className="py-2 px-3 text-right font-semibold">Desc.</th>
                <th className="py-2 pl-3 text-right font-semibold">Importe</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr key={linea.id} className="border-b border-neutral-100">
                  <td className="py-2.5 pr-3">{linea.description}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {Number(linea.quantity)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {importeLegible(Number(linea.unit_price), moneda)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {Number(linea.discount_pct) > 0
                      ? `${Number(linea.discount_pct)}%`
                      : "—"}
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums">
                    {importeLegible(Number(linea.amount), moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Subtotal</dt>
            <dd className="tabular-nums">
              {importeLegible(Number(cotizacion.subtotal), moneda)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">IVA</dt>
            <dd className="tabular-nums">
              {importeLegible(Number(cotizacion.tax_total), moneda)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">
              {importeLegible(Number(cotizacion.total), moneda)} {moneda}
            </dd>
          </div>
        </dl>

        {cotizacion.notes && (
          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Alcance y condiciones
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {cotizacion.notes}
            </p>
          </section>
        )}

        {cotizacion.status === "accepted" && cotizacion.accepted_at && (
          <p className="mt-8 text-sm text-neutral-600">
            Aceptada por {cotizacion.accepted_by_name}
            {cotizacion.accepted_by_email
              ? ` (${cotizacion.accepted_by_email})`
              : ""}{" "}
            el {fechaLegible(cotizacion.accepted_at)}.
          </p>
        )}

        <div className="mt-8 border-t pt-6">
          <AccionesDeCotizacion
            token={token}
            estado={cotizacion.status}
            nombreSugerido={nombreDelContacto}
            correoSugerido={contacto?.email ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
