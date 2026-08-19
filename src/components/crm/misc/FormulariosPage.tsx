import { Check, Code2, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import type { PublicForm } from "../types";

/**
 * Alta y administración de formularios públicos de captación: un enlace o un
 * iframe que el cliente pega en su propia web, para que le lleguen contactos
 * solo sin que nadie del equipo los teclee a mano.
 */
export const FormulariosPage = () => {
  const translate = useTranslate();
  const [nombre, setNombre] = useState("");
  const [create, { isPending: creando }] = useCreate();
  const { data: formularios, refetch } = useGetList<PublicForm>(
    "public_forms",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "created_at", order: "ASC" },
    },
  );

  const agregar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    await create(
      "public_forms",
      { data: { name: nombreLimpio } },
      { returnPromise: true },
    );
    setNombre("");
    refetch();
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.public_forms.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.public_forms.intro")}
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={nombre}
          placeholder={translate("crm.public_forms.name_placeholder")}
          onChange={(evento) => setNombre(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              evento.preventDefault();
              agregar();
            }
          }}
        />
        <Button onClick={agregar} disabled={!nombre.trim() || creando}>
          <Plus className="h-4 w-4 mr-1" />
          {translate("crm.public_forms.add")}
        </Button>
      </div>

      {(formularios ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {translate("crm.public_forms.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {(formularios ?? []).map((formulario) => (
            <TarjetaDeFormulario
              key={formulario.id}
              formulario={formulario}
              alCambiar={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

FormulariosPage.path = "/formularios";

const TarjetaDeFormulario = ({
  formulario,
  alCambiar,
}: {
  formulario: PublicForm;
  alCambiar: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const [copiado, setCopiado] = useState<"enlace" | "iframe" | null>(null);

  const origen = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origen}/f/${formulario.slug}`;
  const fragmentoIframe = `<iframe src="${url}" width="100%" height="600" style="border:0"></iframe>`;

  const copiar = async (texto: string, cual: "enlace" | "iframe") => {
    await navigator.clipboard.writeText(texto);
    setCopiado(cual);
    notify("crm.common.copied", { type: "info" });
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Switch
          checked={formulario.active}
          aria-label={translate("crm.public_forms.toggle")}
          onCheckedChange={async () => {
            await update("public_forms", {
              id: formulario.id,
              data: { active: !formulario.active },
              previousData: formulario,
            });
            alCambiar();
          }}
        />
        <p className="flex-1 font-medium text-sm">{formulario.name}</p>
        <Button
          variant="ghost"
          size="icon"
          aria-label={translate("ra.action.delete")}
          className="text-muted-foreground hover:text-destructive"
          onClick={async () => {
            await deleteOne("public_forms", {
              id: formulario.id,
              previousData: formulario,
            });
            notify("crm.public_forms.deleted", { type: "info" });
            alCambiar();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
          {url}
        </code>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => window.open(url, "_blank")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {translate("crm.public_forms.open")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => copiar(url, "enlace")}
        >
          {copiado === "enlace" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {translate("crm.public_forms.copy_link")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => copiar(fragmentoIframe, "iframe")}
        >
          {copiado === "iframe" ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Code2 className="h-3.5 w-3.5" />
          )}
          {translate("crm.public_forms.copy_iframe")}
        </Button>
      </div>
    </div>
  );
};
