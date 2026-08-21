import { render } from "vitest-browser-react";

import {
  DesktopEmpty,
  DesktopSuccess,
  DesktopLoading,
  DesktopError,
  BulkTagButton,
} from "./ContactList.stories";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContactList", () => {
  it("renders an invite to create the first contact when the app is empty", async () => {
    const screen = await render(<DesktopEmpty />);
    await expect
      .element(screen.getByRole("heading", { name: "No hay contactos" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Parece que tu lista de contactos está vacía."))
      .toBeVisible();
  });

  it("renders contacts in a list", async () => {
    const screen = await render(<DesktopSuccess />);

    await expect.element(screen.getByText("Ada Lovelace")).toBeVisible();
    await expect.element(screen.getByText("Grace Hopper")).toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "No hay contactos" }))
      .not.toBeInTheDocument();
  });

  /**
   * The desktop version doesn't show a skeleton yet
   */
  it.skip("renders a skeleton while loading", async () => {
    const screen = await render(<DesktopLoading />);

    await expect
      .poll(() => screen.container.querySelector('[data-slot="skeleton"]'))
      .not.toBeNull();
  });

  it("renders an error notification when loading contacts fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const screen = await render(<DesktopError />);

    await expect
      .element(screen.getByText("Error al cargar los contactos"))
      .toBeVisible();
  });

  it("shows the bulk tag button only after selecting contacts", async () => {
    const screen = await render(<BulkTagButton />);

    await expect
      .element(screen.getByRole("button", { name: /^etiquetar$/i }))
      .not.toBeInTheDocument();

    await expect
      .poll(() => getSelectionCheckboxes(screen.container).length)
      .toBe(2);

    const [selectionCheckbox] = getSelectionCheckboxes(screen.container);
    await selectionCheckbox.click();

    await expect
      .element(screen.getByRole("button", { name: /^etiquetar$/i }))
      .toBeVisible();
  });

  it("adds an existing tag to selected contacts without duplicating it", async () => {
    const screen = await render(<BulkTagButton />);

    await expect
      .poll(() => getSelectionCheckboxes(screen.container).length)
      .toBe(2);

    const checkboxes = getSelectionCheckboxes(screen.container);
    await checkboxes[0].click();
    await checkboxes[1].click();

    await screen.getByRole("button", { name: /^etiquetar$/i }).click();
    await screen.getByRole("button", { name: "VIP" }).click();

    await expect
      .element(screen.getByText("Etiqueta añadida a 1 contacto"))
      .toBeInTheDocument();
    await expect
      .poll(() => screen.getByText("VIP").all().length)
      .toBeGreaterThanOrEqual(2);
    // close the notification
    await screen.getByRole("button", { name: /close/i }).click();
  });

  it("creates a new tag inline and applies it to the full selected list", async () => {
    const screen = await render(<BulkTagButton />);

    await expect
      .poll(() => getSelectionCheckboxes(screen.container).length)
      .toBe(2);

    const checkboxes = getSelectionCheckboxes(screen.container);
    await checkboxes[0].click();
    await checkboxes[1].click();

    await screen.getByRole("button", { name: /^Etiquetar$/ }).click();
    await screen.getByRole("button", { name: /Crear una etiqueta/ }).click();

    await expect
      .element(
        screen.getByText(
          "Crea una etiqueta nueva y aplícala a los contactos seleccionados.",
        ),
      )
      .toBeVisible();

    await screen.getByLabelText("Nombre de la etiqueta").fill("Prospect");
    await screen.getByRole("button", { name: /^Guardar$/ }).click();

    await expect
      .element(screen.getByText("Etiqueta añadida a 2 contactos"))
      .toBeInTheDocument();
    await expect.element(screen.getByText("Prospect").first()).toBeVisible();
    // close the notification
    await screen.getByRole("button", { name: /close/i }).click();
  });
});

const getSelectionCheckboxes = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-slot="checkbox"]')).map(
    (element) => element as HTMLElement,
  );
