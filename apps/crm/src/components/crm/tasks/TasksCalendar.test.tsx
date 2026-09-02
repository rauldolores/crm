import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import type { Task } from "../types";
import { TasksCalendar } from "./TasksCalendar";

const traducciones: Record<string, string> = {
  "resources.tasks.calendar.today": "Hoy",
  "resources.tasks.calendar.previous_month": "Mes anterior",
  "resources.tasks.calendar.next_month": "Mes siguiente",
  "resources.tasks.calendar.day_empty": "No hay tareas para este día.",
  "resources.tasks.filters.no_due_date": "Sin fecha",
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CoreAdminContext
    dataProvider={fakeDataProvider({ tasks: [], contacts: [], sales: [] })}
    i18nProvider={{
      translate: (key, options) => {
        if (key === "resources.tasks.calendar.day_count") {
          return `${options?.smart_count} tareas`;
        }
        if (key === "resources.tasks.calendar.more") {
          return `+${options?.smart_count} más`;
        }
        return traducciones[key] ?? key;
      },
      changeLocale: () => Promise.resolve(),
      getLocale: () => "es",
    }}
  >
    {children}
  </CoreAdminContext>
);

/** Mediodía local, para que el día del calendario no dependa de la zona. */
const enSeptiembre = (dia: number, hora = 12) =>
  new Date(2026, 8, dia, hora, 0, 0).toISOString();

const crearTarea = (
  id: number,
  due_date: string | null,
  text: string,
): Task => ({
  id,
  due_date,
  done_date: null,
  contact_id: 1,
  sales_id: null,
  type: "none",
  text,
});

describe("TasksCalendar", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2026, 8, 1, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra la tarea en el día de su fecha de vencimiento", async () => {
    // Arrange
    const tareas = [crearTarea(1, enSeptiembre(2), "Llamar a Zuriel")];

    // Act
    const screen = await render(<TasksCalendar tasks={tareas} />, {
      wrapper: Wrapper,
    });

    // Assert
    await expect
      .element(screen.getByText("Llamar a Zuriel"))
      .toBeInTheDocument();
  });

  it("agrupa las tareas sin fecha aparte de la rejilla", async () => {
    const tareas = [crearTarea(2, null, "Pendiente sin plazo")];

    const screen = await render(<TasksCalendar tasks={tareas} />, {
      wrapper: Wrapper,
    });

    await expect
      .element(screen.getByText("Sin fecha", { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Pendiente sin plazo"))
      .toBeInTheDocument();
  });

  it("resume el día cuando hay más de tres tareas", async () => {
    const tareas = Array.from({ length: 5 }, (_, i) =>
      crearTarea(i + 1, enSeptiembre(2), `Tarea ${i + 1}`),
    );

    const screen = await render(<TasksCalendar tasks={tareas} />, {
      wrapper: Wrapper,
    });

    await expect.element(screen.getByText("+2 más")).toBeInTheDocument();
  });

  it("abre el detalle del día al pulsar en la celda", async () => {
    const tareas = [crearTarea(1, enSeptiembre(2), "Llamar a Zuriel")];

    const screen = await render(<TasksCalendar tasks={tareas} />, {
      wrapper: Wrapper,
    });

    await screen
      .getByRole("button", { name: "2 de septiembre", exact: true })
      .click();

    await expect.element(screen.getByText("1 tareas")).toBeInTheDocument();
    await expect
      .element(screen.getByText("miércoles 2 de septiembre de 2026"))
      .toBeInTheDocument();
  });
});
