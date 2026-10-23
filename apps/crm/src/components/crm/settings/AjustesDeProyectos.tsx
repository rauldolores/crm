import { useTranslate } from "ra-core";
import { useWatch } from "react-hook-form";

import { ArrayInput } from "@/components/admin/array-input";
import { SelectInput } from "@/components/admin/select-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";
import { Card, CardContent } from "@/components/ui/card";
import { toSlug } from "@/lib/toSlug";

import { validarProyectos } from "../proyectos/proyectos";
import type { Project } from "../types";

/**
 * Ajustes → Proyectos: los productos o servicios de la organización, cada
 * uno con la dirección desde la que se escribe a sus clientes y en la que
 * se reciben sus correos. Uno es el predeterminado: el de las empresas sin
 * proyecto.
 */
export const AjustesDeProyectos = () => {
  const translate = useTranslate();
  const proyectos: Partial<Project>[] = useWatch({ name: "projects" }) ?? [];
  const opciones = proyectos
    .filter((p) => p?.label?.trim())
    .map((p) => ({ id: p.value || toSlug(p.label!), name: p.label! }));

  return (
    <Card id="projects">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.projects.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {translate("crm.projects.help")}
        </p>
        <ArrayInput
          source="projects"
          label={false}
          helperText={false}
          validate={(filas: Partial<Project>[] | undefined) => {
            const error = validarProyectos(filas);
            return error ? translate(error) : undefined;
          }}
        >
          <SimpleFormIterator disableReordering disableClear>
            <TextInput
              source="label"
              label="crm.projects.name"
              helperText={false}
            />
            <TextInput
              source="email"
              type="email"
              label="crm.projects.email"
              helperText="crm.projects.email_help"
            />
            <TextInput
              source="fromName"
              label="crm.projects.from_name"
              helperText={false}
            />
          </SimpleFormIterator>
        </ArrayInput>
        {opciones.length > 0 && (
          <SelectInput
            source="defaultProject"
            label="crm.projects.default"
            helperText="crm.projects.default_help"
            choices={opciones}
            validate={(valor: string) =>
              valor ? undefined : translate("crm.projects.default_required")
            }
          />
        )}
      </CardContent>
    </Card>
  );
};
