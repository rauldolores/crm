import { Bot, Inbox, Loader2, Search, Settings } from "lucide-react";
import {
  CanAccess,
  useGetIdentity,
  useGetList,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { RelativeDate } from "../misc/RelativeDate";
import { etiquetaDeProyecto } from "../proyectos/proyectos";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Conversation } from "../types";
import { ConfigurarBandejaPage } from "./ConfigurarBandejaPage";
import { Conversacion } from "./Conversacion";
import { esVista, filtroDeVista, VISTAS, type Vista } from "./vistas";

/**
 * Bandeja compartida: lo que los clientes contestan a la dirección de la
 * organización, a la vista de todo el equipo. «Pendientes» es la lista de
 * trabajo; el historial de cada contacto sigue en su ficha.
 *
 * La vista y la conversación abierta viven en la URL (?vista=&id=): se
 * puede compartir el enlace a una conversación y recargar sin perderla.
 */
export const BandejaPage = () => {
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const [parametros, setParametros] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const { projects } = useConfigurationContext();
  const proyecto = parametros.get("proyecto");

  const vistaPedida = parametros.get("vista");
  const vista: Vista = esVista(vistaPedida) ? vistaPedida : "pending";
  const abierta = parametros.get("id");

  const cambiarParametros = (cambios: Record<string, string | null>) => {
    const siguientes = new URLSearchParams(parametros);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor == null) siguientes.delete(clave);
      else siguientes.set(clave, valor);
    }
    setParametros(siguientes);
  };

  return (
    <div className="mx-auto mt-6 mb-8 flex max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {translate("crm.inbox.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {translate("crm.inbox.intro")}
          </p>
        </div>
        <CanAccess resource="configuration" action="edit">
          <Button variant="outline" size="sm" asChild>
            <Link to={ConfigurarBandejaPage.path}>
              <Settings className="h-4 w-4" />
              {translate("crm.inbox.configure")}
            </Link>
          </Button>
        </CanAccess>
      </div>

      <div className="flex flex-wrap gap-1">
        {VISTAS.map((clave) => (
          <Button
            key={clave}
            size="sm"
            variant={clave === vista ? "default" : "ghost"}
            onClick={() => cambiarParametros({ vista: clave, id: null })}
          >
            {translate(`crm.inbox.views.${clave}`)}
          </Button>
        ))}
        {projects.length > 1 && (
          <select
            aria-label={translate("crm.projects.title")}
            className="ml-auto h-8 rounded-md border bg-background px-2 text-sm"
            value={proyecto ?? ""}
            onChange={(evento) =>
              cambiarParametros({
                proyecto: evento.target.value || null,
                id: null,
              })
            }
          >
            <option value="">{translate("crm.projects.all")}</option>
            {projects.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex h-[calc(100dvh-14rem)] min-h-[28rem] overflow-hidden rounded-lg border">
        <div
          className={[
            "flex w-full flex-col border-r md:w-96 md:shrink-0",
            abierta ? "hidden md:flex" : "flex",
          ].join(" ")}
        >
          <div className="relative border-b p-2">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder={translate("crm.inbox.search")}
              className="pl-8"
            />
          </div>
          <ListaDeConversaciones
            filtro={{
              ...filtroDeVista(vista, identity?.id),
              ...(busqueda.trim() ? { q: busqueda.trim() } : {}),
              ...(proyecto ? { project: proyecto } : {}),
            }}
            vista={vista}
            abierta={abierta}
            alAbrir={(id) => cambiarParametros({ id: String(id) })}
          />
        </div>
        <div
          className={[
            "min-w-0 flex-1 flex-col",
            abierta ? "flex" : "hidden md:flex",
          ].join(" ")}
        >
          {abierta ? (
            <Conversacion
              key={abierta}
              id={abierta}
              alVolver={() => cambiarParametros({ id: null })}
            />
          ) : (
            <div className="m-auto flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8" />
              {translate("crm.inbox.pick_one")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

BandejaPage.path = "/bandeja";

const ListaDeConversaciones = ({
  filtro,
  vista,
  abierta,
  alAbrir,
}: {
  filtro: Record<string, unknown>;
  vista: Vista;
  abierta: string | null;
  alAbrir: (id: Identifier) => void;
}) => {
  const translate = useTranslate();
  const { projects } = useConfigurationContext();
  const { data, isPending } = useGetList<Conversation>("conversations", {
    filter: filtro,
    sort: { field: "last_message_at", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });

  if (isPending) {
    return (
      <Loader2 className="m-4 h-5 w-5 animate-spin text-muted-foreground" />
    );
  }
  if (!data?.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        {translate(`crm.inbox.empty.${vista}`)}
      </p>
    );
  }

  return (
    <ul className="min-h-0 flex-1 overflow-y-auto">
      {data.map((conversacion) => (
        <li key={conversacion.id}>
          <button
            type="button"
            onClick={() => alAbrir(conversacion.id)}
            className={[
              "flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left text-sm hover:bg-accent",
              String(conversacion.id) === abierta ? "bg-accent" : "",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={[
                  "truncate",
                  conversacion.unread ? "font-semibold" : "",
                ].join(" ")}
              >
                {conversacion.counterpart_name || conversacion.counterpart}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                <RelativeDate date={conversacion.last_message_at} />
              </span>
            </div>
            <span
              className={[
                "truncate",
                conversacion.unread ? "font-medium" : "text-muted-foreground",
              ].join(" ")}
            >
              {conversacion.subject || translate("crm.inbox.no_subject")}
            </span>
            {conversacion.last_message_preview && (
              <span className="truncate text-xs text-muted-foreground">
                {conversacion.last_message_preview}
              </span>
            )}
            <div className="flex flex-wrap gap-1">
              {conversacion.project && projects.length > 1 && (
                <Badge variant="secondary" className="text-[10px]">
                  {etiquetaDeProyecto(projects, conversacion.project)}
                </Badge>
              )}
              {conversacion.contact_id == null && (
                <Badge variant="outline" className="text-[10px]">
                  {translate("crm.inbox.no_contact")}
                </Badge>
              )}
              {conversacion.automatic && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Bot className="h-3 w-3" />
                  {translate("crm.inbox.automatic")}
                </Badge>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};
