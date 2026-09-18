import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { StoryWrapper } from "@/test/StoryWrapper";
import type { Company, Deal, Quote } from "../types";

// La lista solo existe en el escritorio; el navegador de pruebas es estrecho.
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

/**
 * La lista global se lee sin abrir ninguna oportunidad: folios, estados y,
 * arriba, cuánto hay pendiente y cuánto se cerró para la lista filtrada.
 */

const DIA = 24 * 60 * 60 * 1000;
const fecha = (diasDesdeHoy: number) =>
  new Date(Date.now() + diasDesdeHoy * DIA).toISOString().slice(0, 10);

const base: Omit<Quote, "id" | "number" | "title" | "status" | "total"> = {
  deal_id: 1,
  company_id: 17,
  contact_id: null,
  currency: "MXN",
  valid_until: null,
  notes: null,
  subtotal: 0,
  tax_total: 0,
  contract_period: null,
  public_token: "abc",
  sent_at: null,
  viewed_at: null,
  accepted_at: null,
  accepted_by_name: null,
  accepted_by_email: null,
  rejected_at: null,
  rejection_reason: null,
  sales_id: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const cotizaciones: Quote[] = [
  {
    ...base,
    id: 1,
    number: "COT-2026-0001",
    title: "Licencia anual",
    status: "viewed",
    total: 50000,
    sent_at: new Date(Date.now() - 2 * DIA).toISOString(),
    valid_until: fecha(20),
  },
  {
    ...base,
    id: 2,
    number: "COT-2026-0002",
    title: "Implementación",
    status: "accepted",
    total: 120000,
    sent_at: new Date(Date.now() - 10 * DIA).toISOString(),
    accepted_at: new Date().toISOString(),
    accepted_by_name: "Ana",
  },
  {
    ...base,
    id: 3,
    number: "COT-2026-0003",
    title: "Soporte extendido",
    status: "sent",
    total: 9000,
    sent_at: new Date(Date.now() - 40 * DIA).toISOString(),
    valid_until: fecha(-1),
  },
];

const empresa = { id: 17, name: "Tecmilenio" } as unknown as Company;
const oportunidad = {
  id: 1,
  name: "Demo Tecmilenio",
  company_id: 17,
  contact_ids: [],
  stage: "opportunity",
  amount: null,
  pipeline: "ventas",
  created_at: new Date().toISOString(),
} as unknown as Deal;

const montar = () =>
  render(
    <StoryWrapper
      initialEntries={["/quotes"]}
      data={{
        quotes: cotizaciones,
        quote_items: [],
        companies: [empresa],
        deals: [oportunidad],
      }}
    >
      <></>
    </StoryWrapper>,
  );

describe("ListaDeCotizaciones", () => {
  it("lista los folios con su estado real y resume lo pendiente y lo cerrado", async () => {
    const screen = await montar();

    await expect.element(screen.getByText("COT-2026-0001")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: "Tecmilenio" }).first())
      .toBeInTheDocument();

    // La enviada con vigencia pasada se ve vencida, no «enviada».
    await expect
      .element(screen.getByText("Vencida", { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Aceptada", { exact: true }))
      .toBeInTheDocument();

    // Resumen: solo la vista y vigente cuenta como pendiente; la vencida no.
    const indicador = (etiqueta: string) =>
      screen.getByText(etiqueta, { exact: true }).element().parentElement
        ?.textContent ?? "";
    await expect
      .poll(() => indicador("Pendientes de respuesta"))
      .toMatch(/50\.000.*1 cotización/);
    await expect
      .poll(() => indicador("Aceptadas"))
      .toMatch(/120\.000.*1 cotización/);
    await expect.poll(() => indicador("Tasa de aceptación")).toContain("100 %");
  });

  it("busca por folio", async () => {
    const screen = await montar();
    await expect.element(screen.getByText("COT-2026-0003")).toBeInTheDocument();

    await screen.getByPlaceholder("Buscar").fill("COT-2026-0002");

    await expect.element(screen.getByText("COT-2026-0002")).toBeInTheDocument();
    await expect
      .poll(() => screen.container.textContent?.includes("COT-2026-0003"))
      .toBe(false);
  });
});
