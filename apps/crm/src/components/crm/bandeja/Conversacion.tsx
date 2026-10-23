import { ArrowLeft, Bot, Loader2, Paperclip, Send } from "lucide-react";
import {
  useGetIdentity,
  useGetList,
  useGetOne,
  useNotify,
  useRefresh,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { llamarApi } from "../misc/llamarApi";
import { RelativeDate } from "../misc/RelativeDate";
import type {
  Contact,
  Conversation,
  ConversationMessage,
  Sale,
} from "../types";
import { separarCita } from "./cita";
import { EnlazarContacto } from "./EnlazarContacto";

/**
 * Una conversación abierta: el hilo, quién la atiende, a qué contacto
 * pertenece y la caja para contestar. Todo cambio va por /api/bandeja/:id
 * (el puente la sirve de solo lectura).
 */

const SIN_RESPONSABLE = "none";

const cambiarConversacion = (
  id: Identifier,
  cambios: Record<string, unknown>,
) =>
  llamarApi<Conversation>(`/api/bandeja/${id}`, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });

export const Conversacion = ({
  id,
  alVolver,
}: {
  id: Identifier;
  alVolver: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();

  const { data: conversacion, isPending } = useGetOne<Conversation>(
    "conversations",
    { id },
  );
  const { data: mensajes } = useGetList<ConversationMessage>(
    "conversation_messages",
    {
      filter: { conversation_id: id },
      sort: { field: "sent_at", order: "ASC" },
      pagination: { page: 1, perPage: 200 },
    },
  );

  // Abrirla es leerla.
  useEffect(() => {
    if (conversacion?.unread) {
      cambiarConversacion(id, { unread: false })
        .then(() => refresh())
        .catch(() => undefined);
    }
  }, [conversacion?.unread, id, refresh]);

  const cambiar = async (cambios: Record<string, unknown>) => {
    try {
      await cambiarConversacion(id, cambios);
      refresh();
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    }
  };

  if (isPending || !conversacion) {
    return (
      <Loader2 className="m-6 h-5 w-5 animate-spin text-muted-foreground" />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 md:hidden"
            onClick={alVolver}
          >
            <ArrowLeft className="h-4 w-4" />
            {translate("crm.inbox.back")}
          </Button>
          <h2 className="truncate text-lg font-semibold">
            {conversacion.subject || translate("crm.inbox.no_subject")}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {conversacion.counterpart_name
              ? `${conversacion.counterpart_name} · ${conversacion.counterpart}`
              : conversacion.counterpart}
          </p>
          <Contacto
            conversacion={conversacion}
            alEnlazar={(contactId) => cambiar({ contactId })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Responsable
            salesId={conversacion.sales_id}
            alCambiar={(salesId) => cambiar({ salesId })}
          />
          {conversacion.status === "closed" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiar({ status: "pending" })}
            >
              {translate("crm.inbox.reopen")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiar({ status: "closed" })}
            >
              {translate("crm.inbox.close")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {(mensajes ?? []).map((mensaje) => (
          <Mensaje key={mensaje.id} mensaje={mensaje} />
        ))}
      </div>

      <Respuesta conversacion={conversacion} alEnviar={() => refresh()} />
    </div>
  );
};

const Contacto = ({
  conversacion,
  alEnlazar,
}: {
  conversacion: Conversation;
  alEnlazar: (contactId: Identifier) => void;
}) => {
  const translate = useTranslate();
  const { data: contacto } = useGetOne<Contact>(
    "contacts",
    { id: conversacion.contact_id as Identifier },
    { enabled: conversacion.contact_id != null },
  );
  if (conversacion.contact_id == null) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{translate("crm.inbox.no_contact")}</Badge>
        <EnlazarContacto conversacion={conversacion} alEnlazar={alEnlazar} />
      </div>
    );
  }
  return (
    <Link to={`/contacts/${conversacion.contact_id}/show`} className="text-sm">
      {contacto
        ? `${contacto.first_name ?? ""} ${contacto.last_name ?? ""}`.trim()
        : translate("crm.inbox.open_contact")}
    </Link>
  );
};

const Responsable = ({
  salesId,
  alCambiar,
}: {
  salesId: Identifier | null;
  alCambiar: (salesId: number | null) => void;
}) => {
  const translate = useTranslate();
  const { data: equipo } = useGetList<Sale>("sales", {
    filter: { "disabled@neq": true },
    sort: { field: "first_name", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
  });
  return (
    <Select
      value={salesId == null ? SIN_RESPONSABLE : String(salesId)}
      onValueChange={(valor) =>
        alCambiar(valor === SIN_RESPONSABLE ? null : Number(valor))
      }
    >
      <SelectTrigger
        size="sm"
        className="w-48"
        aria-label={translate("crm.inbox.assignee")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SIN_RESPONSABLE}>
          {translate("crm.inbox.shared_pile")}
        </SelectItem>
        {(equipo ?? []).map((persona) => (
          <SelectItem key={persona.id} value={String(persona.id)}>
            {`${persona.first_name} ${persona.last_name}`.trim()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const Mensaje = ({ mensaje }: { mensaje: ConversationMessage }) => {
  const translate = useTranslate();
  const [conCita, setConCita] = useState(false);
  const { propio, citado } = separarCita(mensaje.body_text ?? "");
  const saliente = mensaje.direction === "out";

  return (
    <div
      className={[
        "max-w-[85%] rounded-lg border p-3 text-sm",
        saliente ? "self-end bg-muted" : "self-start bg-card",
      ].join(" ")}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {mensaje.from_name || mensaje.from_email}
        </span>
        <RelativeDate date={mensaje.sent_at} />
        {mensaje.automatic && (
          <Badge variant="outline" className="gap-1">
            <Bot className="h-3 w-3" />
            {translate("crm.inbox.automatic")}
          </Badge>
        )}
      </div>
      <p className="whitespace-pre-wrap break-words">{propio}</p>
      {citado && (
        <>
          <button
            type="button"
            className="mt-1 text-xs text-muted-foreground underline"
            onClick={() => setConCita((valor) => !valor)}
          >
            {translate(
              conCita ? "crm.inbox.hide_quote" : "crm.inbox.show_quote",
            )}
          </button>
          {conCita && (
            <p className="mt-1 whitespace-pre-wrap break-words border-l-2 pl-2 text-xs text-muted-foreground">
              {citado}
            </p>
          )}
        </>
      )}
      {mensaje.attachments?.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {mensaje.attachments.map((adjunto, i) => (
            <li key={i} className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {adjunto.filename}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Respuesta = ({
  conversacion,
  alEnviar,
}: {
  conversacion: Conversation;
  alEnviar: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      await llamarApi(`/api/bandeja/${conversacion.id}/responder`, {
        method: "POST",
        body: JSON.stringify({ texto }),
      });
      setTexto("");
      notify("crm.inbox.sent", { type: "info" });
      alEnviar();
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="border-t p-4">
      <Textarea
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder={translate("crm.inbox.reply_placeholder", {
          name: conversacion.counterpart_name || conversacion.counterpart,
        })}
        rows={4}
        maxLength={20000}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {conversacion.sales_id == null && identity
            ? translate("crm.inbox.reply_takes_it")
            : ""}
        </p>
        <Button onClick={enviar} disabled={enviando || !texto.trim()}>
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {translate("crm.inbox.send")}
        </Button>
      </div>
    </div>
  );
};
