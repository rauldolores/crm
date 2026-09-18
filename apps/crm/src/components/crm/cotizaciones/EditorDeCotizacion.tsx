import {
  Form,
  required,
  useCreate,
  useDataProvider,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { ArrayInput } from "@/components/admin/array-input";
import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, Quote, QuoteItem, QuoteTemplate } from "../types";
import { SelectorDeProducto } from "./SelectorDeProducto";
import { calcularTotales, venceEn, type LineaEditable } from "./totales";

/**
 * Alta y edición de una cotización desde la oportunidad.
 *
 * Las líneas se editan en un iterador; los totales de la vista previa se
 * calculan igual que en la base, pero lo que vale es lo que la base
 * calcula al guardar. Al guardar se reescriben todas las líneas: con una
 * docena como máximo, es más simple y más seguro que sincronizar una a una.
 *
 * Las plantillas de cotización (Cotizaciones → Plantillas) rellenan título,
 * condiciones, periodicidad, vigencia y líneas de una vez.
 */

// Sin opción de valor vacío: el selector no la admite. «Compra puntual» es
// el hueco (emptyText) y se guarda como null.
const PERIODOS = [
  { id: "monthly", name: "crm.quotes.period.monthly" },
  { id: "quarterly", name: "crm.quotes.period.quarterly" },
  { id: "yearly", name: "crm.quotes.period.yearly" },
];

const DIAS_DE_VIGENCIA_POR_DEFECTO = 30;

interface ValoresDelFormulario {
  title: string;
  valid_until: string | null;
  currency: string;
  contract_period: string;
  notes: string;
  items: LineaEditable[];
}

const lineaVacia = (iva: number): LineaEditable => ({
  description: "",
  quantity: 1,
  unit_price: 0,
  discount_pct: 0,
  tax_rate: iva,
});

const formatear = (valor: number, moneda: string) =>
  valor.toLocaleString("es-MX", {
    style: "currency",
    currency: moneda || "MXN",
  });

