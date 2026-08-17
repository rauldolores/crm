import { mergeTranslations } from "ra-core";
import polyglotI18nProvider from "ra-i18n-polyglot";
import {
  spanishCoreMessages,
  spanishSupabaseMessages,
} from "./spanishCoreMessages";
import { spanishCrmMessages } from "./spanishCrmMessages";

/**
 * Kontrolia CRM es una aplicación en español y solo en español: no hay
 * selector de idioma ni catálogos alternativos. El proveedor de i18n se
 * conserva porque ra-core lo exige para resolver las claves de traducción,
 * pero siempre devuelve el mismo catálogo.
 */
const spanishCatalog = mergeTranslations(
  spanishCoreMessages,
  spanishSupabaseMessages,
  spanishCrmMessages,
);

const createSpanishI18nProvider = () =>
  polyglotI18nProvider(
    () => spanishCatalog,
    "es",
    [{ locale: "es", name: "Español" }],
    { allowMissing: true },
  );

export const i18nProvider = createSpanishI18nProvider();

/**
 * Instancia aparte para los tests: el proveedor guarda estado interno (el
 * idioma actual), así que compartir la instancia de la aplicación haría que
 * un test pudiera afectar a otro.
 */
export const testI18nProvider = createSpanishI18nProvider();
