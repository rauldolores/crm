import "@/index.css";
import React from "react";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { CoreAdminContext } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import type {
  KontroliaEntitlements,
  KontroliaPlan,
} from "@/lib/kontrolia-auth/facturacion";

vi.mock("@/lib/kontrolia-auth/facturacion", () => ({
  getPlans: vi.fn(),
  startCheckout: vi.fn(),
  openBillingPortal: vi.fn(),
  esAdministradorDeLaOrganizacion: vi.fn().mockResolvedValue(true),
  ErrorDeFacturacion: class extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
}));
vi.mock("@/lib/env", () => ({
  env: { kontroliaApplicationSlug: "crm", kontroliaAuthServerUrl: "https://a" },
}));
vi.mock("./PlanEnterpriseCard", () => ({ PlanEnterpriseCard: () => null }));

import { getPlans, startCheckout } from "@/lib/kontrolia-auth/facturacion";
import { PlanesDisponibles } from "./PlanesDisponibles";

const getPlansMock = vi.mocked(getPlans);
const startCheckoutMock = vi.mocked(startCheckout);

const plan = (
  slug: string,
  name: string,
  priceAmount: number,
  yearlyPriceAmount: number | null,
  extra: Partial<KontroliaPlan> = {},
): KontroliaPlan =>
  ({
    id: slug,
    applicationId: "a",
    slug,
    name,
    description: null,
    priceAmount,
    yearlyPriceAmount,
    currency: "MXN",
    billingInterval: "month",
    trialDays: 0,
    features: [],
    isDefault: false,
    isActive: true,
    sortOrder: 0,
    permissions: [],
    limits: [],
    ...extra,
  }) as KontroliaPlan;

// El catálogo real de Vinqulia: anual = 10 mensualidades (ahorra 17 %).
const catalogo = [
  plan("plan-inicio", "Plan Impulso", 49900, 499000, {
    sortOrder: 0,
    trialDays: 30,
    features: ["Hasta 3 usuarios.", "contactos", "empresas", "1 pipeline"],
  }),
  plan("plan-pro", "Plan Pro", 99900, 999000, {
    sortOrder: 1,
    features: ["Hasta 10 usuarios.", "varios pipelines", "automatizaciones"],
  }),
  plan("plan-max", "Plan Max", 199900, 1999000, {
    sortOrder: 2,
    features: ["Hasta 25 usuarios.", "soporte prioritario"],
  }),
];

const derechosConProMensual = {
  subscription: {
    planSlug: "plan-pro",
    planName: "Plan Pro",
    billingInterval: "month",
    provider: "stripe",
    status: "active",
  },
  plansRequired: true,
  access: "ok",
  usage: [],
} as unknown as KontroliaEntitlements;

const traducciones: Record<string, string> = {
  "crm.billing.interval_monthly": "Mensual",
  "crm.billing.interval_yearly": "Anual",
  "crm.billing.per_year": "al año",
  "crm.billing.yearly_equivalent": "equivale a %{amount} al mes",
  "crm.billing.save_percent": "Ahorra %{percent}%",
  "crm.billing.switch_to_yearly": "Cambiar a anual",
  "crm.billing.switch_to_monthly": "Cambiar a mensual",
  "crm.billing.current_plan": "Plan actual",
  "crm.billing.choose_plan": "Elegir este plan",
  "crm.billing.loading_plans": "Cargando planes…",
  "crm.billing.trial_days": "%{smart_count} días de prueba",
};

const interpolar = (texto: string, opciones?: Record<string, unknown>) =>
  texto.replace(/%\{(\w+)\}/g, (_, clave: string) =>
    String(opciones?.[clave] ?? ""),
  );

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CoreAdminContext
    dataProvider={fakeDataProvider({})}
    authProvider={{
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
      checkAuth: () => Promise.resolve(),
      checkError: () => Promise.resolve(),
    }}
    i18nProvider={{
      translate: (key, options) =>
        traducciones[key] ? interpolar(traducciones[key], options) : key,
      changeLocale: () => Promise.resolve(),
      getLocale: () => "es",
    }}
  >
    <div className="p-6" style={{ width: 1100 }}>
      {children}
    </div>
  </CoreAdminContext>
);

describe("PlanesDisponibles: mensual / anual", () => {
  beforeEach(() => {
    page.viewport(1200, 900);
    getPlansMock.mockReset().mockResolvedValue(catalogo);
    // Rechaza a propósito: con éxito la pantalla navega a Stripe y se
    // llevaría el iframe de la prueba. Lo que se comprueba es la petición.
    startCheckoutMock
      .mockReset()
      .mockRejectedValue(new Error("Detenido por la prueba"));
  });

  it("arranca en Mensual con los precios mensuales, y marca el plan actual", async () => {
    // Arrange & Act
    const screen = await render(
      <PlanesDisponibles derechos={derechosConProMensual} />,
      { wrapper: Wrapper },
    );

    // Assert
    await expect.element(screen.getByText("$999.00 MXN")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Plan actual" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("radio", { name: "Mensual" }))
      .toHaveAttribute("data-state", "on");
  });

  it("con Anual muestra el precio al año, el ahorro y «Cambiar a anual» en el plan actual mensual", async () => {
    const screen = await render(
      <PlanesDisponibles derechos={derechosConProMensual} />,
      { wrapper: Wrapper },
    );

    await screen.getByRole("radio", { name: "Anual" }).click();

    await expect.element(screen.getByText("$9,990.00 MXN")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Ahorra 17%").first())
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("equivale a $832.50 MXN al mes"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Cambiar a anual" }))
      .toBeEnabled();
  });

  it("comprar en Anual manda interval «year»; un plan sin precio anual sigue mensual", async () => {
    getPlansMock.mockResolvedValue([
      catalogo[1],
      plan("plan-solo-mensual", "Plan Básico", 29900, null, { sortOrder: 9 }),
    ]);
    const screen = await render(<PlanesDisponibles derechos={null} />, {
      wrapper: Wrapper,
    });

    await screen.getByRole("radio", { name: "Anual" }).click();
    const botones = screen.getByRole("button", { name: "Elegir este plan" });
    await botones.first().click();
    await vi.waitFor(() =>
      expect(startCheckoutMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ planSlug: "plan-pro", interval: "year" }),
      ),
    );

    // El plan sin opción anual conserva su precio mensual y se compra al mes.
    await expect.element(screen.getByText("$299.00 MXN")).toBeInTheDocument();
    await botones.last().click();
    await vi.waitFor(() =>
      expect(startCheckoutMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          planSlug: "plan-solo-mensual",
          interval: "month",
        }),
      ),
    );
  });

  it("sin ningún plan con precio anual no hay interruptor", async () => {
    getPlansMock.mockResolvedValue([
      plan("plan-solo-mensual", "Plan Básico", 29900, null),
    ]);
    const screen = await render(<PlanesDisponibles derechos={null} />, {
      wrapper: Wrapper,
    });

    await expect.element(screen.getByText("$299.00 MXN")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Anual" }).elements(),
    ).toHaveLength(0);
  });

  it("en Pro anual, Pro anual es el plan actual (deshabilitado)", async () => {
    const screen = await render(
      <PlanesDisponibles
        derechos={
          {
            ...derechosConProMensual,
            subscription: {
              ...derechosConProMensual.subscription,
              billingInterval: "year",
            },
          } as KontroliaEntitlements
        }
      />,
      { wrapper: Wrapper },
    );

    await screen.getByRole("radio", { name: "Anual" }).click();

    await expect
      .element(screen.getByRole("button", { name: "Plan actual" }))
      .toBeDisabled();
  });
});
