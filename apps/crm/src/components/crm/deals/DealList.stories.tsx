import type { Meta } from "@storybook/react-vite";
import { ResourceContextProvider } from "ra-core";

import DealList from "./DealList";
import type { Deal, DealPipeline } from "../types";

import { StoryWrapper } from "@/test/StoryWrapper";

const meta = {
  title: "Vinqulia/Deals/Deal List",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

const etapas = [
  { value: "opportunity", label: "Oportunidad" },
  { value: "won", label: "Ganada" },
  { value: "lost", label: "Perdida" },
];

/**
 * El primero es el embudo por defecto de la lista, y aquí a propósito es el
 * que NO tiene oportunidades: reproduce el caso en que se entra a la pantalla
 * directamente sobre un embudo vacío.
 */
const embudos: DealPipeline[] = [
  {
    value: "afiliados",
    label: "Afiliados",
    stages: etapas,
    pipelineStatuses: ["won"],
    lostStages: ["lost"],
  },
  {
    value: "ventas",
    label: "Ventas",
    stages: etapas,
    pipelineStatuses: ["won"],
    lostStages: ["lost"],
  },
];

const buildDeal = (overrides: Partial<Deal> = {}): Deal => ({
  amount: 1000,
  archived_at: undefined,
  category: "other",
  company_id: 1,
  contact_ids: [1],
  created_at: "2026-01-05T10:00:00.000Z",
  description: "",
  expected_closing_date: "2026-02-05",
  id: 1,
  index: 0,
  name: "Una oportunidad",
  pipeline: "ventas",
  sales_id: 1,
  stage: "opportunity",
  updated_at: "2026-01-05T10:00:00.000Z",
  ...overrides,
});

/**
 * Hay oportunidades en la organización, pero ninguna en el embudo abierto.
 * Las pestañas de embudo tienen que seguir visibles: son la única forma de
 * volver a uno que sí tenga.
 */
export const EmbudoVacioEntreVarios = () => (
  <StoryWrapper
    configuration={{ dealPipelines: embudos }}
    data={{
      companies: [{ id: 1, name: "Acme" }] as never,
      deals: [buildDeal()],
    }}
  >
    <ResourceContextProvider value="deals">
      <DealList />
    </ResourceContextProvider>
  </StoryWrapper>
);

/**
 * Organización recién estrenada, con un solo embudo y sin oportunidades: aquí
 * sí toca la pantalla de bienvenida, y sin pestañas que elegir.
 */
export const SinOportunidades = () => (
  <StoryWrapper>
    <ResourceContextProvider value="deals">
      <DealList />
    </ResourceContextProvider>
  </StoryWrapper>
);
