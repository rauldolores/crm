import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useDataProvider, useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

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
import {
  FAMILIAS,
  campoSecreto,
  proveedorPorClave,
  proveedoresDe,
  type CampoDeConector,
  type FamiliaDeConector,
  type ProveedorDeConector,
} from "@/lib/conectores/catalogo";

import { llamarApi } from "../misc/llamarApi";
import { RelativeDate } from "../misc/RelativeDate";
import type { CrmDataProvider } from "../providers/types";
import {
  useConfigurationContext,
  useConfigurationUpdater,
} from "../root/ConfigurationContext";

/**
 * Ajustes → Conectores: de dónde salen los productos y quién factura. Una
 * familia, un proveedor conectado. La credencial se prueba antes de
 * guardarse y nunca vuelve al navegador (el campo siempre aparece vacío).
 *
 * Pensada para quien no es técnico: cada proveedor trae los pasos para
 * conseguir su credencial, en el orden en que se hacen, junto al formulario.
 */

interface ConectorVisible {
  id: number;
  family: FamiliaDeConector;
  provider: string;
  settings: Record<string, string>;
  status: "connected" | "error";
  last_error: string | null;
  last_checked_at: string | null;
  last_synced_at: string | null;
}

export const ConectoresPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [conectores, setConectores] = useState<ConectorVisible[] | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { conectores } = await llamarApi<{ conectores: ConectorVisible[] }>(
        "/api/conectores",
      );
      setConectores(conectores);
    } catch (error) {
      notify((error as Error).message, { type: "error" });
      setConectores([]);
    }
  }, [notify]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="max-w-4xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.connectors.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.connectors.intro")}
        </p>
      </div>

      {conectores === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        FAMILIAS.map((familia) => (
          <Familia
            key={familia.key}
            familia={familia.key}
            nombre={familia.name}
            descripcion={familia.description}
            conector={conectores.find((c) => c.family === familia.key) ?? null}
            alCambiar={cargar}
          />
        ))
      )}
    </div>
  );
};

ConectoresPage.path = "/modulos/conectores";

