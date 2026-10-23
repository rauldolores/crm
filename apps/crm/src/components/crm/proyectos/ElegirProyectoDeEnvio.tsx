import { useTranslate } from "ra-core";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Project } from "../types";

/**
 * El selector «Enviar desde», solo cuando hay entre qué elegir (ver
 * useProyectosParaElegir).
 */
export const ElegirProyectoDeEnvio = ({
  opciones,
  valor,
  alCambiar,
}: {
  opciones: Project[];
  valor: string;
  alCambiar: (valor: string) => void;
}) => {
  const translate = useTranslate();
  if (opciones.length < 2) return null;
  return (
    <div className="space-y-1.5">
      <Label htmlFor="proyecto-de-envio">
        {translate("crm.projects.send_from")}
      </Label>
      <Select value={valor} onValueChange={alCambiar}>
        <SelectTrigger id="proyecto-de-envio">
          <SelectValue placeholder={translate("crm.projects.send_from_pick")} />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((proyecto) => (
            <SelectItem key={proyecto.value} value={proyecto.value}>
              {proyecto.email
                ? `${proyecto.label} · ${proyecto.email}`
                : proyecto.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
