import {
  ErrorDeConector,
  type ConectorDeFacturacion,
  type CredencialesDeConector,
  type FacturaEmitida,
  type LineaAFacturar,
  type PeticionDeFactura,
  type ReceptorFiscal,
  type ResultadoDePrueba,
} from "./tipos";

/**
 * Faqturia como proveedor de facturación, por su API externa con clave por
 * empresa (`X-API-Key`, ver docs/api-keys.md en su repo). El CRM no arma
 * CFDI: manda receptor y conceptos, Faqturia timbra con su PAC y devuelve
 * UUID, serie y folio; el PDF y el XML se descargan de ahí con un enlace
 * temporal.
 *
 * Cada organización trae su propia instalación (base_url) y su clave: nada
 * de esto vive en variables de entorno del CRM.
 */

const TIEMPO_MAXIMO = 30_000;

interface ClienteDeFaqturia {
  id: string;
  rfc: string;
  name: string;
}

interface FacturaDeFaqturia {
  id: string;
  uuid: string | null;
  serie: string | null;
  folio: string | null;
  total: number | string;
  moneda?: string | null;
  status: string;
  fecha_timbrado?: string | null;
  fecha_emision?: string | null;
}

/** Un concepto como lo espera POST /api/external/invoices de Faqturia. */
export const conceptoDeFaqturia = (
  linea: LineaAFacturar,
  ajustes: { clave_prod_serv: string; clave_unidad: string },
): Record<string, unknown> => ({
  descripcion: linea.descripcion,
  cantidad: linea.cantidad,
  precio_unitario: linea.precioUnitario,
  descuento: linea.descuento,
  clave_sat: ajustes.clave_prod_serv,
  clave_unidad_sat: ajustes.clave_unidad,
  ...(linea.sku ? { identificador_externo: linea.sku } : {}),
  // Sin `impuestos`, Faqturia no calcula IVA para el concepto; con él,
  // traslada la tasa indicada.
  ...(linea.tasaIva > 0
    ? {
        impuestos: {
          traslados: [{ impuesto: "002", tasaOCuota: linea.tasaIva }],
        },
      }
    : {}),
});

const estadoDe = (
  factura: FacturaDeFaqturia,
  timbrada: boolean,
): FacturaEmitida["status"] => {
  if (factura.status === "cancelada") return "cancelled";
  if (timbrada || factura.status === "timbrada" || factura.status === "pagada")
    return "stamped";
  return "draft";
};

export const facturaDeFaqturia = (
  factura: FacturaDeFaqturia,
  opciones: { timbrada: boolean; moneda: string; error?: string | null },
): FacturaEmitida => ({
  externalId: factura.id,
  uuid: factura.uuid ?? null,
  serie: factura.serie ?? null,
  folio: factura.folio ?? null,
  total: Number(factura.total) || 0,
  currency: factura.moneda || opciones.moneda,
  status: estadoDe(factura, opciones.timbrada),
  issuedAt: factura.fecha_timbrado ?? factura.fecha_emision ?? null,
  error: opciones.error ?? null,
});

export class ConectorFaqturia implements ConectorDeFacturacion {
  readonly familia = "invoicing" as const;
  private readonly base: string;
  private readonly clave: string;
  private readonly ajustes: Record<string, string>;

  constructor(credenciales: CredencialesDeConector) {
    const url = (credenciales.settings.base_url ?? "").trim().replace(/\/+$/, "");
    if (!/^https?:\/\/[^\s/]+$/.test(url)) {
      throw new ErrorDeConector(
        "La dirección de Faqturia debe ser como https://app.faqturia.com.",
        400,
      );
    }
    this.base = url;
    this.clave = credenciales.secret;
    this.ajustes = credenciales.settings;
  }

