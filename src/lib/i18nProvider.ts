import polyglotI18nProvider from "ra-i18n-polyglot";
import { mergeTranslations } from "ra-core";
import {
  spanishCoreMessages,
  spanishSupabaseMessages,
} from "@/components/crm/providers/commons/spanishCoreMessages";

// Proveedor por defecto de los componentes de shadcn-admin-kit. `<CRM>` inyecta
// el suyo, que además incluye los textos propios del CRM; este solo cubre los
// del framework, y es una instancia aparte para no compartir estado con él.
const catalogoDelFramework = mergeTranslations(
  spanishCoreMessages,
  spanishSupabaseMessages,
);

export const i18nProvider = polyglotI18nProvider(
  () => catalogoDelFramework,
  "es",
  [{ locale: "es", name: "Español" }],
  { allowMissing: true },
);
