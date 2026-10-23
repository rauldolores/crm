import { useRecordContext, useTranslate } from "ra-core";

import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { SelectInput } from "@/components/admin/select-input";
import { Badge } from "@/components/ui/badge";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { etiquetaDeProyecto } from "./proyectos";

/**
 * Las piezas de formulario y de ficha para los proyectos de la
 * organización. Sin proyectos configurados no pintan nada: una organización
 * que vende un solo producto no tiene por qué verlos.
 */

const useOpciones = () => {
  const { projects } = useConfigurationContext();
  return projects.map((p) => ({ id: p.value, name: p.label }));
};

/** Los proyectos de una empresa (uno o varios). */
export const ProyectosInput = () => {
  const opciones = useOpciones();
  if (!opciones.length) return null;
  return (
    <AutocompleteArrayInput
      source="projects"
      label="crm.projects.field_many"
      helperText="crm.projects.company_help"
      choices={opciones}
    />
  );
};

/** El proyecto de una oportunidad o de una plantilla (uno solo). */
export const ProyectoInput = ({ helperText }: { helperText?: string }) => {
  const opciones = useOpciones();
  if (!opciones.length) return null;
  return (
    <SelectInput
      source="project"
      label="crm.projects.field_one"
      helperText={helperText ?? false}
      choices={opciones}
      emptyText="crm.projects.no_project"
    />
  );
};

/** Insignias con los proyectos del registro (`projects` o `project`). */
export const ProyectosField = () => {
  const record = useRecordContext<{
    projects?: string[] | null;
    project?: string | null;
  }>();
  const { projects } = useConfigurationContext();
  const translate = useTranslate();
  const valores = record?.projects ?? (record?.project ? [record.project] : []);
  if (!projects.length || !valores.length) return null;
  return (
    <div
      className="flex flex-wrap gap-1"
      aria-label={translate("crm.projects.title")}
    >
      {valores.map((valor) => (
        <Badge key={valor} variant="outline">
          {etiquetaDeProyecto(projects, valor)}
        </Badge>
      ))}
    </div>
  );
};