const Familia = ({
  familia,
  nombre,
  descripcion,
  conector,
  alCambiar,
}: {
  familia: FamiliaDeConector;
  nombre: string;
  descripcion: string;
  conector: ConectorVisible | null;
  alCambiar: () => Promise<void>;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const config = useConfigurationContext();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const updateConfiguration = useConfigurationUpdater();
  const [editando, setEditando] = useState<ProveedorDeConector | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const proveedores = proveedoresDe(familia);
  const actual = conector ? proveedorPorClave(conector.provider) : undefined;

  /** El módulo aparece en el menú cuando hay proveedor, y se va con él. */
  const activarModulo = async (activo: boolean) => {
    if ((config.modules[familia]?.active ?? false) === activo) return;
    try {
      const guardada = await dataProvider.updateConfiguration({
        ...config,
        modules: {
          ...config.modules,
          [familia]: { ...config.modules[familia], active: activo },
        },
      });
      updateConfiguration(guardada);
    } catch {
      // El conector ya quedó guardado; el módulo se puede prender en Módulos.
    }
  };

  const desconectar = async () => {
    if (!window.confirm(translate("crm.connectors.disconnect_confirm"))) return;
    setOcupado(true);
    try {
      await llamarApi(`/api/conectores/${familia}`, { method: "DELETE" });
      await activarModulo(false);
      await alCambiar();
      notify("crm.connectors.disconnected", { type: "info" });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setOcupado(false);
    }
  };

  const sincronizar = async () => {
    setOcupado(true);
    try {
      const { total } = await llamarApi<{ total: number }>(
        "/api/conectores/productos/sincronizar",
        { method: "POST" },
      );
      await alCambiar();
      notify(translate("crm.connectors.synced", { smart_count: total }), {
        type: "info",
      });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-muted-foreground" />
          {nombre}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {conector && actual && !editando ? (
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              {conector.status === "connected" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <TriangleAlert className="h-5 w-5 text-amber-600" />
              )}
              <span className="font-medium">{actual.name}</span>
              <span className="text-sm text-muted-foreground">
                {conector.status === "connected"
                  ? translate("crm.connectors.status.connected")
                  : translate("crm.connectors.status.error")}
              </span>
            </div>
            {conector.last_error && (
              <p className="text-sm text-amber-700">{conector.last_error}</p>
            )}
            <ResumenDeAjustes proveedor={actual} ajustes={conector.settings} />
            {familia === "products" && (
              <p className="text-sm text-muted-foreground">
                {conector.last_synced_at ? (
                  <>
                    {translate("crm.connectors.last_sync")}{" "}
                    <RelativeDate date={conector.last_synced_at} />
                    {" · "}
                    <Link to="/products">
                      {translate("crm.connectors.see_products")}
                    </Link>
                  </>
                ) : (
                  translate("crm.connectors.never_synced")
                )}
              </p>
            )}
            {familia === "invoicing" && (
              <p className="text-sm text-muted-foreground">
                {translate("crm.connectors.invoicing_hint")}{" "}
                <Link to="/invoices">
                  {translate("crm.connectors.see_invoices")}
                </Link>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {familia === "products" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={sincronizar}
                  disabled={ocupado}
                >
                  {ocupado ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {translate("crm.connectors.sync_now")}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditando(actual)}
                disabled={ocupado}
              >
                {translate("crm.connectors.edit")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={desconectar}
                disabled={ocupado}
              >
                {translate("crm.connectors.disconnect")}
              </Button>
            </div>
          </div>
        ) : editando ? (
          <FormularioDeConector
            familia={familia}
            proveedor={editando}
            conector={conector?.provider === editando.key ? conector : null}
            onCancel={() => setEditando(null)}
            onSaved={async () => {
              setEditando(null);
              await activarModulo(true);
              await alCambiar();
            }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {proveedores.map((proveedor) => (
              <button
                key={proveedor.key}
                type="button"
                onClick={() => setEditando(proveedor)}
                className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:border-primary"
              >
                <span className="font-medium">{proveedor.name}</span>
                <span className="text-sm text-muted-foreground">
                  {proveedor.description}
                </span>
                <span className="mt-2 text-sm text-primary">
                  {translate("crm.connectors.connect")} →
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/** Los ajustes no secretos tal como quedaron, para reconocerlos de un vistazo. */
const ResumenDeAjustes = ({
  proveedor,
  ajustes,
}: {
  proveedor: ProveedorDeConector;
  ajustes: Record<string, string>;
}) => {
  const visibles = proveedor.fields.filter(
    (campo) => campo.type !== "secret" && ajustes[campo.key],
  );
  if (visibles.length === 0) return null;
  return (
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      {visibles.map((campo) => (
        <div key={campo.key} className="flex gap-2">
          <dt className="text-muted-foreground">{campo.label}:</dt>
          <dd className="truncate">
            {campo.options?.find((o) => o.value === ajustes[campo.key])
              ?.label ?? ajustes[campo.key]}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const FormularioDeConector = ({
  familia,
  proveedor,
  conector,
  onCancel,
  onSaved,
}: {
  familia: FamiliaDeConector;
  proveedor: ProveedorDeConector;
  conector: ConectorVisible | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      proveedor.fields.map((campo) => [
        campo.key,
        campo.type === "secret"
          ? ""
          : (conector?.settings[campo.key] ?? campo.defaultValue ?? ""),
      ]),
    ),
  );
  const [guardando, setGuardando] = useState(false);
  const secreto = campoSecreto(proveedor);
  const tieneSecreto = Boolean(conector);

  const guardar = async () => {
    setGuardando(true);
    try {
      const settings = Object.fromEntries(
        proveedor.fields
          .filter((campo) => campo.type !== "secret")
          .map((campo) => [campo.key, valores[campo.key] ?? ""]),
      );
      const { detalle, sincronizacion } = await llamarApi<{
        detalle: string;
        sincronizacion: { total: number } | null;
      }>(`/api/conectores/${familia}`, {
        method: "PUT",
        body: JSON.stringify({
          provider: proveedor.key,
          settings,
          secret: secreto ? valores[secreto.key] || null : null,
        }),
      });
      notify(
        sincronizacion
          ? `${detalle} ${translate("crm.connectors.synced", {
              smart_count: sincronizacion.total,
            })}`
          : detalle,
        { type: "info", autoHideDuration: 8000 },
      );
      await onSaved();
    } catch (error) {
      notify((error as Error).message, {
        type: "error",
        autoHideDuration: 10000,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">
            {translate("crm.connectors.connect_with", { name: proveedor.name })}
          </p>
          <a
            href={proveedor.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {translate("crm.connectors.open_site")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        {proveedor.fields.map((campo) => (
          <Campo
            key={campo.key}
            campo={campo}
            valor={valores[campo.key] ?? ""}
            tieneSecreto={tieneSecreto}
            onChange={(valor) =>
              setValores((previos) => ({ ...previos, [campo.key]: valor }))
            }
          />
        ))}
        <div className="flex gap-2">
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plug className="h-4 w-4" />
            )}
            {translate("crm.connectors.test_and_save")}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={guardando}>
            {translate("ra.action.cancel")}
          </Button>
        </div>
      </div>
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="mb-2 text-sm font-medium">
          {translate("crm.connectors.steps_title", { name: proveedor.name })}
        </p>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
          {proveedor.steps.map((paso, indice) => (
            <li key={indice}>{paso}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

const Campo = ({
  campo,
  valor,
  tieneSecreto,
  onChange,
}: {
  campo: CampoDeConector;
  valor: string;
  tieneSecreto: boolean;
  onChange: (valor: string) => void;
}) => {
  const translate = useTranslate();
  const id = `conector-${campo.key}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{campo.label}</Label>
      {campo.type === "select" ? (
        <Select value={valor} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(campo.options ?? []).map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={campo.type === "secret" ? "password" : "text"}
          autoComplete="off"
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          placeholder={
            campo.type === "secret" && tieneSecreto
              ? translate("crm.connectors.secret_kept")
              : campo.placeholder
          }
        />
      )}
      {campo.help && (
        <p className="text-xs text-muted-foreground">{campo.help}</p>
      )}
    </div>
  );
};
