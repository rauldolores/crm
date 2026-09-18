import { render } from "vitest-browser-react";

import { buildContact, StoryWrapper } from "@/test/StoryWrapper";
import { TasksListByDueDate } from "./TasksListByDueDate";

const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const datos = {
  contacts: [
    buildContact({ id: 1, first_name: "Ada", last_name: "Lovelace" }),
    buildContact({
      id: 2,
      first_name: "Charles",
      last_name: "Babbage",
      archived_at: "2024-03-01T10:00:00.000Z",
    }),
  ],
  tasks: [
    {
      id: 11,
      contact_id: 1,
      type: "Call",
      text: "Llamar a Ada",
      due_date: manana,
      done_date: null,
      sales_id: null,
    },
    {
      id: 12,
      contact_id: 2,
      type: "Call",
      text: "Llamar a Charles",
      due_date: manana,
      done_date: null,
      sales_id: null,
    },
  ],
};

describe("useVisibleTasks", () => {
  it("el panel de tareas no enseña las de un contacto archivado", async () => {
    // Arrange / Act
    const screen = await render(
      <StoryWrapper data={datos as never}>
        <TasksListByDueDate />
      </StoryWrapper>,
    );

    // Assert
    await expect.element(screen.getByText("Llamar a Ada")).toBeVisible();
    await expect
      .element(screen.getByText("Llamar a Charles"))
      .not.toBeInTheDocument();
  });

  it("en la ficha del contacto archivado sus tareas sí se ven", async () => {
    const screen = await render(
      <StoryWrapper data={datos as never}>
        <TasksListByDueDate filterByContact={2} />
      </StoryWrapper>,
    );

    await expect.element(screen.getByText("Llamar a Charles")).toBeVisible();
  });
});
