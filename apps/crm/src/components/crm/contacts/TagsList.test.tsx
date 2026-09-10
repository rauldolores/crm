import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext, RecordContextProvider } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import { TagsList } from "./TagsList";

const crearEtiquetas = (cantidad: number) =>
  Array.from({ length: cantidad }, (_, i) => ({
    id: i + 1,
    name: `Etiqueta ${i + 1}`,
    color: "#e88b7d",
  }));

const Wrapper =
  (tags: ReturnType<typeof crearEtiquetas>) =>
  ({ children }: { children: React.ReactNode }) => (
    <CoreAdminContext dataProvider={fakeDataProvider({ tags, contacts: [] })}>
      {children}
    </CoreAdminContext>
  );

describe("TagsList", () => {
  it("muestra todas las etiquetas cuando no superan el máximo", async () => {
    // Arrange
    const tags = crearEtiquetas(3);
    const contact = { id: 1, tags: [1, 2, 3] };

    // Act
    const screen = await render(
      <RecordContextProvider value={contact}>
        <TagsList />
      </RecordContextProvider>,
      { wrapper: Wrapper(tags) },
    );

    // Assert
    await expect.element(screen.getByText("Etiqueta 1")).toBeInTheDocument();
    await expect.element(screen.getByText("Etiqueta 3")).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain("+");
  });

  it("recorta a las últimas 5 y resume el resto en un +N", async () => {
    const tags = crearEtiquetas(8);
    const contact = { id: 1, tags: [1, 2, 3, 4, 5, 6, 7, 8] };

    const screen = await render(
      <RecordContextProvider value={contact}>
        <TagsList />
      </RecordContextProvider>,
      { wrapper: Wrapper(tags) },
    );

    // Las 3 más antiguas (1, 2, 3) se resumen; quedan visibles la 4 a la 8.
    await expect.element(screen.getByText("+3")).toBeInTheDocument();
    await expect.element(screen.getByText("Etiqueta 8")).toBeInTheDocument();
    await expect.element(screen.getByText("Etiqueta 4")).toBeInTheDocument();
    expect(screen.container.textContent).not.toContain("Etiqueta 1 ");
    expect(screen.container.textContent).not.toContain("Etiqueta 3");
  });

  it("respeta un límite distinto cuando se pasa por prop", async () => {
    const tags = crearEtiquetas(4);
    const contact = { id: 1, tags: [1, 2, 3, 4] };

    const screen = await render(
      <RecordContextProvider value={contact}>
        <TagsList max={2} />
      </RecordContextProvider>,
      { wrapper: Wrapper(tags) },
    );

    await expect.element(screen.getByText("+2")).toBeInTheDocument();
  });
});
