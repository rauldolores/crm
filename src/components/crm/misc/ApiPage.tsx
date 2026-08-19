import { Copy, Plus, Trash2 } from "lucide-react";
import {
  useCreate,
  useDelete,
  useGetList,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type { Webhook } from "../types";

/**
 * Documentación de la API y gestión de webhooks, dentro del propio CRM.
 *
 * La API es la misma que usa la aplicación (PostgREST detrás del puente
 * /api/supabase), así que documentar es describir lo que ya existe. Los
 * webhooks se administran aquí mismo para que la explicación y el alta vivan
 * juntas.
 */
export const ApiPage = () => {
  const translate = useTranslate();
  const urlBase =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/supabase/rest/v1`
      : "/api/supabase/rest/v1";

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
          <CardTitle>{translate("crm.api.webhooks.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{translate("crm.api.webhooks.intro")}</p>
          <GestorDeWebhooks />
          <Separator />
          <p>{translate("crm.api.webhooks.payload")}</p>
          <Bloque>{`{\n  "evento": "contacts.created",\n  "recurso": "contacts",\n  "fecha": "2026-08-18T12:00:00Z",\n  "datos": { … }\n}`}</Bloque>
          <p>{translate("crm.api.webhooks.signature")}</p>
          <Bloque>{`firma = HMAC_SHA256(cuerpo, secreto)  →  cabecera X-Vinqulia-Firma (hex)`}</Bloque>
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
