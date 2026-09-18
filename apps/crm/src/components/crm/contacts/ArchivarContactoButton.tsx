import { Archive, ArchiveRestore } from "lucide-react";
import {
  useListContext,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
  useUpdate,
  useUpdateMany,
} from "ra-core";
import { useState } from "react";

import { Confirm } from "@/components/admin/confirm";
import { Button } from "@/components/ui/button";

import type { Contact } from "../types";

/**
 * Archivar un contacto (o recuperarlo). Un contacto que se fue de la empresa
 * o lleva años sin responder estorba en las listas y en los selectores, pero
 * borrarlo se lleva sus notas, tareas y oportunidades: archivado sale de la
 * vista y conserva todo. Se recupera desde su ficha o desde la lista con el
 * filtro «Solo archivados».
 */
export const ArchivarContactoButton = () => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();
  const notify = useNotify();
  const redirect = useRedirect();
  const refresh = useRefresh();
  const [update, { isPending }] = useUpdate();
  const [confirmando, setConfirmando] = useState(false);

  if (!record) return null;
  const archivado = !!record.archived_at;

  const aplicar = () => {
    setConfirmando(false);
    update(
      "contacts",
      {
        id: record.id,
        data: { archived_at: archivado ? null : new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          notify(
            archivado
              ? "resources.contacts.archive.restored"
              : "resources.contacts.archive.archived",
            { type: "info" },
          );
          if (archivado) {
            refresh();
          } else {
            redirect("list", "contacts");
          }
        },
        onError: () =>
          notify("resources.contacts.archive.error", { type: "error" }),
      },
    );
  };

  return (
    <>
      <Button
        variant="outline"
        className="h-6 cursor-pointer"
        size="sm"
        disabled={isPending}
        onClick={() => (archivado ? aplicar() : setConfirmando(true))}
      >
        {archivado ? (
          <ArchiveRestore className="w-4 h-4" />
        ) : (
          <Archive className="w-4 h-4" />
        )}
        {translate(
          archivado
            ? "resources.contacts.archive.restore"
            : "resources.contacts.archive.action",
        )}
      </Button>
      <Confirm
        isOpen={confirmando}
        title="resources.contacts.archive.confirm_title"
        content="resources.contacts.archive.confirm_description"
        confirm="resources.contacts.archive.action"
        onConfirm={aplicar}
        onClose={() => setConfirmando(false)}
      />
    </>
  );
};

/** Archivar de golpe los contactos seleccionados en la lista. */
export const BulkArchivarButton = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const { selectedIds = [], onUnselectItems } = useListContext<Contact>();
  const [confirmando, setConfirmando] = useState(false);
  const [updateMany, { isPending }] = useUpdateMany();

  if (!selectedIds.length) return null;

  const aplicar = () => {
    setConfirmando(false);
    updateMany(
      "contacts",
      { ids: selectedIds, data: { archived_at: new Date().toISOString() } },
      {
        onSuccess: () => {
          notify("resources.contacts.archive.bulk_archived", {
            type: "info",
            messageArgs: { smart_count: selectedIds.length },
          });
          onUnselectItems();
          refresh();
        },
        onError: () =>
          notify("resources.contacts.archive.error", { type: "error" }),
      },
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9"
        disabled={isPending}
        onClick={() => setConfirmando(true)}
      >
        <Archive className="w-4 h-4" />
        {translate("resources.contacts.archive.bulk_action")}
      </Button>
      <Confirm
        isOpen={confirmando}
        title="resources.contacts.archive.bulk_confirm_title"
        titleTranslateOptions={{ smart_count: selectedIds.length }}
        content="resources.contacts.archive.confirm_description"
        confirm="resources.contacts.archive.bulk_action"
        onConfirm={aplicar}
        onClose={() => setConfirmando(false)}
      />
    </>
  );
};
