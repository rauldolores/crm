import { useRecordContext, useTranslate } from "ra-core";

import { BooleanInput } from "@/components/admin/boolean-input";
import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { CustomFieldDefinition, CustomFieldValues } from "../types";
import { AsideSection } from "./AsideSection";

/**
 * Campos personalizados definidos por la organización, para formularios y
 * fichas de contactos, empresas y oportunidades.
 *
 * Las definiciones viven en la configuración (Ajustes → Campos
 * personalizados); los valores capturados van en la columna JSONB
 * `custom_fields` de cada registro, con el `value` del campo como clave. Si la
 * organización no definió campos para la entidad, no se pinta nada.
 */

export type EntidadConCampos = "contact" | "company" | "deal";

const useCamposDeEntidad = (
  entidad: EntidadConCampos,
): CustomFieldDefinition[] => {
  const { contactCustomFields, companyCustomFields, dealCustomFields } =
    useConfigurationContext();
  if (entidad === "contact") return contactCustomFields ?? [];
  if (entidad === "company") return companyCustomFields ?? [];
  return dealCustomFields ?? [];
};

const CampoInput = ({ campo }: { campo: CustomFieldDefinition }) => {
  const source = `custom_fields.${campo.value}`;
  switch (campo.type) {
    case "number":
      return (
        <NumberInput source={source} label={campo.label} helperText={false} />
      );
    case "date":
      return (
        <DateInput source={source} label={campo.label} helperText={false} />
      );
    case "checkbox":
      return (
        <BooleanInput source={source} label={campo.label} helperText={false} />
      );
    case "list":
      return (
        <SelectInput
          source={source}
          label={campo.label}
          helperText={false}
          choices={(campo.options ?? []).map((opcion) => ({
            id: opcion,
            name: opcion,
          }))}
          translateChoice={false}
        />
      );
    default:
      return (
        <TextInput source={source} label={campo.label} helperText={false} />
      );
  }
};

/** Los inputs de los campos personalizados de una entidad, para formularios. */
export const CamposPersonalizadosInput = ({
  entidad,
}: {
  entidad: EntidadConCampos;
}) => {
  const translate = useTranslate();
  const campos = useCamposDeEntidad(entidad);
  if (campos.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("crm.custom_fields.title")}
      </h6>
      {campos.map((campo) => (
        <CampoInput key={campo.value} campo={campo} />
      ))}
    </div>
  );
};

const formatearValor = (
  campo: CustomFieldDefinition,
  valor: string | number | boolean,
  translate: (key: string, options?: object) => string,
): string => {
  if (campo.type === "checkbox") {
    return valor
      ? translate("ra.boolean.true", { _: "Sí" })
      : translate("ra.boolean.false", { _: "No" });
  }
  if (campo.type === "date" && typeof valor === "string" && valor) {
    // La fecha se guarda como "aaaa-mm-dd"; se interpreta como fecha local
    // para que no retroceda un día por la zona horaria.
    const fecha = new Date(`${valor}T00:00:00`);
    if (!Number.isNaN(fecha.getTime())) return fecha.toLocaleDateString();
  }
  return String(valor);
};

/** Los valores de los campos personalizados de una ficha, para pantallas de detalle. */
export const CamposPersonalizadosField = ({
  entidad,
}: {
  entidad: EntidadConCampos;
}) => {
  const translate = useTranslate();
  const campos = useCamposDeEntidad(entidad);
  const record = useRecordContext<{ custom_fields?: CustomFieldValues }>();
  if (campos.length === 0 || !record) return null;

  const valores = record.custom_fields ?? {};
  const conValor = campos.filter(
    (campo) =>
      valores[campo.value] !== undefined &&
      valores[campo.value] !== null &&
      valores[campo.value] !== "",
  );
  if (conValor.length === 0) return null;

  return (
    <AsideSection title={translate("crm.custom_fields.title")}>
      {conValor.map((campo) => (
        <div key={campo.value} className="flex justify-between gap-2 text-sm">
          <span className="text-muted-foreground">{campo.label}</span>
          <span className="text-right">
            {formatearValor(campo, valores[campo.value], translate)}
          </span>
        </div>
      ))}
    </AsideSection>
  );
};
