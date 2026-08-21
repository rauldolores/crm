import { describe, expect, it } from "vitest";
import { i18nProvider } from "./i18nProvider";

describe("i18nProvider", () => {
  it("solo registra el español", () => {
    expect(i18nProvider.getLocales?.()).toEqual([
      { locale: "es", name: "Español" },
    ]);
  });

  it("traduce las claves propias del CRM", () => {
    expect(i18nProvider.translate("resources.deals.empty.title")).toBe(
      "No hay oportunidades",
    );
  });

  it("traduce las claves del framework", () => {
    expect(i18nProvider.translate("ra.action.save")).toBe("Guardar");
  });

  it("traduce las claves de autenticación de Supabase", () => {
    expect(i18nProvider.translate("ra-supabase.auth.back_to_login")).toBe(
      "Volver al inicio de sesión",
    );
  });

  it("resuelve los plurales en español", () => {
    expect(
      i18nProvider.translate("resources.companies.nb_contacts", {
        smart_count: 1,
      }),
    ).toBe("1 contacto");
    expect(
      i18nProvider.translate("resources.companies.nb_contacts", {
        smart_count: 3,
      }),
    ).toBe("3 contactos");
  });

  it("sustituye los marcadores de variables", () => {
    expect(
      i18nProvider.translate("resources.contacts.position_at_company", {
        title: "Directora comercial",
        company: "Acme",
      }),
    ).toBe("Directora comercial en Acme");
  });

  it("sigue en español aunque se pida otro idioma", async () => {
    await i18nProvider.changeLocale("en");

    expect(i18nProvider.translate("ra.action.save")).toBe("Guardar");
  });
});
