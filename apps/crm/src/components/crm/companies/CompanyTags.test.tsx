import { RecordContextProvider, ResourceContextProvider } from "ra-core";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { StoryWrapper } from "@/test/StoryWrapper";
import type { Company } from "../types";
import { CompanyAside } from "./CompanyAside";
import { CompanyList } from "./CompanyList";

const etiquetas = [
  { id: 1, name: "Cliente clave", color: "#fde68a" },
  { id: 2, name: "Proveedor", color: "#bfdbfe" },
];

const acme = {
  id: 1,
  name: "Acme SA",
  created_at: "2026-01-01T00:00:00.000Z",
  tags: [1],
} as Company;

const datos = {
  companies: [
    acme,
    {
      id: 2,
      name: "Globex",
      created_at: "2026-01-02T00:00:00.000Z",
      tags: [],
    },
  ],
  tags: etiquetas,
};

describe("Etiquetas en empresas", () => {
  it("la ficha enseña las etiquetas de la empresa y permite añadir otra", async () => {
    // Arrange
    const screen = await render(
      <StoryWrapper data={datos as never}>
        <ResourceContextProvider value="companies">
          <RecordContextProvider value={acme}>
            <CompanyAside link="show" />
          </RecordContextProvider>
        </ResourceContextProvider>
      </StoryWrapper>,
    );

    // Assert: la que tiene, y en el menú de añadir solo la que le falta.
    await expect.element(screen.getByText("Cliente clave")).toBeVisible();
    await screen.getByRole("button", { name: /Añadir etiqueta/ }).click();
    await expect
      .element(screen.getByRole("menuitem", { name: "Proveedor" }))
      .toBeVisible();
  });

  it("la lista se filtra por etiqueta", async () => {
    await page.viewport(1600, 900);
    const screen = await render(
      <StoryWrapper data={datos as never}>
        <ResourceContextProvider value="companies">
          <CompanyList />
        </ResourceContextProvider>
      </StoryWrapper>,
    );
    await expect.element(screen.getByText("Globex")).toBeVisible();

    // Act: el filtro lateral por «Cliente clave».
    await screen.getByRole("button", { name: "Cliente clave" }).click();

    // Assert
    await expect.element(screen.getByText("Acme SA")).toBeVisible();
    await expect.element(screen.getByText("Globex")).not.toBeInTheDocument();
  });
});
