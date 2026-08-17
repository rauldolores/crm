import { composeStories } from "@storybook/react-vite";
import { render } from "vitest-browser-react";
import * as stories from "./NoteInputs.stories";
import { NoteInputsStory } from "./NoteInputs.stories";

const { Default, WithAttachmentDefault, WithSaveButton } =
  composeStories(stories);

describe("NoteInputs", () => {
  it("renders the note textarea", async () => {
    const screen = await render(<Default />);

    await expect
      .element(screen.getByPlaceholder("Añade una nota"))
      .toBeVisible();
  });

  it("shows the 'Show options' button on desktop when displayMore is false", async () => {
    const screen = await render(<Default />);

    await expect
      .element(screen.getByRole("button", { name: "Mostrar opciones" }))
      .toBeVisible();
  });

  it("reveals the extra options section after clicking 'Show options'", async () => {
    const screen = await render(<Default />);

    const showOptionsButton = screen.getByRole("button", {
      name: "Mostrar opciones",
    });
    await showOptionsButton.click();

    await expect
      .element(screen.getByRole("button", { name: "Mostrar opciones" }))
      .not.toBeInTheDocument();

    await expect.element(screen.getByText("Fecha")).toBeVisible();
    await expect.element(screen.getByText("Archivos adjuntos")).toBeVisible();
  });

  it("renders the status selector when showStatus is true", async () => {
    const screen = await render(<NoteInputsStory showStatus />);

    // Click 'Show options' to reveal the hidden section
    await screen.getByRole("button", { name: "Mostrar opciones" }).click();

    await expect.element(screen.getByText("Estado")).toBeVisible();
  });

  it("defaults the status selector to the current contact status", async () => {
    const screen = await render(
      <NoteInputsStory defaultStatus="hot" showStatus />,
    );

    await screen.getByRole("button", { name: "Mostrar opciones" }).click();

    await expect
      .element(screen.getByRole("combobox"))
      .toHaveTextContent("Caliente");
  });

  it("does not render the status selector when showStatus is false", async () => {
    const screen = await render(<Default />);

    await expect.element(screen.getByText("Estado")).not.toBeInTheDocument();
  });

  it("renders the contact reference selector when selectReference is contacts", async () => {
    const screen = await render(
      <NoteInputsStory reference="contacts" selectReference />,
    );

    await expect.element(screen.getByText("Contacto")).toBeVisible();
  });

  it("renders the deal reference selector when selectReference is deals", async () => {
    const screen = await render(
      <NoteInputsStory reference="deals" selectReference />,
    );

    await expect.element(screen.getByText("Oportunidad")).toBeVisible();
  });

  it("does not render a reference selector when selectReference is not set", async () => {
    const screen = await render(<Default />);

    await expect.element(screen.getByText("Contacto")).not.toBeInTheDocument();
    await expect
      .element(screen.getByText("Oportunidad"))
      .not.toBeInTheDocument();
  });

  it("should have the current date as default value for the date input", async () => {
    const screen = await render(<Default />);

    await screen.getByRole("button", { name: "Mostrar opciones" }).click();

    const dateInput = screen.getByLabelText("Fecha");
    const currentDate = new Date();
    const offset = currentDate.getTimezoneOffset();
    const localDate = new Date(currentDate.getTime() - offset * 60 * 1000);
    const expectedValue = localDate.toISOString().slice(0, 16);

    await expect(dateInput).toHaveValue(expectedValue);
  });

  it("should use the note date instead of the current date when it is set", async () => {
    const screen = await render(
      <NoteInputsStory defaultValues={{ date: "2024-01-01T12:00" }} />,
    );

    await screen.getByRole("button", { name: "Mostrar opciones" }).click();

    const dateInput = screen.getByLabelText("Fecha");

    await expect(dateInput).toHaveValue("2024-01-01T12:00");
  });

  it("shows a validation error when submitting an empty note without attachments", async () => {
    const screen = await render(<WithSaveButton />);

    await screen.getByRole("button", { name: "Guardar" }).click();

    await expect
      .element(
        screen.getByText("Debes escribir una nota o adjuntar un archivo"),
      )
      .toBeVisible();
  });

  it("treats whitespace-only note text as empty", async () => {
    const screen = await render(<WithSaveButton />);

    await screen.getByPlaceholder("Añade una nota").fill("   ");
    await screen.getByRole("button", { name: "Guardar" }).click();

    await expect
      .element(
        screen.getByText("Debes escribir una nota o adjuntar un archivo"),
      )
      .toBeVisible();
  });

  it("allows submitting a note with text only", async () => {
    const screen = await render(<WithSaveButton />);

    await screen.getByPlaceholder("Añade una nota").fill("Call summary");
    await screen.getByRole("button", { name: "Guardar" }).click();

    await expect
      .element(
        screen.getByText("Debes escribir una nota o adjuntar un archivo"),
      )
      .not.toBeInTheDocument();
  });

  it("allows submitting a note with an attachment and no text", async () => {
    const screen = await render(<WithAttachmentDefault />);

    await screen.getByRole("button", { name: "Guardar" }).click();

    await expect
      .element(
        screen.getByText("Debes escribir una nota o adjuntar un archivo"),
      )
      .not.toBeInTheDocument();
  });
});
