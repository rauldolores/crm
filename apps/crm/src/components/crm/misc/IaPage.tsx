import { Sparkles } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { llamarApi } from "./llamarApi";

/**
 * Ajustes → Inteligencia artificial: con qué proveedor se generan las
 * plantillas de correo.
 *
 * Misma forma que la pantalla de correo saliente y por el mismo motivo: la
 * clave es un secreto y no puede vivir en `configuration.config`, que se
 * sirve entero a cualquier miembro de la organización. Habla con
 * /api/ia/configuracion, que exige ser administrador y nunca devuelve la
 * clave — por eso el campo aparece siempre vacío aunque haya una guardada.
 */

const PROVEEDORES = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
] as const;

interface ConfiguracionDeIa {
  provider: string | null;
  model: string | null;
  modeloPorDefecto: string | null;
  active: boolean;
  tieneClave: boolean;
}

export const IaPage = () => {
  const translate = useTranslate();
  const notify = useNotify();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState<ConfiguracionDeIa | null>(null);

  const [proveedor, setProveedor] = useState<string>("claude");
  const [clave, setClave] = useState("");
  const [modelo, setModelo] = useState("");
  const [activo, setActivo] = useState(true);

  const aplicar = useCallback((datos: ConfiguracionDeIa) => {
    setConfig(datos);
    setProveedor(datos.provider ?? "claude");
    setModelo(datos.model ?? "");
    setActivo(datos.active);
    setClave("");
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
          body: JSON.stringify({
            provider: proveedor,
            apiKey: clave,
            model: modelo,
            active: activo,
          }),
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

  if (cargando) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{translate("crm.ai.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.ai.intro")}
        </p>
      </div>

      {!config?.tieneClave && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {translate("crm.ai.not_configured")}
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <div className="space-y-1.5">
            <Label>{translate("crm.ai.provider")}</Label>
            <div className="flex flex-wrap gap-2">
              {PROVEEDORES.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={proveedor === item.value ? "default" : "outline"}
                  onClick={() => setProveedor(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clave-ia">{translate("crm.ai.api_key")}</Label>
            <Input
              id="clave-ia"
              type="password"
              autoComplete="off"
              value={clave}
              placeholder={
                config?.tieneClave
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
            <Label htmlFor="modelo-ia">{translate("crm.ai.model")}</Label>
            <Input
              id="modelo-ia"
              value={modelo}
              placeholder={config?.modeloPorDefecto ?? ""}
              onChange={(evento) => setModelo(evento.target.value)}
            />
            {config?.modeloPorDefecto && (
              <p className="text-xs text-muted-foreground">
                {translate("crm.ai.model_help", {
                  modelo: config.modeloPorDefecto,
                })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={activo}
              onCheckedChange={setActivo}
              aria-label={translate("crm.ai.active")}
            />
            <span>{translate("crm.ai.active")}</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={guardar} disabled={guardando}>
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
