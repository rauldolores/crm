import { RecordContextProvider, ResourceContextProvider } from "ra-core";
import { render } from "vitest-browser-react";

import { StoryWrapper } from "@/test/StoryWrapper";
import type { Company } from "../types";
import { CompanyAffiliate } from "./CompanyAffiliate";

const datos = {
  companies: [{ id: 1, name: "Cliente SA", referred_by_affiliate_id: null }],
  affiliates: [
    { id: 7, referral_code: "ana-lopez", active: true },
    { id: 8, referral_code: "beto-ruiz", active: true },
  ],
  affiliate_attributions: [],
};

const Pantalla = ({
  empresa,
  moduloActivo = true,
}: {
  empresa: Company;
  moduloActivo?: boolean;
}) => (
  <StoryWrapper
    data={datos as never}
    configuration={{ modules: { affiliates: { active: moduloActivo } } }}
  >
    <ResourceContextProvider value="companies">
      <RecordContextProvider value={empresa}>
        <CompanyAffiliate />
      </RecordContextProvider>
    </ResourceContextProvider>
  </StoryWrapper>
);

describe("CompanyAffiliate", () => {
  it("liga un cliente sin afiliado eligiendo al afiliado, sin pedir motivo", async () => {
    // Arrange
    const screen = await render(
      <Pantalla empresa={{ id: 1, name: "Cliente SA" } as Company} />,
    );
    await expect.element(screen.getByText("Sin afiliado")).toBeInTheDocument();

    // Act
    await screen.getByRole("button", { name: "Ligar a un afiliado" }).click();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    await expect.element(screen.getByText("Motivo")).not.toBeInTheDocument();
    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "ana-lopez" }).click();
    await screen.getByRole("button", { name: "Guardar" }).click();

    // Assert
    await expect
      .element(screen.getByText("Afiliado guardado"))
      .toBeInTheDocument();
  });

  it("para cambiar el afiliado exige un motivo antes de dejar guardar", async () => {
    // Arrange
    const screen = await render(
      <Pantalla
        empresa={
          { id: 1, name: "Cliente SA", referred_by_affiliate_id: 7 } as Company
        }
      />,
    );

    // Act
    await screen.getByRole("button", { name: "Cambiar" }).click();
    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "beto-ruiz" }).click();

    // Assert: sin motivo no se puede guardar; con motivo, sí.
    const guardar = screen.getByRole("button", { name: "Guardar" });
    await expect.element(guardar).toBeDisabled();
    await screen.getByRole("textbox").fill("Lo trajo Beto, no Ana");
    await expect.element(guardar).toBeEnabled();
  });

  it("no aparece si el módulo Afiliados está apagado", async () => {
    // Arrange + Act
    const screen = await render(
      <Pantalla
        empresa={{ id: 1, name: "Cliente SA" } as Company}
        moduloActivo={false}
      />,
    );

    // Assert
    await expect
      .element(screen.getByText("Sin afiliado"))
      .not.toBeInTheDocument();
  });
});
