import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";

/**
 * El logo de la cabecera de las cotizaciones: se sube y ya.
 *
 * Antes era un campo de texto con la URL, que obligaba a tener el logo
 * publicado en algún sitio. El valor guardado sigue siendo una URL —la del
 * archivo subido— para que el PDF y la página pública no cambien.
 */
export const SubidorDeLogo = ({ source }: { source: string }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { setValue } = useFormContext();
  const url = useWatch({ name: source }) as string | undefined;
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const subir = async (archivo: File) => {
    setSubiendo(true);
    try {
      const cuerpo = new FormData();
      cuerpo.append("archivo", archivo);
      const token = await getKontroliaAccessToken();
      const respuesta = await fetch("/api/cotizaciones/logo", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: cuerpo,
      });
      const datos = (await respuesta.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };
      if (!respuesta.ok || !datos.url) {
        notify(datos.message ?? translate("crm.quotes.settings.logo_error"), {
          type: "error",
        });
        return;
      }
      // Queda en el formulario; se guarda con el resto del emisor.
      setValue(source, datos.url, { shouldDirty: true });
      notify("crm.quotes.settings.logo_uploaded", { type: "info" });
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{translate("crm.quotes.settings.issuer_logo")}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {url ? (
          <img
            src={url}
            alt={translate("crm.quotes.settings.issuer_logo")}
            className="h-12 w-auto max-w-40 rounded border bg-white object-contain p-1"
          />
        ) : (
          <div className="flex h-12 w-40 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
            {translate("crm.quotes.settings.logo_empty")}
          </div>
        )}
        <input
          ref={entrada}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(evento) => {
            const archivo = evento.target.files?.[0];
            if (archivo) void subir(archivo);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={subiendo}
          onClick={() => entrada.current?.click()}
        >
          {subiendo ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {translate(
            url
              ? "crm.quotes.settings.logo_replace"
              : "crm.quotes.settings.logo_upload",
          )}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setValue(source, "", { shouldDirty: true })}
          >
            <Trash2 className="h-4 w-4" />
            {translate("crm.quotes.settings.logo_remove")}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {translate("crm.quotes.settings.logo_help")}
      </p>
    </div>
  );
};
