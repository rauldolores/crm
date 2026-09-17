import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import {
  fechaLegible,
  importeLegible,
  type CotizacionCompleta,
} from "./cotizaciones";

/**
 * La cotización como PDF, con el mismo contenido y el mismo orden que la
 * página pública: emisor, folio y fecha, cliente, vigencia, líneas, totales
 * y condiciones. Se genera en el servidor con @react-pdf/renderer (sin
 * navegador): es lo que el cliente adjunta a su orden de compra.
 *
 * Tipografía Helvetica, la de fábrica: cubre el español sin cargar fuentes.
 */

const GRIS = "#6b7280";
const LINEA = "#e5e7eb";

const estilos = StyleSheet.create({
  pagina: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: LINEA,
    paddingBottom: 16,
  },
  logo: { height: 40, width: 120, objectFit: "contain", marginBottom: 6 },
  emisor: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  gris: { color: GRIS },
  etiqueta: {
    fontSize: 8,
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Helvetica-Bold",
  },
  folio: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  fila: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  titulo: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 22 },
  tabla: { marginTop: 12 },
  cabeceraDeTabla: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    paddingBottom: 4,
  },
  filaDeTabla: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINEA,
    paddingVertical: 6,
  },
  concepto: { flex: 1, paddingRight: 8 },
  columna: { width: 64, textAlign: "right" },
  columnaAncha: { width: 80, textAlign: "right" },
  totales: { marginTop: 10, alignSelf: "flex-end", width: 220 },
  filaDeTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  total: {
    borderTopWidth: 1,
    borderTopColor: "#9ca3af",
    marginTop: 4,
    paddingTop: 6,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  condiciones: { marginTop: 24, lineHeight: 1.5 },
  pie: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: GRIS,
    textAlign: "center",
  },
});

const PERIODO: Record<string, string> = {
  monthly: "mensual",
  quarterly: "trimestral",
  yearly: "anual",
};

