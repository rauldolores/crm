import { regex, required } from "ra-core";
import { NumberInput } from "@/components/admin/number-input";
import { TextInput } from "@/components/admin/text-input";
import { BooleanInput } from "@/components/admin/boolean-input";

const validarCodigoDeReferido = regex(
  /^[a-z0-9]+(-[a-z0-9]+)*$/,
  "crm.affiliates.validation.referral_code_format",
);

/**
 * Campos editables de un afiliado. La unicidad del código de referido la
 * impone el índice único de la base — este formulario solo valida el
 * formato (feedback inmediato); el rechazo por duplicado llega como error
 * del guardado.
 */
export const AffiliateInputs = () => (
  <div className="flex flex-col gap-4">
    <TextInput
      source="referral_code"
      label="crm.affiliates.fields.referral_code"
      helperText="crm.affiliates.fields.referral_code_help"
      validate={[required(), validarCodigoDeReferido]}
    />
    <NumberInput
      source="commission_percentage"
      label="crm.affiliates.fields.commission_percentage"
      helperText={false}
    />
    <BooleanInput
      source="active"
      label="crm.affiliates.fields.active"
      helperText={false}
    />
    <TextInput
      source="kontrolia_auth_user_id"
      label="crm.affiliates.fields.kontrolia_auth_user_id"
      helperText="crm.affiliates.fields.kontrolia_auth_user_id_help"
    />
  </div>
);
