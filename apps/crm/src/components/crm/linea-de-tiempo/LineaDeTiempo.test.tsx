import { ResourceContextProvider, ShowBase } from "ra-core";
import { render } from "vitest-browser-react";

import { buildContact, StoryWrapper } from "@/test/StoryWrapper";
import { LineaDeTiempo } from "./LineaDeTiempo";

const contacto = buildContact({ id: 1, sales_id: 0 });

const datos = {
  contacts: [contacto],
  contact_notes: [
    {
      id: 11,
      contact_id: 1,
      type: "call",
      status: "warm",
      sales_id: 0,
      date: "2026-09-10T15:00:00.000Z",
      text: "Llamada de seguimiento: quiere el plan anual.\n\nSegundo párrafo con el detalle completo de la conversación.",
      attachments: [],
    },
    {
      id: 12,
      contact_id: 1,
      type: "note",
      status: "warm",
      sales_id: 0,
      date: "2026-07-03T09:00:00.000Z",
      text: "Nota antigua de julio",
      attachments: [],
    },
  ],
  tasks: [
    {
      id: 21,
      contact_id: 1,
      type: "Email",
      text: "Enviar propuesta",
      due_date: "2026-09-12T09:00:00.000Z",
      done_date: "2026-09-13T11:00:00.000Z",
      sales_id: 0,
    },
  ],
  deals: [
    {
      id: 31,
      name: "Licencia Pro",
      company_id: null,
      contact_ids: [1],
      stage: "opportunity",
      amount: 12000,
      created_at: "2026-08-01T12:00:00.000Z",
      updated_at: "2026-08-01T12:00:00.000Z",
      archived_at: null,
      sales_id: 0,
      index: 0,
      category: "",
      description: "",
      expected_closing_date: "2026-09-30",
      pipeline: "ventas",
    },
  ],
  deal_events: [
    {
      id: 41,
      deal_id: 31,
      sales_id: 0,
      field: "stage",
      old_value: "opportunity",
      new_value: "proposal-sent",
      created_at: "2026-08-20T12:00:00.000Z",
    },
  ],
};

const Pantalla = () => (
  <StoryWrapper data={datos as never}>
    <ResourceContextProvider value="contacts">
      <ShowBase id={contacto.id}>
        <LineaDeTiempo contactId={contacto.id} />
      </ShowBase>
    </ResourceContextProvider>
  </StoryWrapper>
);

describe("LineaDeTiempo", () => {
  it("muestra toda la actividad en orden cronológico agrupada por mes, con un resumen por evento", async () => {
    // Arrange & Act
    const screen = await render(<Pantalla />);

    // Assert: cabeceras de mes en orden descendente.
    await expect
      .element(screen.getByText("Septiembre de 2026"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Agosto de 2026"))
      .toBeInTheDocument();
    await expect.element(screen.getByText("Julio de 2026")).toBeInTheDocument();

    // Cada evento, en una línea: la llamada con su primera frase, la tarea
    // completada, la oportunidad creada.
    await expect
      .element(
        screen.getByText("Llamada de seguimiento: quiere el plan anual."),
      )
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Tarea completada"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Oportunidad creada"))
      .toBeInTheDocument();
    // Un cambio de etapa se lee como «de X a Y», con las etiquetas del embudo.
    await expect
      .element(
        screen.getByText("Licencia Pro — de Oportunidad a Propuesta enviada"),
      )
      .toBeInTheDocument();
    await expect.element(screen.getByText("6 eventos")).toBeInTheDocument();
  });

  it("el filtro deja solo la familia elegida", async () => {
    const screen = await render(<Pantalla />);
    await expect
      .element(screen.getByText("Oportunidad creada"))
      .toBeInTheDocument();

    await screen.getByRole("radio", { name: "Tareas" }).click();

    await expect.element(screen.getByText("2 eventos")).toBeInTheDocument();
    await expect
      .element(screen.getByText("Tarea completada"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Oportunidad creada"))
      .not.toBeInTheDocument();
  });

  it("abrir un evento muestra la nota completa, con su segundo párrafo", async () => {
    const screen = await render(<Pantalla />);
    const resumen = screen.getByText(
      "Llamada de seguimiento: quiere el plan anual.",
    );
    await expect.element(resumen).toBeInTheDocument();

    await resumen.click();

    await expect
      .element(
        screen.getByText(
          "Segundo párrafo con el detalle completo de la conversación.",
        ),
      )
      .toBeInTheDocument();
  });
});
