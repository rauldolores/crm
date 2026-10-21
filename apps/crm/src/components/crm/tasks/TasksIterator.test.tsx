import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext, ListContextProvider, useList } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import type { Task } from "../types";
import { TasksIterator } from "./TasksIterator";

const TEXTO_LARGO =
  '[Aliado Torreón] Primer contacto (día 1): conexión LinkedIn + correo C1 "favor de turnar" + llamar al conmutador y pedir comercio exterior. Ofrecer diagnóstico gratuito Anexo 24. Ver Kit de ventas.';

const tareas: Task[] = [
  {
    id: 1,
    text: TEXTO_LARGO,
    type: "meeting",
    due_date: new Date(2026, 9, 12, 9, 0).toISOString(),
    done_date: null,
    contact_id: 1,
    sales_id: null,
  },
  {
    id: 2,
    text: "Enviar la cotización",
    type: "none",
    due_date: new Date(2026, 9, 22).toISOString(),
    done_date: null,
    contact_id: 1,
    sales_id: null,
  },
];

const Lista = () => {
  const listContext = useList({ data: tareas, resource: "tasks" });
  return (
    <ListContextProvider value={listContext}>
      <div style={{ width: 1100 }}>
        <TasksIterator showContact />
      </div>
    </ListContextProvider>
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CoreAdminContext
    dataProvider={fakeDataProvider({
      tasks: tareas,
      contacts: [{ id: 1, first_name: "Comercio", last_name: "Exterior" }],
      sales: [],
    })}
  >
    {children}
  </CoreAdminContext>
);

describe("TasksIterator", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2026, 9, 21, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra cada tarea en una línea con su tipo y cuánto lleva vencida", async () => {
    // Act
    const screen = await render(<Lista />, { wrapper: Wrapper });

    // Assert
    const texto = screen.getByTitle(TEXTO_LARGO);
    await expect.element(texto).toBeVisible();
    await expect.element(screen.getByText("Reunión").first()).toBeVisible();
    await expect.element(screen.getByText("hace 9 d")).toBeVisible();
    await expect.element(screen.getByText("mañana")).toBeVisible();
  });
});
