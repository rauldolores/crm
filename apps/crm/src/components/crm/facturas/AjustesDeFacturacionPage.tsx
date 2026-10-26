import { CheckCircle2, Copy, Loader2, TriangleAlert } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FORMAS_DE_PAGO } from "@/lib/conectores/catalogo";

import { ConectoresPage } from "../conectores/ConectoresPage";
import { llamarApi } from "../misc/llamarApi";
import type { BillingSettings } from "../types";
import { PageHero } from "../misc/Patrones";

/**
 * Ajustes → Facturación: cómo se facturan solos los contratos y los cobros
 * con tarjeta. Una tarjeta con los ajustes generales y una por cada
 * producto que aparezca en los contratos (que usa los generales hasta que
 * alguien le da los suyos). Guardar exige ser administrador (lo comprueba
 * /api/facturacion/ajustes).
 */

interface RespuestaDeAjustes {
  ajustes: BillingSettings[];
  productos: { slug: string; nombre: string }[];
  conector: {
    proveedor: string;
    estado: string;
    aviso_configurado: boolean;
  } | null;
  url_del_aviso: string;
}

const GENERAL = "*";

const POR_OMISION: BillingSettings = {
  product_key: GENERAL,
  clave_prod_serv: "81112106",
  clave_unidad: "E48",
  concept_template: "{producto} · {plan} · {periodo}",
  tax_rate: 0.16,
  prices_include_tax: false,
  metodo_pago_transferencia: "PPD",
  forma_pago_transferencia: "99",
  forma_pago_tarjeta: "04",
  days_before: 15,
  mode: "review",
  active: true,
};

const NOMBRES_DE_PROVEEDOR: Record<string, string> = { faqturia: "Faqturia" };

