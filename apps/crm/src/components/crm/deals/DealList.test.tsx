import { render } from "vitest-browser-react";

import { EmbudoVacioEntreVarios, SinOportunidades } from "./DealList.stories";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DealList", () => {
  it("conserva las pestañas de embudo cuando el embudo abierto está vacío", async () => {
    // Arrange / Act
    const screen = await render(<EmbudoVacioEntreVarios />);

    // Assert: se está viendo el estado vacío del embudo «Afiliados»…
    await expect
      .element(screen.getByRole("heading", { name: "No hay oportunidades" }))
      .toBeVisible();

    // …y aun así se puede saltar a «Ventas», que sí tiene oportunidades.
    await expect
      .element(screen.getByRole("button", { name: "Ventas" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Afiliados" }))
      .toBeVisible();
  });

  it("muestra la bienvenida sin pestañas cuando solo hay un embudo y ninguna oportunidad", async () => {
    const screen = await render(<SinOportunidades />);

    await expect
      .element(screen.getByRole("heading", { name: "No hay oportunidades" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Ventas" }))
      .not.toBeInTheDocument();
  });
});
