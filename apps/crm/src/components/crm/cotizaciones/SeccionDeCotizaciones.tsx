import {
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import {
  useDelete,
  useGetList,
  useNotify,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";

import type { Deal, EmailTemplate, Quote, QuoteItem } from "../types";
import { EditorDeCotizacion } from "./EditorDeCotizacion";

/**
 * Las cotizaciones de una oportunidad, con lo que se hace con cada una:
 * verla como la ve el cliente, editarla mientras es borrador, enviarla por
 * correo, copiar su enlace, marcarla respondida cuando se acordó por otro
 * medio, y borrarla si nunca salió.
 */

const VARIANTE_DE_ESTADO: Record<
  Quote["status"],
  "secondary" | "default" | "outline" | "destructive"
> = {
  draft: "outline",
  sent: "secondary",
  viewed: "secondary",
  accepted: "default",
  rejected: "destructive",
  expired: "outline",
};

const enlaceDe = (cotizacion: Quote) =>
  `${window.location.origin}/cotizacion/${cotizacion.public_token}`;

const formatear = (valor: number, moneda: string) =>
  Number(valor).toLocaleString("es-MX", {
    style: "currency",
    currency: moneda || "MXN",
  });

/** Llama a una ruta /api con la sesión de KontrolIA Auth. */
const llamar = async (ruta: string, cuerpo: unknown): Promise<Response> => {
  const token = await getKontroliaAccessToken();
  return fetch(ruta, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(cuerpo),
  });
};

export const SeccionDeCotizaciones = ({
  oportunidad,
}: {
  oportunidad: Deal;
}) => {
  const translate = useTranslate();
  const [editando, setEditando] = useState<{
    cotizacion?: Quote;
    lineas?: QuoteItem[];
  } | null>(null);

  const { data: cotizaciones, refetch } = useGetList<Quote>("quotes", {
    filter: { deal_id: oportunidad.id },
    pagination: { page: 1, perPage: 50 },
    sort: { field: "created_at", order: "DESC" },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tracking-wide">
          {translate("crm.quotes.section_title")}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditando({})}
          disabled={Boolean(oportunidad.archived_at)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {translate("crm.quotes.new")}
        </Button>
      </div>

      {(cotizaciones ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {translate("crm.quotes.empty")}
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {(cotizaciones ?? []).map((cotizacion) => (
            <FilaDeCotizacion
              key={cotizacion.id}
              cotizacion={cotizacion}
              alCambiar={refetch}
              alEditar={(lineas) => setEditando({ cotizacion, lineas })}
            />
          ))}
        </ul>
      )}

      {editando && (
        <EditorDeCotizacion
          oportunidad={oportunidad}
          cotizacion={editando.cotizacion}
          lineas={editando.lineas}
          abierto
          onClose={() => setEditando(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
};

const FilaDeCotizacion = ({
  cotizacion,
  alCambiar,
  alEditar,
}: {
  cotizacion: Quote;
  alCambiar: () => void;
  alEditar: (lineas: QuoteItem[]) => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const [deleteOne] = useDelete();
  const [enviando, setEnviando] = useState(false);
  const [dialogoDeEnvio, setDialogoDeEnvio] = useState(false);

  const { data: lineas } = useGetList<QuoteItem>("quote_items", {
    filter: { quote_id: cotizacion.id },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "position", order: "ASC" },
  });

  const esBorrador = cotizacion.status === "draft";
  const respondida =
    cotizacion.status === "accepted" || cotizacion.status === "rejected";

  const copiarEnlace = async () => {
    await navigator.clipboard.writeText(enlaceDe(cotizacion));
    notify("crm.quotes.link_copied", { type: "info" });
  };

  const marcar = async (accion: "aceptar" | "rechazar") => {
    const respuesta = await llamar(
      `/api/cotizaciones/${cotizacion.id}/responder`,
      { accion },
    );
    if (!respuesta.ok) {
      const { message } = (await respuesta.json().catch(() => ({}))) as {
        message?: string;
      };
      notify(message ?? translate("crm.quotes.save_error"), { type: "error" });
      return;
    }
    notify(
      accion === "aceptar"
        ? "crm.quotes.marked_accepted"
        : "crm.quotes.marked_rejected",
      { type: "info" },
    );
    alCambiar();
    refresh();
  };

  const borrar = async () => {
    await deleteOne(
      "quotes",
      { id: cotizacion.id, previousData: cotizacion },
      { returnPromise: true },
    );
    notify("crm.quotes.deleted", { type: "info" });
    alCambiar();
  };

  return (
    <li className="flex items-center gap-3 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tabular-nums">{cotizacion.number}</span>
          <span className="truncate">{cotizacion.title}</span>
          <Badge variant={VARIANTE_DE_ESTADO[cotizacion.status]}>
            {translate(`crm.quotes.status.${cotizacion.status}`)}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatear(cotizacion.total, cotizacion.currency)}
          {cotizacion.valid_until
            ? ` · ${translate("crm.quotes.valid_until_short", {
                date: cotizacion.valid_until,
              })}`
            : ""}
          {cotizacion.viewed_at && !respondida
            ? ` · ${translate("crm.quotes.viewed_on", {
                date: cotizacion.viewed_at.slice(0, 10),
              })}`
            : ""}
          {cotizacion.accepted_by_name
            ? ` · ${translate("crm.quotes.accepted_by", {
                name: cotizacion.accepted_by_name,
              })}`
            : ""}
        </div>
      </div>

      {!respondida && (
        <Button
          size="sm"
          variant={esBorrador ? "default" : "outline"}
          onClick={() => setDialogoDeEnvio(true)}
          disabled={enviando}
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {translate(esBorrador ? "crm.quotes.send" : "crm.quotes.resend")}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={translate("crm.quotes.actions")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={enlaceDe(cotizacion)} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              {translate("crm.quotes.view")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copiarEnlace}>
            <Copy className="h-4 w-4" />
            {translate("crm.quotes.copy_link")}
          </DropdownMenuItem>
          {esBorrador && (
            <DropdownMenuItem onClick={() => alEditar(lineas ?? [])}>
              <Pencil className="h-4 w-4" />
              {translate("ra.action.edit")}
            </DropdownMenuItem>
          )}
          {!respondida && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => marcar("aceptar")}>
                {translate("crm.quotes.mark_accepted")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => marcar("rechazar")}>
                {translate("crm.quotes.mark_rejected")}
              </DropdownMenuItem>
            </>
          )}
          {esBorrador && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={borrar}>
                <Trash2 className="h-4 w-4" />
                {translate("ra.action.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogoDeEnvio && (
        <DialogoDeEnvio
          cotizacion={cotizacion}
          onClose={() => setDialogoDeEnvio(false)}
          onEnviando={setEnviando}
          onEnviada={() => {
            alCambiar();
            refresh();
          }}
        />
      )}
    </li>
  );
};

/** A quién y con qué: correo del contacto por defecto, plantilla opcional. */
const DialogoDeEnvio = ({
  cotizacion,
  onClose,
  onEnviando,
  onEnviada,
}: {
  cotizacion: Quote;
  onClose: () => void;
  onEnviando: (valor: boolean) => void;
  onEnviada: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [para, setPara] = useState("");
  const [plantilla, setPlantilla] = useState<string>("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { data: plantillas } = useGetList<EmailTemplate>("email_templates", {
    filter: { active: true },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const enviar = async () => {
    setEnviando(true);
    onEnviando(true);
    try {
      const respuesta = await llamar(
        `/api/cotizaciones/${cotizacion.id}/enviar`,
        {
          ...(para.trim() ? { para: para.trim() } : {}),
          ...(plantilla ? { templateId: Number(plantilla) } : {}),
          ...(mensaje.trim() ? { mensaje: mensaje.trim() } : {}),
        },
      );
      const cuerpo = (await respuesta.json().catch(() => ({}))) as {
        message?: string;
        para?: string;
      };
      if (!respuesta.ok) {
        notify(cuerpo.message ?? translate("crm.quotes.send_error"), {
          type: "error",
        });
        return;
      }
      notify(translate("crm.quotes.sent_to", { email: cuerpo.para ?? "" }), {
        type: "info",
      });
      onEnviada();
      onClose();
    } finally {
      setEnviando(false);
      onEnviando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(valor) => !valor && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {translate("crm.quotes.send_title", { number: cotizacion.number })}
          </DialogTitle>
          <DialogDescription>
            {translate("crm.quotes.send_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cot-para">{translate("crm.quotes.send_to")}</Label>
            <Input
              id="cot-para"
              type="email"
              value={para}
              onChange={(e) => setPara(e.target.value)}
              placeholder={translate("crm.quotes.send_to_placeholder")}
            />
          </div>
          {(plantillas ?? []).length > 0 && (
            <div className="space-y-1.5">
              <Label>{translate("crm.quotes.send_template")}</Label>
              <Select value={plantilla} onValueChange={setPlantilla}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={translate("crm.quotes.send_template_default")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(plantillas ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!plantilla && (
            <div className="space-y-1.5">
              <Label htmlFor="cot-mensaje">
                {translate("crm.quotes.send_message")}
              </Label>
              <Textarea
                id="cot-mensaje"
                rows={4}
                maxLength={2000}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder={translate("crm.quotes.send_message_placeholder")}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={enviando}>
            {translate("ra.action.cancel")}
          </Button>
          <Button onClick={enviar} disabled={enviando}>
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {translate("crm.quotes.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
