import { Check, Copy, Plus, Trash2 } from "lucide-react";
import {
  useCreate,
  useDelete,
  useGetList,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useCallback, useEffect, useState } from "react";

import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type { ApiKey, Webhook } from "../types";

/** Recursos expuestos por la API REST, con un ejemplo real de cada uno. */
const RECURSOS_DE_EJEMPLO: { recurso: string; ejemplo: string }[] = [
  {
    recurso: "contacts",
    ejemplo: `{\n  "id": 42,\n  "first_name": "Ana",\n  "last_name": "García",\n  "email_jsonb": [{ "email": "ana@empresa.com", "type": "Work" }],\n  "phone_jsonb": [{ "number": "5551234567", "type": "Work" }],\n  "company_id": 7,\n  "status": "hot",\n  "sales_id": 1\n}`,
  },
  {
    recurso: "companies",
    ejemplo: `{\n  "id": 7,\n  "name": "Panadería La Espiga",\n  "sector": "Alimentos",\n  "website": "laespiga.com",\n  "sales_id": 1\n}`,
  },
  {
    recurso: "deals",
    ejemplo: `{\n  "id": 15,\n  "name": "Renovación anual",\n  "company_id": 7,\n  "stage": "propuesta",\n  "amount": 45000,\n  "pipeline": "ventas",\n  "sales_id": 1\n}`,
  },
  {
    recurso: "tasks",
    ejemplo: `{\n  "id": 88,\n  "contact_id": 42,\n  "type": "llamada",\n  "text": "Confirmar renovación",\n  "due_date": "2026-08-25T15:00:00Z",\n  "sales_id": 1\n}`,
  },
  {
    recurso: "tickets",
    ejemplo: `{\n  "id": 3,\n  "subject": "No puedo iniciar sesión",\n  "description": "Me sale error al entrar al CRM.",\n  "status": "open",\n  "contact_id": 42,\n  "company_id": 7,\n  "sales_id": 1\n}`,
  },
  {
    recurso: "contact_notes",
    ejemplo: `{\n  "id": 120,\n  "contact_id": 42,\n  "type": "note",\n  "text": "Le interesa el plan anual, pidió una demo la próxima semana.",\n  "date": "2026-08-25T18:30:00Z",\n  "sales_id": 1\n}`,
  },
  {
    recurso: "deal_notes",
    ejemplo: `{\n  "id": 34,\n  "deal_id": 15,\n  "type": "llamada",\n  "text": "Confirmó presupuesto, falta aprobación del gerente.",\n  "date": "2026-08-25T18:30:00Z",\n  "sales_id": 1\n}`,
  },
  {
    recurso: "tags",
    ejemplo: `{\n  "id": 5,\n  "name": "Cliente VIP",\n  "color": "#f59e0b"\n}`,
  },
];

/**
 * Documentación de la API y gestión de webhooks, dentro del propio CRM.
 *
 * La API es la misma que usa la aplicación (PostgREST detrás del puente
 * /api/datos), así que documentar es describir lo que ya existe. Los
 * webhooks se administran aquí mismo para que la explicación y el alta vivan
 * juntas.
 *
 * Todas las direcciones que se muestran aquí (REST, MCP) usan el propio
 * dominio de la aplicación, nunca el de Supabase: son puentes del servidor
 * (`/api/datos`, `/api/mcp`) que reenvían la petición internamente.
 */
