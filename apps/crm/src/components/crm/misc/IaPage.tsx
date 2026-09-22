import { Sparkles } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { llamarApi } from "./llamarApi";
import { MODELOS_POR_PROVEEDOR } from "./modelosDeIa";

/**
 * Ajustes → Inteligencia artificial.
 *
 * La clave la pone quien instala el CRM (variable de entorno AI_API_KEY), no
 * el cliente: pedirle a una pyme que abra cuenta en Anthropic o en OpenAI y
 * pegue una clave para poder redactar un correo era pedirle demasiado. Aquí
 * solo se enciende o se apaga, y se elige modelo si se quiere otro.
 *
 * Una instalación en servidores del cliente que configuró su clave a mano
 * antes de esto sigue funcionando con ella (ver configuracion.ts), pero aquí
 * ya no se pide ni se cambia: se pone en el servidor.
 */

const PROVEEDORES = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
] as const;

const nombreDelProveedor = (valor: string) =>
  PROVEEDORES.find((item) => item.value === valor)?.label ?? valor;

/** Una opción de modelo: recuadro seleccionable con su explicación debajo. */
const opcionDeModelo = (elegida: boolean) =>
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
  /** Funciona con la clave del despliegue: aquí no se pide ninguna. */
  incluida: boolean;
}

export const IaPage = () => {
  const translate = useTranslate();
  const notify = useNotify();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState<ConfiguracionDeIa | null>(null);

  const [proveedor, setProveedor] = useState<string>("claude");
  const [modelo, setModelo] = useState("");
  const [activo, setActivo] = useState(true);
  // "Otro" abre el campo libre: la lista de modelos es de conveniencia, no
  // una restricción, y los proveedores sacan modelos nuevos a menudo.
  const [modeloAMano, setModeloAMano] = useState(false);

  const aplicar = useCallback((datos: ConfiguracionDeIa) => {
    setConfig(datos);
    setProveedor(datos.provider ?? "claude");
    setModelo(datos.model ?? "");
    setActivo(datos.active);
    const conocidos = MODELOS_POR_PROVEEDOR[datos.provider ?? ""] ?? [];
    setModeloAMano(
      Boolean(datos.model) && !conocidos.some((m) => m.value === datos.model),
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
          body: JSON.stringify({
            provider: proveedor,
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

  // No hay nada que pedir: ni proveedor (es el de la clave del despliegue)
  // ni credencial.
  const sinClaveEnNingunSitio = !config?.tieneClave;

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{translate("crm.ai.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.ai.intro")}
        </p>
      </div>

      {sinClaveEnNingunSitio && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {translate("crm.ai.not_configured")}
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          {config?.incluida && (
            <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              {translate("crm.ai.included", {
                provider: nombreDelProveedor(config.provider ?? ""),
              })}
            </p>
          )}

          {!sinClaveEnNingunSitio && (
            <div className="space-y-1.5">
              <Label>{translate("crm.ai.model")}</Label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setModelo("");
                    setModeloAMano(false);
                  }}
                  className={opcionDeModelo(!modelo && !modeloAMano)}
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
                    className={opcionDeModelo(
                      !modeloAMano && modelo === item.value,
                    )}
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
                  className={opcionDeModelo(modeloAMano)}
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
