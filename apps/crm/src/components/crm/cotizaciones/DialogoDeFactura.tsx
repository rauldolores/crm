import { Loader2, ReceiptText } from "lucide-react";
import { useGetOne, useNotify, useTranslate } from "ra-core";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMAS_DE_PAGO } from "@/lib/conectores/catalogo";
import {
  REGIMENES_FISCALES,
  USOS_DE_CFDI,
  esCodigoPostalValido,
  esRfcValido,
} from "@/lib/conectores/sat";

import { llamarApi } from "../misc/llamarApi";
import type { Company, Contact, Invoice, Quote } from "../types";

/**
 * Facturar una cotización aceptada: confirma los datos fiscales del
 * receptor (los que ya tiene la empresa vienen puestos) y pide la factura
 * al proveedor conectado. Lo que la persona confirme se guarda en la
 * empresa, así la siguiente sale sin preguntar.
 */

interface Receptor {
  razonSocial: string;
  rfc: string;
  regimenFiscal: string;
  usoCfdi: string;
  codigoPostal: string;
  email: string;
}

export const DialogoDeFactura = ({
  cotizacion,
  onClose,
  onEmitida,
}: {
  cotizacion: Quote;
  onClose: () => void;
  onEmitida: (factura: Invoice) => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [receptor, setReceptor] = useState<Receptor>({
    razonSocial: "",
    rfc: "",
    regimenFiscal: "",
    usoCfdi: "G03",
    codigoPostal: "",
    email: "",
  });
  const [formaPago, setFormaPago] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { data: empresa } = useGetOne<Company>(
    "companies",
    { id: cotizacion.company_id ?? 0 },
    { enabled: Boolean(cotizacion.company_id) },
  );
  const { data: contacto } = useGetOne<Contact>(
    "contacts",
    { id: cotizacion.contact_id ?? 0 },
    { enabled: Boolean(cotizacion.contact_id) },
  );

  // Lo que la empresa ya tiene, puesto de antemano; lo que falta, vacío.
  useEffect(() => {
    setReceptor((previo) => ({
      razonSocial: previo.razonSocial || empresa?.name || "",
      rfc: previo.rfc || empresa?.tax_identifier || "",
      regimenFiscal: previo.regimenFiscal || empresa?.tax_regime || "",
      usoCfdi: empresa?.cfdi_use || previo.usoCfdi,
      codigoPostal: previo.codigoPostal || empresa?.zipcode || "",
      email:
        previo.email ||
        contacto?.email_jsonb?.[0]?.email ||
        cotizacion.accepted_by_email ||
        "",
    }));
  }, [empresa, contacto, cotizacion.accepted_by_email]);

  const cambiar = (campo: keyof Receptor) => (valor: string) =>
    setReceptor((previo) => ({ ...previo, [campo]: valor }));

  const listo =
    receptor.razonSocial.trim() &&
    esRfcValido(receptor.rfc) &&
    receptor.regimenFiscal &&
    receptor.usoCfdi &&
    esCodigoPostalValido(receptor.codigoPostal);

  const facturar = async () => {
    setEnviando(true);
    try {
      const { factura } = await llamarApi<{ factura: Invoice }>(
        "/api/conectores/facturacion/emitir",
        {
          method: "POST",
          body: JSON.stringify({
            quoteId: cotizacion.id,
            receptor: {
              ...receptor,
              rfc: receptor.rfc.trim().toUpperCase(),
              email: receptor.email.trim() || null,
            },
            ...(formaPago ? { formaPago } : {}),
          }),
        },
      );
      notify(
        factura.status === "stamped"
          ? translate("crm.invoices.stamped", {
              folio: [factura.serie, factura.folio].filter(Boolean).join("-"),
            })
          : (factura.error ?? translate("crm.invoices.not_stamped")),
        { type: factura.status === "stamped" ? "info" : "warning" },
      );
      onEmitida(factura);
      onClose();
    } catch (error) {
      notify((error as Error).message, {
        type: "error",
        autoHideDuration: 10000,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(valor) => !valor && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {translate("crm.invoices.dialog_title", {
              number: cotizacion.number,
            })}
          </DialogTitle>
          <DialogDescription>
            {translate("crm.invoices.dialog_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fac-razon">
              {translate("crm.invoices.fields.legal_name")}
            </Label>
            <Input
              id="fac-razon"
              value={receptor.razonSocial}
              onChange={(e) => cambiar("razonSocial")(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fac-rfc">
              {translate("crm.invoices.fields.rfc")}
            </Label>
            <Input
              id="fac-rfc"
              value={receptor.rfc}
              onChange={(e) => cambiar("rfc")(e.target.value.toUpperCase())}
              placeholder="XAXX010101000"
              aria-invalid={Boolean(receptor.rfc) && !esRfcValido(receptor.rfc)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fac-cp">
              {translate("crm.invoices.fields.zipcode")}
            </Label>
            <Input
              id="fac-cp"
              inputMode="numeric"
              maxLength={5}
              value={receptor.codigoPostal}
              onChange={(e) => cambiar("codigoPostal")(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{translate("crm.invoices.fields.tax_regime")}</Label>
            <Select
              value={receptor.regimenFiscal}
              onValueChange={cambiar("regimenFiscal")}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={translate("crm.invoices.choose_regime")}
                />
              </SelectTrigger>
              <SelectContent>
                {REGIMENES_FISCALES.map((regimen) => (
                  <SelectItem key={regimen.value} value={regimen.value}>
                    {regimen.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{translate("crm.invoices.fields.cfdi_use")}</Label>
            <Select value={receptor.usoCfdi} onValueChange={cambiar("usoCfdi")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USOS_DE_CFDI.map((uso) => (
                  <SelectItem key={uso.value} value={uso.value}>
                    {uso.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{translate("crm.invoices.fields.payment_form")}</Label>
            <Select value={formaPago} onValueChange={setFormaPago}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={translate("crm.invoices.payment_form_default")}
                />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_DE_PAGO.map((forma) => (
                  <SelectItem key={forma.value} value={forma.value}>
                    {forma.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fac-email">
              {translate("crm.invoices.fields.email")}
            </Label>
            <Input
              id="fac-email"
              type="email"
              value={receptor.email}
              onChange={(e) => cambiar("email")(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {translate("crm.invoices.fields.email_help")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={enviando}>
            {translate("ra.action.cancel")}
          </Button>
          <Button onClick={facturar} disabled={enviando || !listo}>
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ReceiptText className="h-4 w-4" />
            )}
            {translate("crm.invoices.issue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
