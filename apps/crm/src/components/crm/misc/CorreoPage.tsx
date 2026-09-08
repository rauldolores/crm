import { Mail, Send } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { llamarApi } from "./llamarApi";

/**
 * Ajustes → Correo saliente: por qué servidor salen los correos de esta
 * organización.
 *
 * Fuera de la pantalla de Ajustes general a propósito: allí todo se guarda en
 * `configuration.config`, un jsonb que se sirve entero a cualquier miembro de
 * la organización, y la clave del proveedor no puede vivir ahí. Esta pantalla
 * habla con /api/correos/configuracion, que exige ser administrador y nunca
 * devuelve el secreto — por eso el campo de la clave siempre aparece vacío
 * aunque haya una guardada.
 */

const PROVEEDORES = [
  { value: "resend", label: "Resend" },
  { value: "postmark", label: "Postmark" },
  { value: "sendgrid", label: "SendGrid" },
] as const;

interface ConfiguracionDeCorreo {
  provider: string | null;
  fromEmail: string | null;
  fromName: string | null;
  active: boolean;
  tieneClave: boolean;
  heredadaDelEntorno: boolean;
}

export const CorreoPage = () => {
  const translate = useTranslate();
  const notify = useNotify();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [config, setConfig] = useState<ConfiguracionDeCorreo | null>(null);

  const [proveedor, setProveedor] = useState<string>("resend");
  const [clave, setClave] = useState("");
  const [remitente, setRemitente] = useState("");
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);
  const [destinoPrueba, setDestinoPrueba] = useState("");

  const aplicar = useCallback((datos: ConfiguracionDeCorreo) => {
    setConfig(datos);
    setProveedor(datos.provider ?? "resend");
    setRemitente(datos.fromEmail ?? "");
    setNombre(datos.fromName ?? "");
    setActivo(datos.active);
    setClave("");
  }, []);

  const cargar = useCallback(async () => {
    try {
      aplicar(
        await llamarApi<ConfiguracionDeCorreo>("/api/correos/configuracion"),
      );
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
      const datos = await llamarApi<ConfiguracionDeCorreo>(
        "/api/correos/configuracion",
        {
          method: "PUT",
          body: JSON.stringify({
            provider: proveedor,
            apiKey: clave,
            fromEmail: remitente,
            fromName: nombre,
            active: activo,
          }),
        },
      );
      aplicar(datos);
      notify("crm.email.saved", { type: "info" });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  const enviarPrueba = async () => {
    setEnviandoPrueba(true);
    try {
      await llamarApi("/api/correos/prueba", {
        method: "POST",
        body: JSON.stringify({ para: destinoPrueba }),
      });
      notify("crm.email.test_sent", { type: "info" });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setEnviandoPrueba(false);
    }
  };

  if (cargando) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.email.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.email.intro")}
        </p>
      </div>

      {config?.heredadaDelEntorno && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {translate("crm.email.inherited")}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.email.server_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <Label>{translate("crm.email.provider")}</Label>
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
            <Label htmlFor="clave-correo">
              {translate("crm.email.api_key")}
            </Label>
            <Input
              id="clave-correo"
              type="password"
              autoComplete="off"
              value={clave}
              placeholder={
                config?.tieneClave
                  ? translate("crm.email.api_key_saved")
                  : translate("crm.email.api_key_placeholder")
              }
              onChange={(evento) => setClave(evento.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {translate("crm.email.api_key_help")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remitente-correo">
              {translate("crm.email.from_email")}
            </Label>
            <Input
              id="remitente-correo"
              type="email"
              value={remitente}
              placeholder="hola@tudominio.com"
              onChange={(evento) => setRemitente(evento.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {translate("crm.email.from_email_help")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre-correo">
              {translate("crm.email.from_name")}
            </Label>
            <Input
              id="nombre-correo"
              value={nombre}
              placeholder="Ventas Kontrolia"
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={activo}
              onCheckedChange={setActivo}
              aria-label={translate("crm.email.active")}
            />
            <span>{translate("crm.email.active")}</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={guardar} disabled={guardando}>
              <Mail className="h-4 w-4 mr-1" />
              {translate("ra.action.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.email.test_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{translate("crm.email.test_intro")}</p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={destinoPrueba}
              placeholder="tu@correo.com"
              onChange={(evento) => setDestinoPrueba(evento.target.value)}
            />
            <Button
              variant="outline"
              onClick={enviarPrueba}
              disabled={!destinoPrueba || enviandoPrueba}
            >
              <Send className="h-4 w-4 mr-1" />
              {translate("crm.email.test_send")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

CorreoPage.path = "/correo";
