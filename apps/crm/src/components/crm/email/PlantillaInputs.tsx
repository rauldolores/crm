import DOMPurify from "dompurify";
import { ImagePlus, Sparkles, Wand2 } from "lucide-react";
import { required, useNotify, useTranslate } from "ra-core";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { TextInput } from "@/components/admin/text-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { llamarApi } from "../misc/llamarApi";
import { camposDeFusion, tokenDeCampo } from "./camposDeFusion";
import {
  COLOR_PRINCIPAL_POR_DEFECTO,
  envolverEnPlantilla,
} from "./plantillaBase";
import { EditorVisual } from "./EditorVisual";

/**
 * Formulario de una plantilla de correo: nombre, asunto, cuerpo con el editor
 * visual, los campos de fusión que se pueden insertar y la generación con IA.
 *
 * La vista previa se sanea con DOMPurify antes de pintarla. El HTML puede
 * venir de la IA o pegado de fuera, y aquí se inyecta en el DOM de la
 * aplicación: sin sanear, un `<img onerror=...>` se ejecutaría con la sesión
 * de quien esté editando.
 */

const ENTIDADES = [
  { clave: "contacto", etiqueta: "crm.email_templates.entity_contact" },
  { clave: "empresa", etiqueta: "crm.email_templates.entity_company" },
  { clave: "oportunidad", etiqueta: "crm.email_templates.entity_deal" },
] as const;

