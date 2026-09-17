import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Form,
  required,
  useDataProvider,
  useNotify,
  useTranslate,
} from "ra-core";
import { useState } from "react";

import { ArrayInput } from "@/components/admin/array-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CrmDataProvider } from "../providers/types";
import {
  useConfigurationContext,
  useConfigurationUpdater,
  type ConfigurationContextValue,
} from "../root/ConfigurationContext";
import type { QuoteIssuer, QuoteTemplate } from "../types";

/**
 * Ajustes de cotizaciones: quién emite, el IVA por defecto y las plantillas.
 *
 * Todo vive en `configuration.config` (quoteIssuer, quoteTaxRate,
 * quoteTemplates), como los módulos: se guarda la configuración entera con
 * el cambio, cuidando de no pisar el resto.
 */

const PERIODOS = [
  { id: "", name: "crm.quotes.period.none" },
  { id: "monthly", name: "crm.quotes.period.monthly" },
  { id: "quarterly", name: "crm.quotes.period.quarterly" },
  { id: "yearly", name: "crm.quotes.period.yearly" },
];

const claveDe = (nombre: string) =>
  nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `plantilla-${Date.now()}`;

const useGuardarConfiguracion = () => {
  const config = useConfigurationContext();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const updateConfiguration = useConfigurationUpdater();
  const notify = useNotify();

  return async (cambios: Partial<ConfigurationContextValue>) => {
    try {
      const guardada = await dataProvider.updateConfiguration({
        ...config,
        ...cambios,
      });
      updateConfiguration(guardada);
      notify("crm.quotes.settings.saved", { type: "info" });
      return true;
    } catch {
      notify("crm.quotes.settings.save_error", { type: "error" });
      return false;
    }
  };
};

