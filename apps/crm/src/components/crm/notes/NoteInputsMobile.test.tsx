import { composeStories } from "@storybook/react-vite";
import { render } from "vitest-browser-react";
import * as stories from "./NoteInputsMobile.stories";

const { Default, WithAttachmentDefault, WithSelectContact } =
  composeStories(stories);

describe("NoteInputsMobile", () => {
  it("renders the note textarea", async () => {
    const screen = await render(<Default />);

    await expect
      .element(screen.getByPlaceholder("Añade una nota"))
      .toBeVisible();
  });

  it("renders the attach document button", async () => {
    const screen = await render(<Default />);

    await expect
      .element(screen.getByRole("button", { name: "Adjuntar documento" }))
      .toBeVisible();
  });

  it("does not render the contact selector by default", async () => {
    const screen = await render(<Default />);

    await expect.element(screen.getByText("Contacto")).not.toBeInTheDocument();
  });

  it("renders the contact selector when selectContact is true", async () => {
    const screen = await render(<WithSelectContact />);

    await expect.element(screen.getByText("Contacto")).toBeVisible();
  });

  it("defaults the activity type to a plain note", async () => {
    const screen = await render(<Default />);

    await expect
      .element(screen.getByRole("radio", { name: "Nota" }))
      .toHaveAttribute("aria-checked", "true");
  });

  it("switches the selected activity type on click", async () => {
    const screen = await render(<Default />);

    await screen.getByRole("radio", { name: "Llamada" }).click();

    await expect
      .element(screen.getByRole("radio", { name: "Llamada" }))
      .toHaveAttribute("aria-checked", "true");
    await expect
      .element(screen.getByRole("radio", { name: "Nota" }))
      .toHaveAttribute("aria-checked", "false");
  });

  it("shows a validation error when submitting an empty note without attachments", async () => {
    const screen = await render(<Default />);

    await screen.getByRole("button", { name: "Guardar" }).click();

    await expect
      .element(
        screen.getByText("Debes escribir una nota o adjuntar un archivo"),
      )
      .toBeVisible();
  });

  it("treats whitespace-only note text as empty", async () => {
    const screen = await render(<Default />);

    await screen.getByPlaceholder("Añade una nota").fill("   ");
    await screen.getByRole("button", { name: "Guardar" }).click();

    await expect
      .element(
        screen.getByText("Debes escribir una nota o adjuntar un archivo"),
      )
      .toBeVisible();
  });

  it("allows submitting a note with text only", async () => {
    const screen = await render(<Default />);

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
