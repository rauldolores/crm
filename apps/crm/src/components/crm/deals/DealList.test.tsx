import { render } from "vitest-browser-react";

import {
  EmbudoConMuchasOportunidades,
  EmbudoVacioEntreVarios,
  SinOportunidades,
} from "./DealList.stories";

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

  it("pinta una columna larga por tramos, contando siempre el total", async () => {
    // Arrange / Act
    const screen = await render(<EmbudoConMuchasOportunidades />);

    // Assert: primer tramo visible, la última tarjeta del tramo sí y la
    // siguiente no; la cabecera cuenta las 75.
    await expect
      .element(screen.getByText("Oportunidad 30", { exact: true }))
      .toBeVisible();
    await expect
      .element(screen.getByText("Oportunidad 31", { exact: true }))
      .not.toBeInTheDocument();
    await expect.element(screen.getByText("75", { exact: true })).toBeVisible();

    // «Ver más» trae el siguiente tramo.
    await screen.getByRole("button", { name: "Ver 30 más de 75" }).click();
    await expect
      .element(screen.getByText("Oportunidad 60", { exact: true }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Ver 15 más de 75" }))
      .toBeVisible();
  });
});