/** Rellena el formulario con una plantilla; lo que ya había se pisa. */
const AplicarPlantilla = () => {
  const translate = useTranslate();
  const { quoteTemplates, quoteTaxRate } = useConfigurationContext();
  const { setValue } = useFormContext();
  if (quoteTemplates.length === 0) return null;

  const aplicar = (clave: string) => {
    const plantilla = quoteTemplates.find((p) => p.key === clave);
    if (!plantilla) return;
    setValue("title", plantilla.title, { shouldDirty: true });
    setValue("notes", plantilla.notes ?? "", { shouldDirty: true });
    setValue("contract_period", plantilla.contract_period ?? "", {
      shouldDirty: true,
    });
    setValue(
      "valid_until",
      venceEn(plantilla.valid_days ?? DIAS_DE_VIGENCIA_POR_DEFECTO),
      { shouldDirty: true },
    );
    setValue(
      "items",
      plantilla.items.map((linea) => ({
        description: linea.description,
        quantity: linea.quantity,
        unit_price: linea.unit_price,
        discount_pct: linea.discount_pct ?? 0,
        tax_rate: linea.tax_rate ?? quoteTaxRate,
      })),
      { shouldDirty: true },
    );
  };

  return (
    <div className="flex items-center gap-3">
      <Label className="shrink-0">
        {translate("crm.quotes.from_template")}
      </Label>
      <Select onValueChange={aplicar}>
        <SelectTrigger
          className="w-full"
          aria-label={translate("crm.quotes.from_template")}
        >
          <SelectValue placeholder={translate("crm.quotes.choose_template")} />
        </SelectTrigger>
        <SelectContent>
          {quoteTemplates.map((plantilla: QuoteTemplate) => (
            <SelectItem key={plantilla.key} value={plantilla.key}>
              {plantilla.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const ResumenDeTotales = () => {
  const translate = useTranslate();
  const lineas = useWatch({ name: "items" }) as LineaEditable[] | undefined;
  const moneda = (useWatch({ name: "currency" }) as string) || "MXN";
  const { subtotal, iva, total } = calcularTotales(lineas);
  return (
    <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">
          {translate("crm.quotes.subtotal")}
        </dt>
        <dd className="tabular-nums">{formatear(subtotal, moneda)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">{translate("crm.quotes.tax")}</dt>
        <dd className="tabular-nums">{formatear(iva, moneda)}</dd>
      </div>
      <div className="flex justify-between border-t pt-1 font-semibold">
        <dt>{translate("crm.quotes.total")}</dt>
        <dd className="tabular-nums">{formatear(total, moneda)}</dd>
      </div>
    </dl>
  );
};

export const EditorDeCotizacion = ({
  oportunidad,
  cotizacion,
  lineas,
  abierto,
  onClose,
  onSaved,
}: {
  oportunidad: Deal;
  cotizacion?: Quote;
  lineas?: QuoteItem[];
  abierto: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const [create] = useCreate();
  const [update] = useUpdate();
  const { currency, quoteTaxRate } = useConfigurationContext();
  const [guardando, setGuardando] = useState(false);

  const valoresIniciales: ValoresDelFormulario = cotizacion
    ? {
        title: cotizacion.title,
        valid_until: cotizacion.valid_until,
        currency: cotizacion.currency,
        contract_period: cotizacion.contract_period ?? "",
        notes: cotizacion.notes ?? "",
        items: (lineas ?? []).map((linea) => ({
          description: linea.description,
          product_ref: linea.product_ref ?? null,
          quantity: Number(linea.quantity),
          unit_price: Number(linea.unit_price),
          discount_pct: Number(linea.discount_pct),
          tax_rate: Number(linea.tax_rate),
        })),
      }
    : {
        title: oportunidad.name,
        valid_until: venceEn(DIAS_DE_VIGENCIA_POR_DEFECTO),
        currency,
        contract_period: "",
        notes: "",
        items: [lineaVacia(quoteTaxRate)],
      };

  const guardar = async (valores: Record<string, unknown>) => {
    const datos = valores as unknown as ValoresDelFormulario;
    const filas = (datos.items ?? []).filter((linea) =>
      (linea.description ?? "").trim(),
    );
    if (filas.length === 0) {
      notify("crm.quotes.no_lines", { type: "warning" });
      return;
    }
    setGuardando(true);
    try {
      const cabecera = {
        title: datos.title,
        valid_until: datos.valid_until || null,
        currency: datos.currency || currency,
        contract_period: datos.contract_period || null,
        notes: datos.notes || null,
      };
      let idDeCotizacion = cotizacion?.id;
      if (cotizacion) {
        await update(
          "quotes",
          { id: cotizacion.id, data: cabecera, previousData: cotizacion },
          { returnPromise: true },
        );
        const { data: anteriores } = await dataProvider.getList("quote_items", {
          filter: { quote_id: cotizacion.id },
          pagination: { page: 1, perPage: 200 },
          sort: { field: "position", order: "ASC" },
        });
        if (anteriores.length > 0) {
          await dataProvider.deleteMany("quote_items", {
            ids: anteriores.map((fila) => fila.id),
          });
        }
      } else {
        const creada = await create(
          "quotes",
          {
            data: {
              ...cabecera,
              deal_id: oportunidad.id,
              company_id: oportunidad.company_id,
              contact_id: oportunidad.contact_ids?.[0] ?? null,
            },
          },
          { returnPromise: true },
        );
        idDeCotizacion = creada.id;
      }
      // Una a una y en orden: la posición es la del iterador.
      for (const [indice, linea] of filas.entries()) {
        await create(
          "quote_items",
          {
            data: {
              quote_id: idDeCotizacion,
              position: indice,
              description: linea.description,
              product_ref: linea.product_ref || null,
              quantity: Number(linea.quantity) || 0,
              unit_price: Number(linea.unit_price) || 0,
              discount_pct: Number(linea.discount_pct) || 0,
              tax_rate: Number(linea.tax_rate) || 0,
            },
          },
          { returnPromise: true },
        );
      }
      notify(cotizacion ? "crm.quotes.updated" : "crm.quotes.created", {
        type: "info",
      });
      onSaved();
      onClose();
    } catch {
      notify("crm.quotes.save_error", { type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(valor) => !valor && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {cotizacion
              ? translate("crm.quotes.edit_title", {
                  number: cotizacion.number,
                })
              : translate("crm.quotes.new")}
          </DialogTitle>
        </DialogHeader>
        <Form onSubmit={guardar} defaultValues={valoresIniciales}>
          <div className="flex flex-col gap-4">
            {!cotizacion && <AplicarPlantilla />}
            <TextInput
              source="title"
              label="crm.quotes.fields.title"
              validate={required()}
              helperText={false}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <DateInput
                source="valid_until"
                label="crm.quotes.fields.valid_until"
                helperText={false}
              />
              <TextInput
                source="currency"
                label="crm.quotes.fields.currency"
                helperText={false}
              />
              <SelectInput
                source="contract_period"
                label="crm.quotes.fields.contract_period"
                choices={PERIODOS}
                emptyText="crm.quotes.period.none"
                helperText="crm.quotes.fields.contract_period_help"
              />
            </div>

            {/* El iterador exige un recurso: fuera de una pantalla de recurso
                (Ajustes) no hay ninguno en contexto. */}
            <ArrayInput
              source="items"
              label="crm.quotes.fields.items"
              resource="quote_items"
            >
              <SimpleFormIterator inline disableReordering>
                <SelectorDeProducto />
                <TextInput
                  source="description"
                  label="crm.quotes.fields.description"
                  helperText={false}
                  className="min-w-56 flex-1"
                />
                <NumberInput
                  source="quantity"
                  label="crm.quotes.fields.quantity"
                  helperText={false}
                  className="w-20"
                />
                <NumberInput
                  source="unit_price"
                  label="crm.quotes.fields.unit_price"
                  helperText={false}
                  className="w-32"
                />
                <NumberInput
                  source="discount_pct"
                  label="crm.quotes.fields.discount_pct"
                  helperText={false}
                  className="w-20"
                />
                <NumberInput
                  source="tax_rate"
                  label="crm.quotes.fields.tax_rate"
                  helperText={false}
                  className="w-20"
                />
              </SimpleFormIterator>
            </ArrayInput>

            <ResumenDeTotales />

            <TextInput
              source="notes"
              label="crm.quotes.fields.notes"
              helperText="crm.quotes.fields.notes_help"
              multiline
              rows={4}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                {translate("ra.action.cancel")}
              </Button>
              <Button type="submit" disabled={guardando}>
                {translate("ra.action.save")}
              </Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