export const ApiPage = () => {
  const translate = useTranslate();
  const origen = typeof window !== "undefined" ? window.location.origin : "";
  const urlBase = `${origen}/api/datos/rest/v1`;
  const urlAttachments = `${origen}/api/attachments`;
  const urlMcp = `${origen}/api/mcp`;

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{translate("crm.api.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.api.intro")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.api.rest.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{translate("crm.api.rest.base_url")}</p>
          <Bloque>{urlBase}</Bloque>
          <p>{translate("crm.api.rest.auth")}</p>
          <Bloque>{`curl "${urlBase}/contacts?select=id,first_name,last_name&status=eq.hot" \\\n  -H "Authorization: Bearer <token>"`}</Bloque>
          <p>{translate("crm.api.rest.auth_api_key")}</p>
          <p>{translate("crm.api.rest.filters")}</p>
          <Bloque>{`?first_name=ilike.*ana*     ${translate("crm.api.rest.example_ilike")}\n?amount=gte.10000          ${translate("crm.api.rest.example_gte")}\n?order=last_seen.desc      ${translate("crm.api.rest.example_order")}\n?limit=25&offset=50        ${translate("crm.api.rest.example_pagination")}`}</Bloque>
          <p>{translate("crm.api.rest.write")}</p>
          <Bloque>{`curl -X POST "${urlBase}/contacts" \\\n  -H "Authorization: Bearer <token>" \\\n  -H "Content-Type: application/json" \\\n  -H "Prefer: return=representation" \\\n  -d '{"first_name": "Ana", "last_name": "García", "sales_id": 1}'`}</Bloque>
          <p className="text-muted-foreground">
            {translate("crm.api.rest.resources")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.api.keys.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{translate("crm.api.keys.intro")}</p>
          <GestorDeClavesDeApi />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.api.endpoints.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{translate("crm.api.endpoints.intro")}</p>
          {RECURSOS_DE_EJEMPLO.map(({ recurso, ejemplo }) => (
            <div key={recurso} className="space-y-1.5">
              <p className="font-mono text-xs font-medium">
                GET / POST / PATCH / DELETE {urlBase}/{recurso}
              </p>
              <Bloque>{ejemplo}</Bloque>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.api.attachments.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{translate("crm.api.attachments.intro")}</p>
          <Bloque>{`curl -X POST "${urlAttachments}" \\\n  -H "Authorization: Bearer <token>" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "filename": "factura.pdf",\n    "contentType": "application/pdf",\n    "contentBase64": "JVBERi0xLj..."\n  }'`}</Bloque>
          <p>{translate("crm.api.attachments.response")}</p>
          <Bloque>{`{\n  "src": "https://.../storage/v1/object/public/attachments/0.1234.pdf",\n  "title": "factura.pdf",\n  "path": "0.1234.pdf",\n  "type": "application/pdf"\n}`}</Bloque>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.api.webhooks.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{translate("crm.api.webhooks.intro")}</p>
          <GestorDeWebhooks />
          <Separator />
          <p>{translate("crm.api.webhooks.payload")}</p>
          <Bloque>{`{\n  "evento": "contacts.created",\n  "recurso": "contacts",\n  "fecha": "2026-08-18T12:00:00Z",\n  "datos": { … }\n}`}</Bloque>
          <p>{translate("crm.api.webhooks.events")}</p>
          <Bloque>{`contacts.created / contacts.updated / contacts.deleted\ncompanies.created / companies.updated / companies.deleted\ndeals.created / deals.updated / deals.deleted\ntasks.created / tasks.updated / tasks.deleted\ncontact_notes.created / contact_notes.updated / contact_notes.deleted\ndeal_notes.created / deal_notes.updated / deal_notes.deleted\ntickets.created / tickets.updated / tickets.deleted`}</Bloque>
          <p>{translate("crm.api.webhooks.signature")}</p>
          <Bloque>{`firma = HMAC_SHA256(cuerpo, secreto)  →  cabecera X-Vinqulia-Firma (hex)`}</Bloque>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.api.mcp.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{translate("crm.api.mcp.intro")}</p>
          <Bloque>{urlMcp}</Bloque>
          <p>{translate("crm.api.mcp.auth")}</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-mono text-xs">get_schema</span> —{" "}
              {translate("crm.api.mcp.tool_get_schema")}
            </li>
            <li>
              <span className="font-mono text-xs">query</span> —{" "}
              {translate("crm.api.mcp.tool_query")}
            </li>
            <li>
              <span className="font-mono text-xs">mutate</span> —{" "}
              {translate("crm.api.mcp.tool_mutate")}
            </li>
            <li>
              <span className="font-mono text-xs">display_task_list</span> —{" "}
              {translate("crm.api.mcp.tool_display_task_list")}
            </li>
            <li>
              <span className="font-mono text-xs">complete_task</span> —{" "}
              {translate("crm.api.mcp.tool_complete_task")}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

ApiPage.path = "/integraciones";

const Bloque = ({ children }: { children: string }) => (
  <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
    {children}
  </pre>
);

/**
 * Llama a una ruta propia del CRM (no PostgREST) con el token de sesión.
 * Lanza con el mensaje del servidor si la respuesta no es 2xx.
 */
const llamarApi = async (ruta: string, opciones: RequestInit = {}) => {
  const token = await getKontroliaAccessToken();
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(cuerpo.message ?? "Ocurrió un error inesperado.");
  }
  return cuerpo;
};

/**
 * Alta, activación y baja de las claves de API de la organización.
 *
 * No usa los hooks de ra-core (a diferencia de GestorDeWebhooks): crear una
 * clave pasa por /api/claves, no por PostgREST, porque generar el secreto y
 * devolverlo una única vez es lógica de servidor, no una fila más.
 */
const GestorDeClavesDeApi = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [claves, setClaves] = useState<ApiKey[]>([]);
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [claveNueva, setClaveNueva] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { claves: datos } = await llamarApi("/api/claves");
      setClaves(datos ?? []);
    } catch {
      // Probablemente no es administrador: el resto de la página sigue
      // siendo útil, así que no se muestra error.
      setClaves([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    setCreando(true);
    try {
      const creada = await llamarApi("/api/claves", {
        method: "POST",
        body: JSON.stringify({ name: nombreLimpio }),
      });
      setClaveNueva(creada.key);
      setCopiado(false);
      setNombre("");
      cargar();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "No se pudo crear la clave.",
        { type: "error" },
      );
    } finally {
      setCreando(false);
    }
  };

  const alternar = async (clave: ApiKey) => {
    try {
      await llamarApi(`/api/claves/${clave.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !clave.active }),
      });
      cargar();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la clave.",
        { type: "error" },
      );
    }
  };

  const eliminar = async (clave: ApiKey) => {
    try {
      await llamarApi(`/api/claves/${clave.id}`, { method: "DELETE" });
      notify(translate("crm.api.keys.deleted"), { type: "info" });
      cargar();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la clave.",
        { type: "error" },
      );
    }
  };

  const copiarClaveNueva = async () => {
    if (!claveNueva) return;
    await navigator.clipboard.writeText(claveNueva);
    setCopiado(true);
    notify("crm.common.copied", { type: "info" });
  };

  return (
    <div className="space-y-3">
      {claveNueva && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm font-medium">
            {translate("crm.api.keys.reveal_title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {translate("crm.api.keys.reveal_warning")}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
              {claveNueva}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={copiarClaveNueva}
            >
              {copiado ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {translate("crm.api.webhooks.copy_secret")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClaveNueva(null)}
            >
              {translate("crm.api.keys.reveal_dismiss")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={nombre}
          placeholder={translate("crm.api.keys.name_placeholder")}
          onChange={(evento) => setNombre(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              evento.preventDefault();
              crear();
            }
          }}
        />
        <Button onClick={crear} disabled={!nombre.trim() || creando}>
          <Plus className="h-4 w-4 mr-1" />
          {translate("crm.api.keys.add")}
        </Button>
      </div>

      {claves.length === 0 ? (
        <p className="text-muted-foreground">
          {translate("crm.api.keys.empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {claves.map((clave) => (
            <div
              key={clave.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <Switch
                checked={clave.active}
                onCheckedChange={() => alternar(clave)}
                aria-label={translate("crm.api.keys.toggle")}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{clave.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {clave.key_prefix}…
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={translate("ra.action.delete")}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => eliminar(clave)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Alta, activación y baja de los webhooks de la organización. */
const GestorDeWebhooks = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [url, setUrl] = useState("");

  const { data: webhooks, refetch } = useGetList<Webhook>("webhooks", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "ASC" },
  });
  const [create, { isPending: creando }] = useCreate();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();

  const esUrlValida = (() => {
    try {
      return new URL(url).protocol.startsWith("http");
    } catch {
      return false;
    }
  })();

  const agregar = async () => {
    if (!esUrlValida) return;
    try {
      await create(
        "webhooks",
        { data: { url: url.trim(), resources: [] } },
        { returnPromise: true },
      );
      notify("crm.api.webhooks.created", { type: "info" });
      setUrl("");
      refetch();
    } catch {
      notify("crm.api.webhooks.create_error", { type: "error" });
    }
  };

  const alternar = async (webhook: Webhook) => {
    await update("webhooks", {
      id: webhook.id,
      data: { active: !webhook.active },
      previousData: webhook,
    });
    refetch();
  };

  const eliminar = async (webhook: Webhook) => {
    await deleteOne("webhooks", { id: webhook.id, previousData: webhook });
    notify("crm.api.webhooks.deleted", { type: "info" });
    refetch();
  };

  const copiarSecreto = async (webhook: Webhook) => {
    await navigator.clipboard.writeText(webhook.secret ?? "");
    notify("crm.common.copied", { type: "info" });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={url}
          placeholder="https://tu-servidor.com/webhook"
          onChange={(evento) => setUrl(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              evento.preventDefault();
              agregar();
            }
          }}
        />
        <Button onClick={agregar} disabled={!esUrlValida || creando}>
          <Plus className="h-4 w-4 mr-1" />
          {translate("crm.api.webhooks.add")}
        </Button>
      </div>

      {(webhooks ?? []).length === 0 ? (
        <p className="text-muted-foreground">
          {translate("crm.api.webhooks.empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {(webhooks ?? []).map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <Switch
                checked={webhook.active}
                onCheckedChange={() => alternar(webhook)}
                aria-label={translate("crm.api.webhooks.toggle")}
              />
              <span className="flex-1 truncate font-mono text-xs">
                {webhook.url}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => copiarSecreto(webhook)}
              >
                <Copy className="h-3.5 w-3.5" />
                {translate("crm.api.webhooks.copy_secret")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={translate("ra.action.delete")}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => eliminar(webhook)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
