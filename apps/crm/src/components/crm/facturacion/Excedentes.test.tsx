import { render } from "vitest-browser-react";

import type {
  KontroliaPlan,
  KontroliaUsage,
} from "@/lib/kontrolia-auth/facturacion";

vi.mock("@/lib/kontrolia-auth/facturacion", () => ({
  facturacionDisponible: () => false,
  getEntitlements: vi.fn(),
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
vi.mock("./PlanEnterpriseCard", () => ({ PlanEnterpriseCard: () => null }));

import { getPlans } from "@/lib/kontrolia-auth/facturacion";
import {
  avisarExcedenteDe,
  CABECERA_EXCEDENTE,
} from "@/lib/kontrolia-auth/excedentes";
import { StoryWrapper } from "@/test/StoryWrapper";
import { AvisoDeExcedente } from "./AvisoDeExcedente";
import { ConsumoDelPlan } from "./ConsumoDelPlan";
import { PlanesDisponibles } from "./PlanesDisponibles";

const uso = (overrides: Partial<KontroliaUsage>): KontroliaUsage => ({
  key: "contactos.registrados",
  limit: 150,
  period: "month",
  description: null,
  used: 150,
  remaining: 0,
  periodStart: "2026-09-01",
  overagePriceAmount: null,
  overageUnits: 0,
  overageAmount: 0,
  currency: "MXN",
  ...overrides,
});

describe("Excedentes en el consumo del plan", () => {
  it("(b) agotado con precio: dice el precio por unidad extra y no lo pinta como tope", async () => {
    // Arrange / Act
    const screen = await render(
      <StoryWrapper>
        <ConsumoDelPlan usage={[uso({ overagePriceAmount: 350 })]} />
      </StoryWrapper>,
    );

    // Assert
    await expect
      .element(
        screen.getByText(
          "Tus 150 contactos registrados del mes se agotaron; cada extra cuesta $3.50 MXN.",
        ),
      )
      .toBeVisible();
    await expect
      .element(screen.getByRole("progressbar"))
      .not.toHaveClass(/destructive/);
  });

  it("(c) por encima del límite muestra el acumulado del periodo", async () => {
    const screen = await render(
      <StoryWrapper>
        <ConsumoDelPlan
          usage={[
            uso({
              used: 162,
              overagePriceAmount: 350,
              overageUnits: 12,
              overageAmount: 4200,
            }),
          ]}
        />
      </StoryWrapper>,
    );

    await expect
      .element(screen.getByText("12 extra · $42.00 MXN del mes"))
      .toBeVisible();
  });

  it("(d) agotado SIN precio no dice nada de excedente y sigue en rojo", async () => {
    const screen = await render(
      <StoryWrapper>
        <ConsumoDelPlan usage={[uso({ overagePriceAmount: null })]} />
      </StoryWrapper>,
    );

    await expect.element(screen.getByText("150 de 150 este mes")).toBeVisible();
    await expect
      .element(screen.getByText(/cada extra cuesta/))
      .not.toBeInTheDocument();
    await expect.element(screen.getByText(/extra ·/)).not.toBeInTheDocument();
  });
});

describe("Aviso de una operación en excedente", () => {
  it("(b) una respuesta con la cabecera de excedente se convierte en una notificación", async () => {
    // Arrange
    const screen = await render(
      <StoryWrapper>
        <AvisoDeExcedente />
      </StoryWrapper>,
    );
    const respuesta = new Response("{}", {
      headers: {
        [CABECERA_EXCEDENTE]: JSON.stringify({
          key: "contactos.registrados",
          limit: 150,
          used: 151,
          period: "month",
          overagePriceAmount: 350,
          overageUnits: 1,
          overageAmount: 350,
          currency: "MXN",
        }),
      },
    });

    // Act: lo que hace el fetch del puente al recibirla.
    avisarExcedenteDe(respuesta);

    // Assert
    await expect
      .element(
        screen.getByText(
          /Tus 150 contactos registrados del mes se agotaron; cada extra cuesta \$3\.50 MXN\. 1 extra · \$3\.50 MXN del mes/,
        ),
      )
      .toBeVisible();
  });

  it("una respuesta sin cabecera no avisa nada", async () => {
    const screen = await render(
      <StoryWrapper>
        <AvisoDeExcedente />
      </StoryWrapper>,
    );

    avisarExcedenteDe(new Response("{}"));

    await expect
      .element(screen.getByText(/cada extra cuesta/))
      .not.toBeInTheDocument();
  });
});

describe("Precio por excedente en la pantalla de precios", () => {
  it("cada límite con precio dice el extra por unidad", async () => {
    vi.mocked(getPlans).mockResolvedValue([
      {
        id: "p1",
        applicationId: "a",
        slug: "plan-pro",
        name: "Plan Pro",
        description: null,
        priceAmount: 99900,
        yearlyPriceAmount: null,
        currency: "MXN",
        billingInterval: "month",
        trialDays: 0,
        features: [],
        isDefault: false,
        isActive: true,
        sortOrder: 0,
        permissions: [],
        limits: [
          {
            key: "contactos.registrados",
            limit: 400,
            period: "month",
            description: "Contactos nuevos",
            overagePriceAmount: 350,
          },
          {
            key: "usuarios",
            limit: 10,
            period: "lifetime",
            description: "Usuarios",
            overagePriceAmount: null,
          },
        ],
      } as unknown as KontroliaPlan,
    ]);

    const screen = await render(
      <StoryWrapper>
        <PlanesDisponibles derechos={null} />
      </StoryWrapper>,
    );

    await expect
      .element(
        screen.getByText("Contactos nuevos: 400, extra a $3.50 MXN por unidad"),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("Usuarios: 10", { exact: true }))
      .toBeVisible();
  });
});
