import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import { PlanEnterpriseCard } from "./PlanEnterpriseCard";

const traducciones: Record<string, string> = {
  "crm.billing.enterprise.name": "Plan Enterprise",
  "crm.billing.enterprise.tagline": "Te generamos la cotización a tu medida",
  "crm.billing.enterprise.custom_quote": "A tu medida",
  "crm.billing.enterprise.side_by_side": "Trabajamos hombro con hombro",
  "crm.billing.enterprise.features.dedicated": "Infraestructura propia",
  "crm.billing.enterprise.features.sla": "SLA",
  "crm.billing.enterprise.features.integrations": "Integraciones",
  "crm.billing.enterprise.features.custom_deploys":
    "Despliegues personalizados",
  "crm.billing.enterprise.features.large_teams": "Grandes equipos",
  "crm.billing.enterprise.features.custom_projects": "Proyectos particulares",
  "crm.billing.enterprise.action": "Quiero ser contactado",
  "crm.billing.enterprise.dialog_title": "Plan Enterprise",
  "crm.billing.enterprise.dialog_description":
    "Cuéntanos de tu proyecto y te contactamos.",
  "crm.billing.enterprise.name_field": "Tu nombre",
  "crm.billing.enterprise.company_field": "Empresa",
  "crm.billing.enterprise.email_field": "Correo de contacto",
  "crm.billing.enterprise.phone_field": "Teléfono o WhatsApp (opcional)",
  "crm.billing.enterprise.mode_field": "Modalidad",
  "crm.billing.enterprise.mode_cloud": "Nube dedicada",
  "crm.billing.enterprise.mode_onpremise": "En tus servidores",
  "crm.billing.enterprise.users_field": "Usuarios que entrarían al CRM",
  "crm.billing.enterprise.users_help": "De aquí sale la banda de precio.",
  "crm.billing.enterprise.message_field": "Cuéntanos de tu proyecto",
  "crm.billing.enterprise.message_placeholder": "Infraestructura, equipo...",
  "crm.billing.enterprise.cancel": "Cancelar",
  "crm.billing.enterprise.send": "Enviar",
  "crm.billing.enterprise.sending": "Enviando...",
  "crm.billing.enterprise.success": "Listo, en breve te contactamos",
  "crm.billing.enterprise.error": "No se pudo enviar tu mensaje",
};

const contactarPlanEnterprise = vi.fn().mockResolvedValue(undefined);

const dataProvider = {
  ...fakeDataProvider({
    sales: [{ id: "1", first_name: "Raúl", email: "raul@kontrolia.io" }],
  }),
  contactarPlanEnterprise,
} as ReturnType<typeof fakeDataProvider> & {
  contactarPlanEnterprise: typeof contactarPlanEnterprise;
};

const authProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getIdentity: () => Promise.resolve({ id: "1", fullName: "Raúl Dolores" }),
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CoreAdminContext
    dataProvider={dataProvider}
    authProvider={authProvider}
    i18nProvider={{
      translate: (key, options) => traducciones[key] ?? options?._ ?? key,
      changeLocale: () => Promise.resolve(),
      getLocale: () => "es",
    }}
  >
    {children}
  </CoreAdminContext>
);

describe("PlanEnterpriseCard", () => {
  beforeEach(() => {
    contactarPlanEnterprise.mockClear();
  });

  it("muestra el nombre del plan y sus características", async () => {
    // Arrange & Act
    const screen = await render(<PlanEnterpriseCard />, { wrapper: Wrapper });

    // Assert
    await expect
      .element(screen.getByText("Plan Enterprise"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Infraestructura propia"))
      .toBeInTheDocument();
    await expect.element(screen.getByText("SLA")).toBeInTheDocument();
  });

  it("precarga el nombre de la sesión activa al abrir el diálogo", async () => {
    const screen = await render(<PlanEnterpriseCard />, { wrapper: Wrapper });

    await screen.getByText("Quiero ser contactado").click();

    await expect
      .element(screen.getByLabelText("Tu nombre"))
      .toHaveValue("Raúl Dolores");
  });

  it("precarga el correo de la ficha de quien está dentro", async () => {
    const screen = await render(<PlanEnterpriseCard />, { wrapper: Wrapper });

    await screen.getByText("Quiero ser contactado").click();

    await expect
      .element(screen.getByLabelText("Correo de contacto"))
      .toHaveValue("raul@kontrolia.io");
  });

  it("no deja enviar sin empresa", async () => {
    const screen = await render(<PlanEnterpriseCard />, { wrapper: Wrapper });

    await screen.getByText("Quiero ser contactado").click();
    await screen.getByLabelText("Empresa").fill("");

    await expect.element(screen.getByText("Enviar")).toBeDisabled();
  });

  it("envía los mismos campos que el formulario del sitio", async () => {
    const screen = await render(<PlanEnterpriseCard />, { wrapper: Wrapper });

    await screen.getByText("Quiero ser contactado").click();
    await screen.getByLabelText("Empresa").fill("Tecmilenio");
    await screen
      .getByLabelText("Teléfono o WhatsApp (opcional)")
      .fill("5512345678");
    await screen.getByLabelText("Usuarios que entrarían al CRM").fill("120");
    await screen.getByRole("radio", { name: /En tus servidores/ }).click();
    await screen
      .getByLabelText("Cuéntanos de tu proyecto")
      .fill("Necesitamos infraestructura propia para 500 usuarios.");
    await screen.getByText("Enviar").click();

    await expect
      .poll(() => contactarPlanEnterprise.mock.calls.length)
      .toBeGreaterThan(0);
    expect(contactarPlanEnterprise).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Raúl Dolores",
        empresa: "Tecmilenio",
        email: "raul@kontrolia.io",
        telefono: "5512345678",
        modalidad: "onpremise",
        usuarios: 120,
        mensaje: "Necesitamos infraestructura propia para 500 usuarios.",
      }),
    );
    // El diálogo se cierra solo al terminar con éxito.
    await expect
      .element(screen.getByLabelText("Tu nombre"))
      .not.toBeInTheDocument();
  });
});