  private async pedir<T>(
    ruta: string,
    init: RequestInit = {},
  ): Promise<{ estado: number; cuerpo: T }> {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${this.base}/api/external${ruta}`, {
        ...init,
        headers: {
          "X-API-Key": this.clave,
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
        signal: AbortSignal.timeout(TIEMPO_MAXIMO),
      });
    } catch {
      throw new ErrorDeConector(
        "No se pudo hablar con Faqturia. Revisa la dirección de tu instalación.",
      );
    }
    const cuerpo = (await respuesta.json().catch(() => ({}))) as T;
    if (respuesta.status === 401) {
      throw new ErrorDeConector(
        "Faqturia rechazó la clave de API. Comprueba que la copiaste completa y que sigue activa.",
        401,
      );
    }
    if (respuesta.status === 403) {
      throw new ErrorDeConector(
        "La clave de API de Faqturia no tiene permiso suficiente: necesita clientes y facturas, leer y escribir.",
        403,
      );
    }
    if (respuesta.status === 429) {
      throw new ErrorDeConector(
        "Faqturia está recibiendo demasiadas peticiones. Espera un minuto e inténtalo de nuevo.",
        429,
      );
    }
    return { estado: respuesta.status, cuerpo };
  }

  private mensajeDe(cuerpo: unknown, porDefecto: string): string {
    const error = (cuerpo as { error?: unknown })?.error;
    if (typeof error === "string") return error;
    const mensaje = (error as { message?: unknown })?.message;
    return typeof mensaje === "string" ? mensaje : porDefecto;
  }

  async probar(): Promise<ResultadoDePrueba> {
    try {
      const { estado, cuerpo } = await this.pedir<{ total?: number }>(
        "/clients?pageSize=1",
      );
      if (estado >= 400) {
        return {
          ok: false,
          mensaje: this.mensajeDe(cuerpo, "Faqturia no aceptó la conexión."),
        };
      }
      return {
        ok: true,
        detalle: `Conectado con Faqturia: ${cuerpo.total ?? 0} clientes registrados.`,
      };
    } catch (error) {
      return {
        ok: false,
        mensaje:
          error instanceof ErrorDeConector
            ? error.message
            : "No se pudo comprobar la conexión con Faqturia.",
      };
    }
  }

  /** El cliente de Faqturia con ese RFC; si no existe, lo crea. */
  private async clientePara(receptor: ReceptorFiscal): Promise<string> {
    const rfc = receptor.rfc.trim().toUpperCase();
    const busqueda = await this.pedir<{ items?: ClienteDeFaqturia[] }>(
      `/clients?search=${encodeURIComponent(rfc)}&pageSize=10`,
    );
    const existente = (busqueda.cuerpo.items ?? []).find(
      (cliente) => cliente.rfc?.toUpperCase() === rfc,
    );
    if (existente) return existente.id;

    const alta = await this.pedir<{ data?: ClienteDeFaqturia }>(
      "/clients/create",
      {
        method: "POST",
        body: JSON.stringify({
          razon_social: receptor.razonSocial,
          rfc,
          email: receptor.email ?? undefined,
          regimen_fiscal: receptor.regimenFiscal,
          uso_cfdi: receptor.usoCfdi,
          codigo_postal: receptor.codigoPostal,
        }),
      },
    );
    if (alta.estado >= 400 || !alta.cuerpo.data?.id) {
      throw new ErrorDeConector(
        this.mensajeDe(
          alta.cuerpo,
          "Faqturia no pudo dar de alta al cliente con esos datos fiscales.",
        ),
        422,
      );
    }
    return alta.cuerpo.data.id;
  }

  async emitirFactura(peticion: PeticionDeFactura): Promise<FacturaEmitida> {
    const clienteId = await this.clientePara(peticion.receptor);
    const ajustes = {
      clave_prod_serv: this.ajustes.clave_prod_serv || "01010101",
      clave_unidad: this.ajustes.clave_unidad || "E48",
    };
    const respuesta = await this.pedir<{
      success?: boolean;
      data?: FacturaDeFaqturia;
      stamped?: boolean;
      error?: { message?: string } | string;
    }>("/invoices", {
      method: "POST",
      body: JSON.stringify({
        client_id: clienteId,
        serie: this.ajustes.serie || "A",
        uso_cfdi: peticion.receptor.usoCfdi,
        forma_pago: peticion.formaPago || this.ajustes.forma_pago || "99",
        metodo_pago: peticion.metodoPago || this.ajustes.metodo_pago || "PUE",
        moneda: peticion.moneda,
        conceptos: peticion.lineas.map((linea) =>
          conceptoDeFaqturia(linea, ajustes),
        ),
        auto_stamp: true,
      }),
    });
    if (respuesta.estado >= 400 || !respuesta.cuerpo.data) {
      throw new ErrorDeConector(
        this.mensajeDe(respuesta.cuerpo, "Faqturia no pudo crear la factura."),
        422,
      );
    }
    return facturaDeFaqturia(respuesta.cuerpo.data, {
      timbrada: respuesta.cuerpo.stamped === true,
      moneda: peticion.moneda,
      error:
        respuesta.cuerpo.stamped === true
          ? null
          : this.mensajeDe(
              respuesta.cuerpo,
              "Faqturia creó la factura pero no la timbró.",
            ),
    });
  }

  async recuperarFactura(externalId: string): Promise<FacturaEmitida> {
    const { estado, cuerpo } = await this.pedir<{ data?: FacturaDeFaqturia }>(
      `/invoices/${encodeURIComponent(externalId)}`,
    );
    if (estado >= 400 || !cuerpo.data) {
      throw new ErrorDeConector("Faqturia no encuentra esa factura.", 404);
    }
    return facturaDeFaqturia(cuerpo.data, {
      timbrada: cuerpo.data.status === "timbrada",
      moneda: cuerpo.data.moneda || "MXN",
    });
  }

  async enlaceDeDescarga(
    externalId: string,
    formato: "pdf" | "xml",
  ): Promise<string> {
    const { estado, cuerpo } = await this.pedir<{ download_url?: string }>(
      `/invoices/${encodeURIComponent(externalId)}/${formato}`,
    );
    if (estado >= 400 || !cuerpo.download_url) {
      throw new ErrorDeConector(
        this.mensajeDe(
          cuerpo,
          `Faqturia todavía no tiene el ${formato.toUpperCase()} de esta factura.`,
        ),
        404,
      );
    }
    return cuerpo.download_url;
  }
}
