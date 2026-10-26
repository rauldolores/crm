import { CheckCircle2, Copy, Loader2, TriangleAlert } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { llamarApi } from "../misc/llamarApi";
import { RelativeDate } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { PageHero } from "../misc/Patrones";

/**
 * Bandeja → Configurar: conectar la dirección de la organización para que
 * lo que contestan los clientes llegue a la bandeja.
 *
 * Escrita paso a paso para quien nunca ha visto un webhook: cada paso dice
 * en qué pantalla de Resend está el botón y qué copiar de dónde a dónde.
 * Habla con /api/bandeja/configuracion (solo administradores), que nunca
 * devuelve los secretos: por eso sus campos siempre aparecen vacíos.
 */

interface Ajustes {
  inboxEmail: string | null;
  active: boolean;
  tieneSecreto: boolean;
  tieneClavePropia: boolean;
  salienteEsResend: boolean;
  lastReceivedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  webhookUrl: string;
}

const RUTA = "/api/bandeja/configuracion";

export const ConfigurarBandejaPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [ajustes, setAjustes] = useState<Ajustes | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [secreto, setSecreto] = useState("");
  const [clave, setClave] = useState("");
  const [activa, setActiva] = useState(true);
  const { projects } = useConfigurationContext();
  const direccionesDeProyectos = projects.filter((p) => p.email);

  const aplicar = useCallback((datos: Ajustes) => {
    setAjustes(datos);
    setDireccion(datos.inboxEmail ?? "");
    setActiva(datos.inboxEmail || datos.tieneSecreto ? datos.active : true);
    setSecreto("");
    setClave("");
  }, []);

  useEffect(() => {
    llamarApi<Ajustes>(RUTA)
      .then(aplicar)
      .catch((error: Error) => notify(error.message, { type: "error" }));
  }, [aplicar, notify]);

  const guardar = async () => {
    setGuardando(true);
    try {
      aplicar(
        await llamarApi<Ajustes>(RUTA, {
          method: "PUT",
          body: JSON.stringify({
            inboxEmail: direccion,
            webhookSecret: secreto,
            apiKey: clave,
            active: activa,
          }),
        }),
      );
      notify("crm.inbox.setup.saved", { type: "info" });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setGuardando(false);
    }
  };

  const copiar = async () => {
    if (!ajustes) return;
    await navigator.clipboard.writeText(ajustes.webhookUrl);
    notify("crm.inbox.setup.copied", { type: "info" });
  };

  if (!ajustes) {
    return (
      <Loader2 className="m-8 h-5 w-5 animate-spin text-muted-foreground" />
    );
  }

  const t = (clave: string, opciones?: Record<string, unknown>) =>
    translate(`crm.inbox.setup.${clave}`, opciones);

  return (
    <div className="mx-auto mt-8 mb-16 flex max-w-3xl flex-col gap-6">
      <div>
        <Link to="/bandeja" className="text-sm">
          ← {translate("crm.inbox.title")}
        </Link>
      </div>
      <PageHero
        badge={translate("crm.inbox.title")}
        title={t("title")}
        description={t("intro")}
      />

      <Estado ajustes={ajustes} />

      <Paso numero={1} titulo={t("step1.title")}>
        <p>{t("step1.help")}</p>
        {direccionesDeProyectos.length > 0 ? (
          <ul className="space-y-0.5">
            {direccionesDeProyectos.map((p) => (
              <li key={p.value}>
                <span className="font-medium">{p.label}</span>
                {" · "}
                <span className="font-mono text-xs">{p.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t("step1.no_projects")}</p>
        )}
        <Link to="/settings" className="text-xs">
          {t("step1.edit_projects")}
        </Link>
        <Label htmlFor="direccion-de-bandeja" className="pt-2">
          {t("step1.label")}
        </Label>
        <Input
          id="direccion-de-bandeja"
          type="email"
          placeholder="hola@tuempresa.com"
          value={direccion}
          onChange={(evento) => setDireccion(evento.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("step1.extra_help")}</p>
      </Paso>

      <Paso numero={2} titulo={t("step2.title")}>
        <p>{t("step2.help")}</p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={ajustes.webhookUrl}
            className="font-mono text-xs"
          />
          <Button variant="outline" onClick={copiar}>
            <Copy className="h-4 w-4" />
            {t("copy")}
          </Button>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>{t("step2.a")}</li>
          <li>{t("step2.b")}</li>
          <li>{t("step2.c")}</li>
        </ol>
      </Paso>

      <Paso numero={3} titulo={t("step3.title")}>
        <p>{t("step3.help")}</p>
        <Label htmlFor="secreto-de-bandeja">{t("step3.label")}</Label>
        <Input
          id="secreto-de-bandeja"
          type="password"
          autoComplete="off"
          placeholder={ajustes.tieneSecreto ? t("kept") : "whsec_…"}
          value={secreto}
          onChange={(evento) => setSecreto(evento.target.value)}
        />
      </Paso>

      <Paso numero={4} titulo={t("step4.title")}>
        <p>
          {ajustes.salienteEsResend ? t("step4.optional") : t("step4.required")}
        </p>
        <Label htmlFor="clave-de-bandeja">{t("step4.label")}</Label>
        <Input
          id="clave-de-bandeja"
          type="password"
          autoComplete="off"
          placeholder={ajustes.tieneClavePropia ? t("kept") : "re_…"}
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
        />
      </Paso>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="bandeja-activa"
            checked={activa}
            onCheckedChange={setActiva}
          />
          <Label htmlFor="bandeja-activa">{t("active")}</Label>
        </div>
        <Button
          onClick={guardar}
          disabled={
            guardando ||
            (!direccion.trim() && direccionesDeProyectos.length === 0)
          }
        >
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </div>
  );
};

ConfigurarBandejaPage.path = "/bandeja/configurar";

const Paso = ({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {numero}
        </span>
        {titulo}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">{children}</CardContent>
  </Card>
);

/** Lo último que pasó: el mejor diagnóstico para alguien no técnico. */
const Estado = ({ ajustes }: { ajustes: Ajustes }) => {
  const translate = useTranslate();
  // Sin nada guardado todavía no hay estado que contar.
  if (!ajustes.inboxEmail && !ajustes.tieneSecreto) return null;

  const errorReciente =
    ajustes.lastError &&
    (!ajustes.lastReceivedAt ||
      (ajustes.lastErrorAt ?? "") > ajustes.lastReceivedAt);

  if (errorReciente) {
    return (
      <div className="flex gap-2 rounded-md border border-destructive/40 p-3 text-sm text-destructive">
        <TriangleAlert className="h-4 w-4 shrink-0" />
        <span>{ajustes.lastError}</span>
      </div>
    );
  }
  if (ajustes.lastReceivedAt) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        <span>
          {translate("crm.inbox.setup.working")}{" "}
          <RelativeDate date={ajustes.lastReceivedAt} />
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-md border p-3 text-sm text-muted-foreground">
      {translate("crm.inbox.setup.waiting", {
        email: ajustes.inboxEmail ?? translate("crm.inbox.setup.any_address"),
      })}
    </div>
  );
};
