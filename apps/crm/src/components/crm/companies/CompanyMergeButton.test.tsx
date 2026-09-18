import { RecordContextProvider, ResourceContextProvider } from "ra-core";
import { render } from "vitest-browser-react";

import { StoryWrapper } from "@/test/StoryWrapper";
import type { Company } from "../types";
import { CompanyMergeButton } from "./CompanyMergeButton";

const perdedora = {
  id: 2,
  name: "ACME S.A. de C.V.",
  city: "Monterrey",
  created_at: "2024-01-01T00:00:00.000Z",
} as Company;

const datos = {
  companies: [
    { id: 1, name: "Acme SA", created_at: "2026-01-01T00:00:00.000Z" },
    perdedora,
    { id: 3, name: "Otra empresa", created_at: "2026-01-01T00:00:00.000Z" },
  ],
  contacts: [
    { id: 10, first_name: "Ana", company_id: 2 },
    { id: 11, first_name: "Luis", company_id: 2 },
  ],
  deals: [{ id: 20, name: "Licencia", company_id: 2, stage: "opportunity" }],
  tickets: [],
};

const Pantalla = () => (
  <StoryWrapper data={datos as never}>
    <ResourceContextProvider value="companies">
      <RecordContextProvider value={perdedora}>
        <CompanyMergeButton />
      </RecordContextProvider>
    </ResourceContextProvider>
  </StoryWrapper>
);

describe("CompanyMergeButton", () => {
  it("sugiere la empresa de nombre parecido y dice qué pasa a ella antes de fusionar", async () => {
    // Arrange
    const screen = await render(<Pantalla />);

    // Act
    await screen
      .getByRole("button", { name: "Fusionar con otra empresa" })
      .click();

    // Assert: la sugerida es «Acme SA» (no «Otra empresa») y el resumen
    // cuenta lo que se moverá.
    await expect
      .element(screen.getByRole("dialog"))
      .toHaveTextContent("Empresa actual (se eliminará)");
    await expect
      .element(screen.getByRole("combobox"))
      .toHaveTextContent("Acme SA");
    await expect.element(screen.getByText("2 contactos")).toBeInTheDocument();
    await expect.element(screen.getByText("1 oportunidad")).toBeInTheDocument();

    // Al confirmar, avisa del resultado.
    await screen.getByRole("button", { name: "Fusionar empresas" }).click();
    await expect
      .element(screen.getByText("Empresas fusionadas"))
      .toBeInTheDocument();
  });
});