export const CotizacionesPage = () => {
  const translate = useTranslate();
  const config = useConfigurationContext();
  const guardar = useGuardarConfiguracion();
  const [editando, setEditando] = useState<QuoteTemplate | "nueva" | null>(
    null,
  );

  const guardarEmisor = async (valores: Record<string, unknown>) => {
    const emisor: QuoteIssuer = {
      name: String(valores.name ?? ""),
      tax_id: String(valores.tax_id ?? "") || undefined,
      address: String(valores.address ?? "") || undefined,
      email: String(valores.email ?? "") || undefined,
      phone: String(valores.phone ?? "") || undefined,
      logo_url: String(valores.logo_url ?? "") || undefined,
    };
    await guardar({
      quoteIssuer: emisor,
      quoteTaxRate: Number(valores.tax_rate) || 0,
    });
  };

  const guardarPlantilla = async (plantilla: QuoteTemplate) => {
    const restantes = config.quoteTemplates.filter(
      (p) => p.key !== plantilla.key,
    );
    const ok = await guardar({ quoteTemplates: [...restantes, plantilla] });
    if (ok) setEditando(null);
  };

  const borrarPlantilla = async (clave: string) => {
    await guardar({
      quoteTemplates: config.quoteTemplates.filter((p) => p.key !== clave),
    });
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.quotes.settings.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.quotes.settings.intro")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.quotes.settings.issuer")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {translate("crm.quotes.settings.issuer_help")}
          </p>
          <Form
            onSubmit={guardarEmisor}
            defaultValues={{
              ...config.quoteIssuer,
              tax_rate: config.quoteTaxRate,
            }}
          >
            <div className="flex flex-col gap-3">
              <TextInput
                source="name"
                label="crm.quotes.settings.issuer_name"
                helperText={false}
                validate={required()}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  source="tax_id"
                  label="crm.quotes.settings.issuer_tax_id"
                  helperText={false}
                />
                <NumberInput
                  source="tax_rate"
                  label="crm.quotes.settings.tax_rate"
                  helperText={false}
                  min={0}
                />
              </div>
              <TextInput
                source="address"
                label="crm.quotes.settings.issuer_address"
                helperText={false}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  source="email"
                  label="crm.quotes.settings.issuer_email"
                  helperText={false}
                />
                <TextInput
                  source="phone"
                  label="crm.quotes.settings.issuer_phone"
                  helperText={false}
                />
              </div>
              <TextInput
                source="logo_url"
                label="crm.quotes.settings.issuer_logo"
                helperText={false}
              />
              <div className="flex justify-end">
                <Button type="submit">{translate("ra.action.save")}</Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{translate("crm.quotes.settings.templates")}</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditando("nueva")}
          >
            <Plus className="mr-1 h-4 w-4" />
            {translate("crm.quotes.settings.new_template")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {translate("crm.quotes.settings.templates_help")}
          </p>
          {config.quoteTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {translate("crm.quotes.settings.no_templates")}
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {config.quoteTemplates.map((plantilla) => (
                <li
                  key={plantilla.key}
                  className="flex items-center gap-3 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{plantilla.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {plantilla.title} · {plantilla.items.length}{" "}
                      {translate("crm.quotes.fields.items").toLowerCase()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={translate("ra.action.edit")}
                    onClick={() => setEditando(plantilla)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={translate(
                      "crm.quotes.settings.delete_template",
                    )}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => borrarPlantilla(plantilla.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editando && (
        <EditorDePlantilla
          plantilla={editando === "nueva" ? null : editando}
          iva={config.quoteTaxRate}
          onClose={() => setEditando(null)}
          onSave={guardarPlantilla}
        />
      )}
    </div>
  );
};

CotizacionesPage.path = "/cotizaciones";

const EditorDePlantilla = ({
  plantilla,
  iva,
  onClose,
  onSave,
}: {
  plantilla: QuoteTemplate | null;
  iva: number;
  onClose: () => void;
  onSave: (plantilla: QuoteTemplate) => Promise<void>;
}) => {
  const translate = useTranslate();

  const enviar = async (valores: Record<string, unknown>) => {
    const items = ((valores.items as QuoteTemplate["items"]) ?? []).filter(
      (linea) => (linea.description ?? "").trim(),
    );
    await onSave({
      key: plantilla?.key ?? claveDe(String(valores.name ?? "")),
      name: String(valores.name ?? ""),
      title: String(valores.title ?? ""),
      notes: String(valores.notes ?? "") || undefined,
      contract_period:
        (valores.contract_period as QuoteTemplate["contract_period"]) || null,
      valid_days: Number(valores.valid_days) || 30,
      items: items.map((linea) => ({
        description: linea.description,
        quantity: Number(linea.quantity) || 1,
        unit_price: Number(linea.unit_price) || 0,
        discount_pct: Number(linea.discount_pct) || 0,
        tax_rate: Number(linea.tax_rate ?? iva),
      })),
    });
  };

  return (
    <Dialog open onOpenChange={(valor) => !valor && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {plantilla?.name ?? translate("crm.quotes.settings.new_template")}
          </DialogTitle>
        </DialogHeader>
        <Form
          onSubmit={enviar}
          defaultValues={
            (plantilla ?? {
              name: "",
              title: "",
              valid_days: 30,
              contract_period: "",
              notes: "",
              items: [
                {
                  description: "",
                  quantity: 1,
                  unit_price: 0,
                  discount_pct: 0,
                  tax_rate: iva,
                },
              ],
            }) as Record<string, unknown>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                source="name"
                label="crm.quotes.settings.template_name"
                validate={required()}
                helperText={false}
              />
              <NumberInput
                source="valid_days"
                label="crm.quotes.settings.template_valid_days"
                helperText={false}
                min={1}
              />
            </div>
            <TextInput
              source="title"
              label="crm.quotes.fields.title"
              validate={required()}
              helperText={false}
            />
            <SelectInput
              source="contract_period"
              label="crm.quotes.fields.contract_period"
              choices={PERIODOS}
              helperText="crm.quotes.fields.contract_period_help"
            />
            <ArrayInput source="items" label="crm.quotes.fields.items">
              <SimpleFormIterator inline disableReordering>
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
              <Button type="submit">{translate("ra.action.save")}</Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
