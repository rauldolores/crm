import { render } from "vitest-browser-react";

import { StoryWrapper } from "@/test/StoryWrapper";
import { TiemposDeTicket } from "./TiemposDeTicket";

const datos = {
  companies: [{ id: 1, name: "Agencia Aduanal Norte" }],
  tickets: [
    {
      id: 7,
      subject: "No timbra el pedimento",
      company_id: 1,
      contact_id: 3,
      status: "open",
    },
  ],
  sales: [{ id: 2, first_name: "Raúl", last_name: "Dolores" }],
  soporte_tiempos: [
    {
      id: 1,
      ticket_id: 7,
      company_id: 1,
      fecha_atencion: "2026-10-15",
      atendio: 2,
      minutos: 60,
      consume: true,
      descripcion_cliente: "Se renovó el certificado de sello digital.",
      nota_interna: "El cliente tenía el certificado vencido.",
      created_at: "2026-10-15T18:00:00.000Z",
    },
    {
      id: 2,
      ticket_id: 7,
      company_id: 1,
      fecha_atencion: "2026-10-16",
      atendio: 2,
      minutos: 30,
      consume: false,
      motivo_no_consume: "FALLA_SISTEMA",
      descripcion_cliente: "Se corrigió un error del sistema al timbrar.",
      created_at: "2026-10-16T18:00:00.000Z",
    },
  ],
};

const Pantalla = () => (
  <StoryWrapper data={datos as never}>
    <TiemposDeTicket ticketId={7} companyId={1} />
  </StoryWrapper>
);

describe("TiemposDeTicket", () => {
  it("muestra el total del ticket y cuánto descuenta de la bolsa", async () => {
    // Arrange / Act
    const screen = await render(<Pantalla />);

    // Assert
    await expect
      .element(screen.getByText(/Total: 1 h 30 min/))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/1 h descuentan de la bolsa/))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("No descuenta · Falla del sistema"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("El cliente tenía el certificado vencido."))
      .toBeInTheDocument();
  });

  it("registra tiempo nuevo y lo suma al total", async () => {
    // Arrange
    const screen = await render(<Pantalla />);

    // Act
    await screen.getByRole("button", { name: "Registrar tiempo" }).click();
    await screen.getByLabelText("Minutos").fill("15");
    await screen
      .getByLabelText("Qué se hizo (lo lee el cliente)")
      .fill("Se explicó cómo descargar el acuse.");
    await screen
      .getByRole("dialog")
      .getByRole("button", { name: "Registrar tiempo" })
      .click();

    // Assert
    await expect
      .element(screen.getByText("Se explicó cómo descargar el acuse."))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/Total: 1 h 45 min/))
      .toBeInTheDocument();
  });

  it("no deja registrar sin decir qué se hizo", async () => {
    const screen = await render(<Pantalla />);

    await screen.getByRole("button", { name: "Registrar tiempo" }).click();
    await screen.getByLabelText("Minutos").fill("15");
    await screen
      .getByRole("dialog")
      .getByRole("button", { name: "Registrar tiempo" })
      .click();

    await expect
      .element(
        screen.getByText("Escribe qué se hizo: es lo que leerá el cliente."),
      )
      .toBeInTheDocument();
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("corrige un registro con otro en contra y ya no ofrece corregirlo", async () => {
    // Arrange
    const screen = await render(<Pantalla />);
    await expect
      .element(screen.getByText(/Total: 1 h 30 min/))
      .toBeInTheDocument();

    // Act: se anula el más reciente (el de 30 minutos).
    await screen.getByRole("button", { name: "Corregir" }).first().click();
    await screen
      .getByLabelText("Motivo de la corrección")
      .fill("Se registró en el ticket equivocado");
    await screen
      .getByRole("dialog")
      .getByRole("button", { name: "Corregir" })
      .click();

    // Assert
    await expect
      .element(screen.getByText("Corrección", { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Corregido", { exact: true }))
      .toBeInTheDocument();
    await expect.element(screen.getByText(/^Total: 1 h$/)).toBeInTheDocument();
  });
});
