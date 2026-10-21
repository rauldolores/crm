import { useTranslate } from "ra-core";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlantillaDeWhatsapp } from "@/lib/whatsapp/plantillas";
import { rellenarPlantilla } from "@/lib/whatsapp/plantillas";

interface PlantillaDeWhatsappInputsProps {
  plantillas: PlantillaDeWhatsapp[];
  /** Por qué no hay plantillas, cuando no es que no existan. */
  error: string | null;
  sid: string;
  onSidChange: (sid: string) => void;
  valores: Record<string, string>;
  onValorChange: (clave: string, valor: string) => void;
}

/**
 * Elegir una plantilla aprobada y rellenar sus variables, con la vista
 * previa de lo que le va a llegar al contacto. La vista previa usa la misma
 * función que el servidor al guardar la nota, así que lo que ves es lo que
 * se envía; una variable vacía se queda con sus llaves para que se note.
 */
export const PlantillaDeWhatsappInputs = ({
  plantillas,
  error,
  sid,
  onSidChange,
  valores,
  onValorChange,
}: PlantillaDeWhatsappInputsProps) => {
  const translate = useTranslate();
  const plantilla = plantillas.find((candidata) => candidata.sid === sid);

  if (plantillas.length === 0) {
    return (
      <div className="space-y-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <p>{translate("resources.contacts.send_whatsapp.no_templates")}</p>
        {error && <p className="text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="plantilla-whatsapp">
          {translate("resources.contacts.send_whatsapp.template")}
        </Label>
        <Select value={sid} onValueChange={onSidChange}>
          <SelectTrigger id="plantilla-whatsapp" className="w-full">
            <SelectValue
              placeholder={translate(
                "resources.contacts.send_whatsapp.choose_template",
              )}
            />
          </SelectTrigger>
          <SelectContent>
            {plantillas.map((opcion) => (
              <SelectItem key={opcion.sid} value={opcion.sid}>
                {opcion.nombre}
                {opcion.idioma ? ` · ${opcion.idioma}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {plantilla && plantilla.variables.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {plantilla.variables.map(({ clave, ejemplo }) => (
            <div key={clave} className="space-y-1.5">
              <Label htmlFor={`variable-${clave}`}>{`{{${clave}}}`}</Label>
              <Input
                id={`variable-${clave}`}
                value={valores[clave] ?? ""}
                placeholder={ejemplo}
                maxLength={1000}
                onChange={(evento) => onValorChange(clave, evento.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {plantilla && (
        <div className="space-y-1.5">
          <Label>{translate("resources.contacts.send_whatsapp.preview")}</Label>
          <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
            {rellenarPlantilla(plantilla.cuerpo, valores)}
          </p>
        </div>
      )}
    </div>
  );
};
