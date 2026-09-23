import { Sparkles } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import { llamarApi } from "./llamarApi";
import { MODELOS_POR_PROVEEDOR } from "./modelosDeIa";

/**
 * Ajustes → Inteligencia artificial.
 *
 * Dos caminos, y el primero es el normal:
 *
 * - **La IA incluida**: nuestra clave, con el modelo económico que fijamos
 *   nosotros. El cliente no contrata nada ni elige modelo — es lo que hace
 *   que salga a cuenta regalarla.
 * - **Su propia cuenta**: elige proveedor, pega su clave y entonces sí elige
 *   el modelo que quiera. Lo paga él.
 */

const PROVEEDORES = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
] as const;

const nombreDelProveedor = (valor: string) =>
  PROVEEDORES.find((item) => item.value === valor)?.label ?? valor;

/** Una opción seleccionable: recuadro con su explicación debajo. */
const opcion = (elegida: boolean) =>
  [
    "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm transition-colors",
    elegida ? "border-primary bg-primary/5" : "hover:bg-accent",
  ].join(" ");

interface ConfiguracionDeIa {
  provider: string | null;
  model: string | null;
  modeloPorDefecto: string | null;
  active: boolean;
  tieneClave: boolean;
  hayIncluida: boolean;
  clavePropia: boolean;
  modeloIncluido: string | null;
  proveedorIncluido: string | null;
}

export const IaPage = () => {
  const translate = useTranslate();
  const notify = useNotify();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState<ConfiguracionDeIa | null>(null);

  const [propia, setPropia] = useState(false);
  const [proveedor, setProveedor] = useState<string>("openai");
  const [clave, setClave] = useState("");
  const [modelo, setModelo] = useState("");
  const [activo, setActivo] = useState(true);
  // "Otro" abre el campo libre: la lista de modelos es de conveniencia, no
  // una restricción, y los proveedores sacan modelos nuevos a menudo.
  const [modeloAMano, setModeloAMano] = useState(false);

  const aplicar = useCallback((datos: ConfiguracionDeIa) => {
    setConfig(datos);
    setPropia(datos.clavePropia || !datos.hayIncluida);
    setProveedor(datos.provider ?? "openai");
    setModelo(datos.clavePropia ? (datos.model ?? "") : "");
    setActivo(datos.active);
    setClave("");
    const conocidos = MODELOS_POR_PROVEEDOR[datos.provider ?? ""] ?? [];
    setModeloAMano(
      datos.clavePropia &&
        Boolean(datos.model) &&
        !conocidos.some((m) => m.value === datos.model),
    );
  }, []);

  const cargar = useCallback(async () => {
    try {
      aplicar(await llamarApi<ConfiguracionDeIa>("/api/ia/configuracion"));
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setCargando(false);
    }
  }, [aplicar, notify]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async () => {
    setGuardando(true);
    try {
      const datos = await llamarApi<ConfiguracionDeIa>(
        "/api/ia/configuracion",
        {
          method: "PUT",
          body: JSON.stringify(
            propia
              ? {
                  provider: proveedor,
                  apiKey: clave || undefined,
                  model: modelo,
                  active: activo,
                }
              : { usarIncluida: true, active: activo },
          ),
        },
      );
      aplicar(datos);
      notify("crm.ai.saved", { type: "info" });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando || !config) return null;

  const sinIaEnNingunSitio = !config.tieneClave && !clave;

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{translate("crm.ai.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.ai.intro")}
        </p>
      </div>

      {sinIaEnNingunSitio && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {translate("crm.ai.not_configured")}
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          {config.hayIncluida && (
            <div className="space-y-1.5">
              <Label>{translate("crm.ai.account")}</Label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setPropia(false)}
                  className={opcion(!propia)}
                >
                  <span className="font-medium">
                    {translate("crm.ai.account_included")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {translate("crm.ai.account_included_help", {
                      provider: nombreDelProveedor(
                        config.proveedorIncluido ?? "",
                      ),
                      model: config.modeloIncluido ?? "",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPropia(true)}
                  className={opcion(propia)}
                >
                  <span className="font-medium">
                    {translate("crm.ai.account_own")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {translate("crm.ai.account_own_help")}
                  </span>
                </button>
              </div>
            </div>
          )}

          {propia && (
            <>
              <div className="space-y-1.5">
                <Label>{translate("crm.ai.provider")}</Label>
                <Select value={proveedor} onValueChange={setProveedor}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVEEDORES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clave-ia">{translate("crm.ai.api_key")}</Label>
                <Input
                  id="clave-ia"
                  type="password"
                  autoComplete="off"
                  value={clave}
                  placeholder={
                    config.clavePropia
                      ? translate("crm.ai.api_key_saved")
                      : translate("crm.ai.api_key_placeholder")
                  }
                  onChange={(evento) => setClave(evento.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {translate("crm.ai.api_key_help")}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>{translate("crm.ai.model")}</Label>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModelo("");
                      setModeloAMano(false);
                    }}
                    className={opcion(!modelo && !modeloAMano)}
                  >
                    <span className="font-medium">
                      {translate("crm.ai.model_default")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {translate("crm.ai.model_default_help")}
                    </span>
                  </button>

                  {(MODELOS_POR_PROVEEDOR[proveedor] ?? []).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setModelo(item.value);
                        setModeloAMano(false);
                      }}
                      className={opcion(!modeloAMano && modelo === item.value)}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.descripcion}
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setModelo("");
                      setModeloAMano(true);
                    }}
                    className={opcion(modeloAMano)}
                  >
                    <span className="font-medium">
                      {translate("crm.ai.model_other")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {translate("crm.ai.model_other_help")}
                    </span>
                  </button>
                </div>

                {modeloAMano && (
                  <Input
                    id="modelo-ia"
                    value={modelo}
                    placeholder="p. ej. gpt-4.1-mini"
                    onChange={(evento) => setModelo(evento.target.value)}
                  />
                )}
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={activo}
              onCheckedChange={setActivo}
              aria-label={translate("crm.ai.active")}
            />
            <span>{translate("crm.ai.active")}</span>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={guardar}
              disabled={guardando || (propia && !clave && !config.clavePropia)}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {translate("ra.action.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

IaPage.path = "/inteligencia-artificial";
