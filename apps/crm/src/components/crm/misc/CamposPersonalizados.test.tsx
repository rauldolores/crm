import { ResourceContextProvider, ShowBase } from "ra-core";
import { render } from "vitest-browser-react";

import { buildContact, StoryWrapper } from "@/test/StoryWrapper";
import { CamposPersonalizadosField } from "./CamposPersonalizados";
import type { CustomFieldValues } from "../types";

const campos = [
  { value: "diagnostico", label: "Diagnóstico", type: "text" as const },
];

const pintarFicha = (custom_fields: CustomFieldValues) => {
  const contacto = buildContact({ id: 1, custom_fields });
  return render(
    <StoryWrapper
      configuration={{ contactCustomFields: campos }}
      data={{ contacts: [contacto] }}
    >
      <ResourceContextProvider value="contacts">
        <ShowBase id={contacto.id}>
          <CamposPersonalizadosField entidad="contact" />
        </ShowBase>
      </ResourceContextProvider>
    </StoryWrapper>,
  );
};

const URL_LARGA =
  "http://www.kontrolia.io/diagnostico?contact=21&company=17&sig=vvyI3LxMVyTixAibTpRC7nUX";

describe("CamposPersonalizadosField", () => {
  it("convierte una URL en un enlace que abre en otra pestaña", async () => {
    // Arrange / Act
    const screen = await pintarFicha({ diagnostico: URL_LARGA });

    // Assert
    const enlace = screen.getByRole("link");
    await expect.element(enlace).toHaveAttribute("href", URL_LARGA);
    await expect.element(enlace).toHaveAttribute("target", "_blank");
    // Sin la ventana de origen no se puede manipular esta pestaña.
    await expect.element(enlace).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("muestra la URL sin el protocolo y deja la dirección completa al pasar el ratón", async () => {
    const screen = await pintarFicha({ diagnostico: URL_LARGA });

    const enlace = screen.getByRole("link");
    await expect
      .element(enlace)
      .toHaveTextContent(URL_LARGA.replace("http://", ""));
    await expect.element(enlace).toHaveAttribute("title", URL_LARGA);
  });

  it("deja el texto que no es una dirección como texto plano", async () => {
    const screen = await pintarFicha({ diagnostico: "Pendiente de agendar" });

    await expect
      .element(screen.getByText("Pendiente de agendar"))
      .toBeVisible();
    await expect.element(screen.getByRole("link")).not.toBeInTheDocument();
  });

  it("no crea un enlace con un esquema ejecutable", async () => {
    // Un `javascript:` en un href se ejecuta al pulsarlo, y el valor de un
    // campo personalizado puede venir de fuera.
    const screen = await pintarFicha({ diagnostico: "javascript:alert(1)" });

    await expect.element(screen.getByRole("link")).not.toBeInTheDocument();
    await expect.element(screen.getByText("javascript:alert(1)")).toBeVisible();
  });
});