const DocumentoDeCotizacion = ({
  completa,
  logo,
}: {
  completa: CotizacionCompleta;
  logo: string | null;
}) => {
  const { cotizacion, lineas, emisor, empresa, contacto } = completa;
  const moneda = cotizacion.currency;
  const nombreDelContacto = contacto
    ? `${contacto.first_name} ${contacto.last_name ?? ""}`.trim()
    : "";

  return (
    <Document
      title={`Cotización ${cotizacion.number}`}
      author={emisor.name || "Vinqulia"}
    >
      <Page size="LETTER" style={estilos.pagina}>
        <View style={estilos.cabecera}>
          <View>
            {logo ? <Image src={logo} style={estilos.logo} /> : null}
            <Text style={estilos.emisor}>{emisor.name || "Cotización"}</Text>
            {emisor.tax_id ? (
              <Text style={estilos.gris}>RFC {emisor.tax_id}</Text>
            ) : null}
            {emisor.address ? (
              <Text style={estilos.gris}>{emisor.address}</Text>
            ) : null}
            {emisor.email || emisor.phone ? (
              <Text style={estilos.gris}>
                {[emisor.email, emisor.phone].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={estilos.etiqueta}>Cotización</Text>
            <Text style={estilos.folio}>{cotizacion.number}</Text>
            <Text style={estilos.gris}>{fechaLegible(cotizacion.created_at)}</Text>
          </View>
        </View>

        <View style={estilos.fila}>
          <View>
            <Text style={estilos.etiqueta}>Para</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 2 }}>
              {empresa?.name ?? nombreDelContacto}
            </Text>
            {empresa && nombreDelContacto ? (
              <Text style={estilos.gris}>{nombreDelContacto}</Text>
            ) : null}
            {contacto?.email ? (
              <Text style={estilos.gris}>{contacto.email}</Text>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {cotizacion.valid_until ? (
              <>
                <Text style={estilos.etiqueta}>Válida hasta</Text>
                <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 2 }}>
                  {fechaLegible(cotizacion.valid_until)}
                </Text>
              </>
            ) : null}
            {cotizacion.contract_period ? (
              <Text style={estilos.gris}>
                Servicio {PERIODO[cotizacion.contract_period]}, se renueva al
                vencer cada periodo.
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={estilos.titulo}>{cotizacion.title}</Text>

        <View style={estilos.tabla}>
          <View style={estilos.cabeceraDeTabla}>
            <Text style={[estilos.concepto, estilos.etiqueta]}>Concepto</Text>
            <Text style={[estilos.columna, estilos.etiqueta]}>Cant.</Text>
            <Text style={[estilos.columnaAncha, estilos.etiqueta]}>Precio</Text>
            <Text style={[estilos.columna, estilos.etiqueta]}>Desc.</Text>
            <Text style={[estilos.columnaAncha, estilos.etiqueta]}>Importe</Text>
          </View>
          {lineas.map((linea) => (
            <View key={String(linea.id)} style={estilos.filaDeTabla} wrap={false}>
              <Text style={estilos.concepto}>{linea.description}</Text>
              <Text style={estilos.columna}>{Number(linea.quantity)}</Text>
              <Text style={estilos.columnaAncha}>
                {importeLegible(Number(linea.unit_price), moneda)}
              </Text>
              <Text style={estilos.columna}>
                {Number(linea.discount_pct) > 0
                  ? `${Number(linea.discount_pct)}%`
                  : "—"}
              </Text>
              <Text style={estilos.columnaAncha}>
                {importeLegible(Number(linea.amount), moneda)}
              </Text>
            </View>
          ))}
        </View>

        <View style={estilos.totales}>
          <View style={estilos.filaDeTotal}>
            <Text style={estilos.gris}>Subtotal</Text>
            <Text>{importeLegible(Number(cotizacion.subtotal), moneda)}</Text>
          </View>
          <View style={estilos.filaDeTotal}>
            <Text style={estilos.gris}>IVA</Text>
            <Text>{importeLegible(Number(cotizacion.tax_total), moneda)}</Text>
          </View>
          <View style={[estilos.filaDeTotal, estilos.total]}>
            <Text>Total</Text>
            <Text>
              {importeLegible(Number(cotizacion.total), moneda)} {moneda}
            </Text>
          </View>
        </View>

        {cotizacion.notes ? (
          <View style={estilos.condiciones}>
            <Text style={estilos.etiqueta}>Alcance y condiciones</Text>
            <Text style={{ marginTop: 4 }}>{cotizacion.notes}</Text>
          </View>
        ) : null}

        {cotizacion.status === "accepted" && cotizacion.accepted_at ? (
          <Text style={[estilos.gris, { marginTop: 20 }]}>
            Aceptada por {cotizacion.accepted_by_name}
            {cotizacion.accepted_by_email
              ? ` (${cotizacion.accepted_by_email})`
              : ""}{" "}
            el {fechaLegible(cotizacion.accepted_at)}.
          </Text>
        ) : null}

        <Text
          style={estilos.pie}
          render={({ pageNumber, totalPages }) =>
            `${cotizacion.number} · Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

/**
 * El logo se trae aquí y no dentro del documento: si la URL no responde,
 * @react-pdf/renderer aborta el render entero, y un logo caído no debe
 * impedir descargar una cotización.
 */
const cargarLogo = async (url: string | undefined): Promise<string | null> => {
  if (!url || !/^https?:\/\//.test(url)) return null;
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!respuesta.ok) return null;
    const tipo = respuesta.headers.get("content-type") ?? "";
    if (!/image\/(png|jpe?g)/.test(tipo)) return null;
    const bytes = Buffer.from(await respuesta.arrayBuffer());
    return `data:${tipo};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
};

export async function generarPdfDeCotizacion(
  completa: CotizacionCompleta,
): Promise<Buffer> {
  const logo = await cargarLogo(completa.emisor.logo_url);
  return renderToBuffer(
    <DocumentoDeCotizacion completa={completa} logo={logo} />,
  );
}
