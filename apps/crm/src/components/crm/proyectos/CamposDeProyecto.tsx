import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { SelectInput } from "@/components/admin/select-input";

import { useConfigurationContext } from "../root/ConfigurationContext";

/**
 * Las piezas de formulario para los proyectos de la
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