export const PlantillaInputs = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const { setValue } = useFormContext();
  const { contactCustomFields, companyCustomFields, dealCustomFields } =
    useConfigurationContext();

  const cuerpo = (useWatch({ name: "body_html" }) as string) ?? "";
  const logoUrl = (useWatch({ name: "logo_url" }) as string | null) ?? null;
  const color =
    (useWatch({ name: "accent_color" }) as string | null) ??
    COLOR_PRINCIPAL_POR_DEFECTO;
  const ctaTexto = (useWatch({ name: "cta_text" }) as string | null) ?? null;
  const ctaUrl = (useWatch({ name: "cta_url" }) as string | null) ?? null;
  const pie = (useWatch({ name: "footer_text" }) as string | null) ?? null;
  const [descripcion, setDescripcion] = useState("");
  const [generando, setGenerando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  // El editor entrega su forma de insertar en la posición del cursor.
  const insertarEnEditor = useRef<((texto: string) => void) | null>(null);
  const recibirInsertador = useCallback((fn: (texto: string) => void) => {
    insertarEnEditor.current = fn;
  }, []);

  const campos = useMemo(
    () =>
      camposDeFusion({
        contacto: contactCustomFields,
        empresa: companyCustomFields,
        oportunidad: dealCustomFields,
      }),
    [contactCustomFields, companyCustomFields, dealCustomFields],
  );

  const insertarCampo = (clave: string) => {
    const token = tokenDeCampo(clave);
    if (insertarEnEditor.current) {
      insertarEnEditor.current(token);
    } else {
      setValue("body_html", `${cuerpo}${token}`, { shouldDirty: true });
    }
  };

  /**
   * Sube el logo por /api/attachments —la ruta que ya usa el CRM para los
   * adjuntos— y lo mete al principio del cuerpo. Se guarda además en
   * `logo_url` para poder pasárselo a la IA cuando regenere.
   */
  const subirLogo = async (archivo: File) => {
    setSubiendoLogo(true);
    try {
      const base64 = await new Promise<string>((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () =>
          resolver(String(lector.result).split(",")[1] ?? "");
        lector.onerror = () =>
          rechazar(new Error("No se pudo leer el archivo."));
        lector.readAsDataURL(archivo);
      });

      const subido = await llamarApi<{ src: string }>("/api/attachments", {
        method: "POST",
        body: JSON.stringify({
          filename: archivo.name,
          contentType: archivo.type,
          contentBase64: base64,
        }),
      });

      // No se inserta en el cuerpo: la plantilla lo coloca sola en la
      // cabecera, que es donde va en un correo con diseño. Metido en el
      // cuerpo, cualquier retoque del editor lo movería de sitio.
      setValue("logo_url", subido.src, { shouldDirty: true });
      notify("crm.email_templates.logo_uploaded", { type: "info" });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setSubiendoLogo(false);
    }
  };

  const generar = async () => {
    if (!descripcion.trim()) return;
    setGenerando(true);
    try {
      const generado = await llamarApi<{
        asunto: string;
        html: string;
        ctaTexto?: string;
        ctaUrl?: string;
        colorPrincipal?: string;
        pie?: string;
      }>("/api/plantillas/generar", {
        method: "POST",
        body: JSON.stringify({
          descripcion,
          logoUrl: logoUrl ?? undefined,
          campos: campos.map((c) => ({
            clave: c.clave,
            etiqueta: c.etiqueta,
          })),
        }),
      });
      setValue("subject", generado.asunto, { shouldDirty: true });
      setValue("body_html", generado.html, { shouldDirty: true });
      // El diseño solo se pisa si el modelo lo propuso: si se lo salta, se
      // conserva lo que ya tuviera la plantilla.
      if (generado.ctaTexto) {
        setValue("cta_text", generado.ctaTexto, { shouldDirty: true });
      }
      if (generado.ctaUrl) {
        setValue("cta_url", generado.ctaUrl, { shouldDirty: true });
      }
      if (generado.colorPrincipal) {
        setValue("accent_color", generado.colorPrincipal, {
          shouldDirty: true,
        });
      }
      if (generado.pie) {
        setValue("footer_text", generado.pie, { shouldDirty: true });
      }
      notify("crm.email_templates.generated", { type: "info" });
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setGenerando(false);
    }
  };

  // La vista previa arma el correo con la MISMA función que lo envía, para
  // que lo que se ve aquí sea lo que llega. Se sanea después de envolver
  // porque este HTML entra en el DOM de la aplicación.
  const vistaPrevia = useMemo(
    () =>
      DOMPurify.sanitize(
        envolverEnPlantilla({
          contenidoHtml: cuerpo,
          logoUrl,
          colorPrincipal: color,
          ctaTexto,
          ctaUrl,
          piePersonalizado: pie,
        }),
        { WHOLE_DOCUMENT: true },
      ),
    [cuerpo, logoUrl, color, ctaTexto, ctaUrl, pie],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <TextInput
          source="name"
          label="crm.email_templates.fields.name"
          validate={required()}
          helperText={false}
        />
        <TextInput
          source="subject"
          label="crm.email_templates.fields.subject"
          validate={required()}
          helperText="crm.email_templates.fields.subject_help"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            {translate("crm.email_templates.ai_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {translate("crm.email_templates.ai_intro")}
          </p>
          <Textarea
            rows={3}
            value={descripcion}
            placeholder={translate("crm.email_templates.ai_placeholder")}
            onChange={(evento) => setDescripcion(evento.target.value)}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!descripcion.trim() || generando}
              onClick={generar}
            >
              <Wand2 className="mr-1 h-4 w-4" />
              {translate(
                generando
                  ? "crm.email_templates.generating"
                  : "crm.email_templates.generate",
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">
            {translate("crm.email_templates.fields.body")}
          </p>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent">
            <ImagePlus className="h-3.5 w-3.5" />
            {translate(
              subiendoLogo
                ? "crm.email_templates.uploading_logo"
                : "crm.email_templates.upload_logo",
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={subiendoLogo}
              onChange={(evento) => {
                const archivo = evento.target.files?.[0];
                // Se limpia el input para poder volver a elegir el MISMO
                // archivo: sin esto el navegador no dispara onChange otra vez.
                evento.target.value = "";
                if (archivo) subirLogo(archivo);
              }}
            />
          </label>
        </div>
        <EditorVisual
          value={cuerpo}
          onChange={(html) =>
            setValue("body_html", html, { shouldDirty: true })
          }
          onInsertarCampo={recibirInsertador}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          {translate("crm.email_templates.merge_fields")}
        </p>
        <p className="text-xs text-muted-foreground">
          {translate("crm.email_templates.merge_fields_help")}
        </p>
        {ENTIDADES.map((entidad) => {
          const suyos = campos.filter((c) => c.entidad === entidad.clave);
          if (suyos.length === 0) return null;
          return (
            <div
              key={entidad.clave}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="w-24 shrink-0 text-xs text-muted-foreground">
                {translate(entidad.etiqueta)}
              </span>
              {suyos.map((campo) => (
                <Button
                  key={campo.clave}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => insertarCampo(campo.clave)}
                >
                  {campo.etiqueta}
                </Button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium">
          {translate("crm.email_templates.design")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            source="cta_text"
            label="crm.email_templates.fields.cta_text"
            helperText="crm.email_templates.fields.cta_text_help"
          />
          <TextInput
            source="cta_url"
            label="crm.email_templates.fields.cta_url"
            helperText={false}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            source="accent_color"
            label="crm.email_templates.fields.accent_color"
            helperText="crm.email_templates.fields.accent_color_help"
            placeholder={COLOR_PRINCIPAL_POR_DEFECTO}
          />
          <TextInput
            source="footer_text"
            label="crm.email_templates.fields.footer_text"
            helperText={false}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          {translate("crm.email_templates.preview")}
        </p>
        <div
          className="overflow-hidden rounded-md border"
          dangerouslySetInnerHTML={{ __html: vistaPrevia }}
        />
      </div>

      <BooleanInput
        source="active"
        label="crm.email_templates.fields.active"
        helperText={false}
      />
    </div>
  );
};
