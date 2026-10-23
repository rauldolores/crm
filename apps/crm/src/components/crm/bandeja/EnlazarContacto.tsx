import { Link2, Loader2, UserPlus } from "lucide-react";
import {
  useCreate,
  useGetList,
  useNotify,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Contact, Conversation } from "../types";

/**
 * Una conversación «Sin contacto»: buscar a quién pertenece o crear el
 * contacto ahí mismo. Al enlazarla, el servidor agrega la dirección a la
 * ficha para que el próximo correo ya llegue con nombre.
 *
 * El alta va por el data provider (y por tanto por el puente), no por
 * /api/bandeja: así cuenta contra el cupo del plan como cualquier otra.
 */
export const EnlazarContacto = ({
  conversacion,
  alEnlazar,
}: {
  conversacion: Conversation;
  alEnlazar: (contactId: Identifier) => void;
}) => {
  const translate = useTranslate();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Link2 className="h-4 w-4" />
        {translate("crm.inbox.link.button")}
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("crm.inbox.link.title")}</DialogTitle>
            <DialogDescription>
              {translate("crm.inbox.link.help", {
                email: conversacion.counterpart,
              })}
            </DialogDescription>
          </DialogHeader>
          {abierto && (
            <Buscador
              conversacion={conversacion}
              alElegir={(id) => {
                setAbierto(false);
                alEnlazar(id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

/** «Laura Pérez» → { first_name: "Laura", last_name: "Pérez" }. */
const nombreEnPartes = (nombre: string) => {
  const [primero = "", ...resto] = nombre.trim().split(/\s+/);
  return { first_name: primero, last_name: resto.join(" ") };
};

const Buscador = ({
  conversacion,
  alElegir,
}: {
  conversacion: Conversation;
  alElegir: (id: Identifier) => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [busqueda, setBusqueda] = useState(conversacion.counterpart);
  const [nombre, setNombre] = useState(conversacion.counterpart_name ?? "");
  const [crear, { isPending: creando }] = useCreate<Contact>();

  const { data: contactos, isPending } = useGetList<Contact>("contacts", {
    filter: { q: busqueda },
    sort: { field: "last_seen", order: "DESC" },
    pagination: { page: 1, perPage: 8 },
  });

  const crearContacto = () =>
    crear(
      "contacts",
      {
        // Lo mismo que agrega el alta normal (cleanupContactForCreate).
        data: {
          ...nombreEnPartes(nombre),
          email_jsonb: [{ email: conversacion.counterpart, type: "Work" }],
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          tags: [],
        },
      },
      {
        onSuccess: (contacto) => alElegir(contacto.id),
        onError: (error) => notify((error as Error).message, { type: "error" }),
      },
    );

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="buscar-contacto">
          {translate("crm.inbox.link.search")}
        </Label>
        <Input
          id="buscar-contacto"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
        <ul className="max-h-56 overflow-y-auto rounded-md border">
          {isPending && (
            <li className="p-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </li>
          )}
          {!isPending && !contactos?.length && (
            <li className="p-2 text-sm text-muted-foreground">
              {translate("crm.inbox.link.none")}
            </li>
          )}
          {contactos?.map((contacto) => (
            <li key={contacto.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => alElegir(contacto.id)}
              >
                <span className="font-medium">
                  {`${contacto.first_name ?? ""} ${contacto.last_name ?? ""}`.trim()}
                </span>
                {contacto.email_jsonb?.[0]?.email && (
                  <span className="ml-2 text-muted-foreground">
                    {contacto.email_jsonb[0].email}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5 border-t pt-4">
        <Label htmlFor="nombre-de-contacto">
          {translate("crm.inbox.link.new_name")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="nombre-de-contacto"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />
          <Button onClick={crearContacto} disabled={creando || !nombre.trim()}>
            {creando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {translate("crm.inbox.link.create")}
          </Button>
        </div>
      </div>
    </div>
  );
};