export const AjustesDeFacturacionPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [datos, setDatos] = useState<RespuestaDeAjustes | null>(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await llamarApi<RespuestaDeAjustes>("/api/facturacion/ajustes"));
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    }
  }, [notify]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!datos) {
    return (
      <div className="mt-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const general =
    datos.ajustes.find((a) => a.product_key === GENERAL) ?? POR_OMISION;

  return (
    <div className="mt-8 mb-16 flex flex-col gap-6">
      <PageHero
        badge={translate("crm.settings.title")}
        title={translate("crm.customer_billing.settings.title")}
        description={translate("crm.customer_billing.settings.intro")}
      />

      <div className="flex items-start gap-2 rounded-lg border p-4 text-sm">
        {datos.conector ? (
          <>
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>
              {translate("crm.customer_billing.settings.connector_ok", {
                name:
                  NOMBRES_DE_PROVEEDOR[datos.conector.proveedor] ??
                  datos.conector.proveedor,
              })}
            </span>
          </>
        ) : (
          <>
            <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" />
            <span>
              {translate("crm.customer_billing.settings.connector_missing")}{" "}
              <Link to={ConectoresPage.path}>
                {translate("crm.customer_billing.settings.connector_link")}
              </Link>
            </span>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {translate("crm.customer_billing.settings.general")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {translate("crm.customer_billing.settings.general_help")}
          </p>
        </CardHeader>
        <CardContent>
          <FormularioDeAjustes inicial={general} alGuardar={cargar} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {translate("crm.customer_billing.settings.products")}
        </h2>
        {!datos.productos.length && (
          <p className="text-sm text-muted-foreground">
            {translate("crm.customer_billing.settings.no_products")}
          </p>
        )}
        {datos.productos.map((producto) => (
          <AjustesDeProducto
            key={producto.slug}
            producto={producto}
            propios={datos.ajustes.find((a) => a.product_key === producto.slug)}
            general={general}
            alCambiar={cargar}
          />
        ))}
      </div>

      {datos.conector?.proveedor === "faqturia" && (
        <AvisoDeFaqturia
          url={datos.url_del_aviso}
          configurado={datos.conector.aviso_configurado}
          alCambiar={cargar}
        />
      )}
    </div>
  );
};

AjustesDeFacturacionPage.path = "/modulos/facturacion";

const AjustesDeProducto = ({
  producto,
  propios,
  general,
  alCambiar,
}: {
  producto: { slug: string; nombre: string };
  propios?: BillingSettings;
  general: BillingSettings;
  alCambiar: () => Promise<void>;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [personalizando, setPersonalizando] = useState(false);

  const quitar = async () => {
    if (
      !window.confirm(
        translate("crm.customer_billing.settings.remove_custom_confirm"),
      )
    )
      return;
    try {
      await llamarApi(
        `/api/facturacion/ajustes?producto=${encodeURIComponent(producto.slug)}`,
        { method: "DELETE" },
      );
      setPersonalizando(false);
      await alCambiar();
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span>
            {producto.nombre}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {producto.slug}
            </span>
          </span>
          {propios ? (
            <Button size="sm" variant="ghost" onClick={quitar}>
              {translate("crm.customer_billing.settings.remove_custom")}
            </Button>
          ) : (
            !personalizando && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPersonalizando(true)}
              >
                {translate("crm.customer_billing.settings.customize")}
              </Button>
            )
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {propios || personalizando ? (
          <FormularioDeAjustes
            inicial={propios ?? { ...general, product_key: producto.slug }}
            alGuardar={async () => {
              setPersonalizando(false);
              await alCambiar();
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {translate("crm.customer_billing.settings.product_uses_general")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const FormularioDeAjustes = ({
  inicial,
  alGuardar,
}: {
  inicial: BillingSettings;
  alGuardar: () => Promise<void>;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [valores, setValores] = useState<BillingSettings>(inicial);
  const [iva, setIva] = useState(
    String(Math.round(inicial.tax_rate * 10000) / 100),
  );
  const [guardando, setGuardando] = useState(false);
  const id = (campo: string) => `ajustes-${inicial.product_key}-${campo}`;
  const cambiar = <K extends keyof BillingSettings>(
    campo: K,
    valor: BillingSettings[K],
  ) => setValores((previos) => ({ ...previos, [campo]: valor }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await llamarApi("/api/facturacion/ajustes", {
        method: "PUT",
        body: JSON.stringify({
          ajustes: {
            ...valores,
            tax_rate: Math.round(Number(iva.replace(",", ".")) * 100) / 10000,
            days_before: Math.trunc(Number(valores.days_before)),
          },
        }),
      });
      notify("crm.customer_billing.settings.saved", { type: "info" });
      await alGuardar();
    } catch (error) {
      notify((error as Error).message, {
        type: "error",
        autoHideDuration: 10000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const etiqueta = (campo: string) =>
    translate(`crm.customer_billing.settings.fields.${campo}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id={id("clave")}
          etiqueta={etiqueta("clave_prod_serv")}
          ayuda={etiqueta("clave_prod_serv_help")}
        >
          <Input
            id={id("clave")}
            inputMode="numeric"
            maxLength={8}
            value={valores.clave_prod_serv}
            onChange={(e) => cambiar("clave_prod_serv", e.target.value.trim())}
          />
        </Campo>
        <Campo
          id={id("unidad")}
          etiqueta={etiqueta("clave_unidad")}
          ayuda={etiqueta("clave_unidad_help")}
        >
          <Input
            id={id("unidad")}
            maxLength={5}
            value={valores.clave_unidad}
            onChange={(e) =>
              cambiar("clave_unidad", e.target.value.trim().toUpperCase())
            }
          />
        </Campo>
      </div>

      <Campo
        id={id("concepto")}
        etiqueta={etiqueta("concept_template")}
        ayuda={etiqueta("concept_template_help")}
      >
        <Input
          id={id("concepto")}
          maxLength={300}
          value={valores.concept_template}
          onChange={(e) => cambiar("concept_template", e.target.value)}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id={id("iva")} etiqueta={etiqueta("tax_rate")}>
          <Input
            id={id("iva")}
            inputMode="decimal"
            value={iva}
            onChange={(e) => setIva(e.target.value)}
          />
        </Campo>
        <Campo
          id={id("dias")}
          etiqueta={etiqueta("days_before")}
          ayuda={etiqueta("days_before_help")}
        >
          <Input
            id={id("dias")}
            type="number"
            min={0}
            max={90}
            value={valores.days_before}
            onChange={(e) => cambiar("days_before", Number(e.target.value))}
          />
        </Campo>
      </div>

      <Interruptor
        id={id("iva-incluido")}
        etiqueta={etiqueta("prices_include_tax")}
        ayuda={etiqueta("prices_include_tax_help")}
        valor={valores.prices_include_tax}
        alCambiar={(v) => cambiar("prices_include_tax", v)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          id={id("metodo")}
          etiqueta={etiqueta("metodo_pago_transferencia")}
        >
          <Select
            value={valores.metodo_pago_transferencia}
            onValueChange={(v) =>
              cambiar("metodo_pago_transferencia", v as "PPD" | "PUE")
            }
          >
            <SelectTrigger id={id("metodo")} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["PPD", "PUE"] as const).map((metodo) => (
                <SelectItem key={metodo} value={metodo}>
                  {translate(`crm.customer_billing.settings.methods.${metodo}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo
          id={id("forma-transferencia")}
          etiqueta={etiqueta("forma_pago_transferencia")}
        >
          <SelectorDeForma
            id={id("forma-transferencia")}
            valor={valores.forma_pago_transferencia}
            alCambiar={(v) => cambiar("forma_pago_transferencia", v)}
          />
        </Campo>
        <Campo
          id={id("forma-tarjeta")}
          etiqueta={etiqueta("forma_pago_tarjeta")}
        >
          <SelectorDeForma
            id={id("forma-tarjeta")}
            valor={valores.forma_pago_tarjeta}
            alCambiar={(v) => cambiar("forma_pago_tarjeta", v)}
          />
        </Campo>
      </div>

      <Campo
        id={id("modo")}
        etiqueta={etiqueta("mode")}
        ayuda={etiqueta("mode_help")}
      >
        <Select
          value={valores.mode}
          onValueChange={(v) => cambiar("mode", v as "review" | "auto")}
        >
          <SelectTrigger id={id("modo")} className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="review">{etiqueta("mode_review")}</SelectItem>
            <SelectItem value="auto">{etiqueta("mode_auto")}</SelectItem>
          </SelectContent>
        </Select>
      </Campo>

      <Interruptor
        id={id("activo")}
        etiqueta={etiqueta("active")}
        ayuda={etiqueta("active_help")}
        valor={valores.active}
        alCambiar={(v) => cambiar("active", v)}
      />

      <div>
        <Button onClick={guardar} disabled={guardando}>
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {translate("ra.action.save")}
        </Button>
      </div>
    </div>
  );
};

const Campo = ({
  id,
  etiqueta,
  ayuda,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{etiqueta}</Label>
    {children}
    {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
  </div>
);

const Interruptor = ({
  id,
  etiqueta,
  ayuda,
  valor,
  alCambiar,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor: boolean;
  alCambiar: (valor: boolean) => void;
}) => (
  <div className="flex items-start gap-3">
    <Switch
      id={id}
      checked={valor}
      onCheckedChange={alCambiar}
      className="mt-0.5"
    />
    <div>
      <Label htmlFor={id}>{etiqueta}</Label>
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  </div>
);

const SelectorDeForma = ({
  id,
  valor,
  alCambiar,
}: {
  id: string;
  valor: string;
  alCambiar: (valor: string) => void;
}) => (
  <Select value={valor} onValueChange={alCambiar}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {FORMAS_DE_PAGO.map((forma) => (
        <SelectItem key={forma.value} value={forma.value}>
          {forma.value} · {forma.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const AvisoDeFaqturia = ({
  url,
  configurado,
  alCambiar,
}: {
  url: string;
  configurado: boolean;
  alCambiar: () => Promise<void>;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [secreto, setSecreto] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await llamarApi("/api/facturacion/ajustes", {
        method: "PUT",
        body: JSON.stringify({ secreto_del_aviso: secreto.trim() }),
      });
      setSecreto("");
      notify("crm.customer_billing.settings.webhook.saved", { type: "info" });
      await alCambiar();
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify("crm.customer_billing.settings.webhook.copied", { type: "info" });
    } catch {
      // Sin permiso para el portapapeles: la dirección queda a la vista.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {translate("crm.customer_billing.settings.webhook.title")}
          <Badge variant={configurado ? "default" : "outline"}>
            {translate(
              configurado
                ? "crm.customer_billing.settings.webhook.configured"
                : "crm.customer_billing.settings.webhook.not_configured",
            )}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {translate("crm.customer_billing.settings.webhook.intro")}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="aviso-url">
            {translate("crm.customer_billing.settings.webhook.url")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="aviso-url"
              readOnly
              value={url}
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copiar}
              aria-label={translate(
                "crm.customer_billing.settings.webhook.copy",
              )}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="aviso-secreto">
            {translate("crm.customer_billing.settings.webhook.secret")}
          </Label>
          <Input
            id="aviso-secreto"
            type="password"
            autoComplete="off"
            value={secreto}
            onChange={(e) => setSecreto(e.target.value)}
            placeholder={
              configurado
                ? translate("crm.customer_billing.settings.webhook.secret_kept")
                : translate(
                    "crm.customer_billing.settings.webhook.secret_placeholder",
                  )
            }
          />
        </div>
        <div>
          <Button onClick={guardar} disabled={guardando || !secreto.trim()}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {translate("crm.customer_billing.settings.webhook.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
