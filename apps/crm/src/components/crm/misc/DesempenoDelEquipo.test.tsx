import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import { DesempenoDelEquipo } from "./DesempenoDelEquipo";
import type { DesempenoDePersona } from "./metricasDelEquipo";

const traducciones: Record<string, string> = {
  "crm.reports.team.title": "Desempeño del equipo",
  "crm.reports.team.person": "Persona",
  "crm.reports.team.open": "Abiertas",
  "crm.reports.team.won_amount": "Vendido",
  "crm.reports.team.tasks_overdue": "Tareas vencidas",
  "crm.reports.team.conversion": "Conversión",
  "crm.reports.team.unassigned": "Sin responsable",
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CoreAdminContext
    dataProvider={fakeDataProvider({})}
    i18nProvider={{
      translate: (key) => traducciones[key] ?? key.split(".").at(-1) ?? key,
      changeLocale: () => Promise.resolve(),
      getLocale: () => "es",
    }}
  >
    <div style={{ width: 900 }}>{children}</div>
  </CoreAdminContext>
);

const persona = (datos: Partial<DesempenoDePersona>): DesempenoDePersona => ({
  id: "1",
  nombre: "Ana López",
  abiertas: 0,
  importeAbierto: 0,
  nuevas: 0,
  ganadas: 0,
  importeGanado: 0,
  perdidas: 0,
  conversion: null,
  tareasCompletadas: 0,
  tareasVencidas: 0,
  notas: 0,
  ticketsAbiertos: 0,
  ticketsCerrados: 0,
  ...datos,
});

describe("DesempenoDelEquipo", () => {
  it("muestra una fila por persona con sus oportunidades abiertas, lo vendido y la conversión", async () => {
    const pantalla = await render(
      <DesempenoDelEquipo
        moneda="MXN"
        filas={[
          persona({
            id: "1",
            nombre: "Ana López",
            abiertas: 6701,
            importeAbierto: 154527600,
            nuevas: 12,
            ganadas: 3,
            importeGanado: 45000,
            perdidas: 1,
            conversion: 75,
            tareasVencidas: 4,
            notas: 9,
          }),
          persona({ id: "2", nombre: "Beto Ruiz", abiertas: 2 }),
          persona({ id: "", nombre: "Sin responsable", abiertas: 5 }),
        ]}
      />,
      { wrapper: Wrapper },
    );

    const ana = pantalla.getByRole("row", { name: /Ana López/ });
    await expect.element(ana).toHaveTextContent("6701");
    await expect.element(ana).toHaveTextContent("75 %");
    await expect.element(ana).toHaveTextContent(/45,000/);
    await expect
      .element(pantalla.getByRole("row", { name: /Beto Ruiz/ }))
      .toHaveTextContent("—");
    await expect
      .element(pantalla.getByRole("row", { name: /Sin responsable/ }))
      .toBeVisible();
  });

  it("avisa cuando no hay nadie con datos", async () => {
    const pantalla = await render(
      <DesempenoDelEquipo moneda="MXN" filas={[]} />,
      { wrapper: Wrapper },
    );

    await expect.element(pantalla.getByText("empty").first()).toBeVisible();
  });
});
