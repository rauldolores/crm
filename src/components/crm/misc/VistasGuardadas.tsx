import { Bookmark, Plus, Trash2 } from "lucide-react";
import {
  useCreate,
  useDelete,
  useGetIdentity,
  useGetList,
  useListContext,
  useNotify,
  useTranslate,
} from "ra-core";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

import type { SavedView } from "../types";

/**
 * Vistas guardadas de una lista: el filtro y el orden actuales, con nombre,
 * compartidos con toda la organización («Clientes calientes de CDMX»).
 *
 * Se guardan en la tabla saved_views —no en el navegador— para que
 * sobrevivan al cambio de equipo y el resto del equipo pueda usarlas.
 */
export const VistasGuardadas = ({ resource }: { resource: string }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { filterValues, sort, setFilters, setSort } = useListContext();
  const { identity } = useGetIdentity();

  const { data: vistas, refetch } = useGetList<SavedView>("saved_views", {
    filter: { resource },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const [create] = useCreate();
  const [deleteOne] = useDelete();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [nombre, setNombre] = useState("");

  const aplicar = (vista: SavedView) => {
    setFilters(vista.params?.filter ?? {});
    if (vista.params?.sort) {
      setSort(vista.params.sort);
    }
  };

  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    try {
      await create(
        "saved_views",
        {
          data: {
            resource,
            name: nombreLimpio,
            params: { filter: filterValues, sort },
            sales_id: identity?.id,
          },
        },
        { returnPromise: true },
      );
      notify("crm.saved_views.saved", { type: "info" });
      setDialogoAbierto(false);
      setNombre("");
      refetch();
    } catch {
      notify("crm.saved_views.save_error", { type: "error" });
    }
  };

  const eliminar = async (vista: SavedView) => {
    try {
      await deleteOne(
        "saved_views",
        { id: vista.id, previousData: vista },
        { returnPromise: true },
      );
      notify("crm.saved_views.deleted", { type: "info" });
      refetch();
    } catch {
      notify("ra.notification.http_error", { type: "error" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="h-4 w-4" />
            {translate("crm.saved_views.title")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          {(vistas ?? []).length === 0 ? (
            <DropdownMenuItem disabled>
              {translate("crm.saved_views.empty")}
            </DropdownMenuItem>
          ) : (
            (vistas ?? []).map((vista) => (
              <DropdownMenuItem
                key={vista.id}
                className="group flex items-center justify-between gap-2 cursor-pointer"
                onClick={() => aplicar(vista)}
              >
                <span className="truncate">{vista.name}</span>
                <button
                  type="button"
                  aria-label={translate("crm.saved_views.delete")}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(evento) => {
                    evento.stopPropagation();
                    eliminar(vista);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setDialogoAbierto(true)}
          >
            <Plus className="h-4 w-4" />
            {translate("crm.saved_views.save")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("crm.saved_views.save")}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={nombre}
            placeholder={translate("crm.saved_views.name_placeholder")}
            onChange={(evento) => setNombre(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter") {
                evento.preventDefault();
                guardar();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
              {translate("ra.action.cancel")}
            </Button>
            <Button onClick={guardar} disabled={!nombre.trim()}>
              {translate("ra.action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
