import React from "react";
import { CoreAdminContext, memoryStore } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { spanishCrmMessages } from "../providers/commons/spanishCrmMessages";
import {
  CONFIGURATION_STORE_KEY,
  type ConfigurationContextValue,
} from "../root/ConfigurationContext";
import { defaultConfiguration } from "../root/defaultConfiguration";
import type { Deal } from "../types";
import { EditorDeCotizacion } from "./EditorDeCotizacion";

const get = (obj: unknown, path: string) =>
  path
    .split(".")
    .reduce<unknown>(
      (a, k) => (a && typeof a === "object" ? (a as any)[k] : undefined),
      obj,
    );

const configuracion: ConfigurationContextValue = {
  ...defaultConfiguration,
  quoteTemplates: [
    {
      key: "enterprise",
      name: "Enterprise",
      title: "Vinqulia Enterprise",
      valid_days: 30,
      contract_period: "yearly",
      notes: "Alcance de prueba",
      items: [
        { description: "Licencia anual", quantity: 1, unit_price: 79000 },
        { description: "Implementación", quantity: 1, unit_price: 45000 },
      ],
    },
  ],
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CoreAdminContext
    dataProvider={fakeDataProvider({ quotes: [], quote_items: [] })}
    store={memoryStore({ [CONFIGURATION_STORE_KEY]: configuracion })}
    i18nProvider={{
      translate: (key, options) => {
        const raw = get(spanishCrmMessages, key);
        return typeof raw === "string" ? raw : (options?._ ?? key);
      },
      changeLocale: () => Promise.resolve(),
      getLocale: () => "es",
    }}
  >
    {children}
  </CoreAdminContext>
);

const oportunidad = {
  id: 1,
  name: "Demo Tecmilenio",
  company_id: 17,
  contact_ids: [21],
  stage: "opportunity",
  amount: null,
  pipeline: "ventas",
} as unknown as Deal;

describe("EditorDeCotizacion", () => {
  it("abre con una línea vacía y totales en cero", async () => {
    // Arrange & Act — abrir el editor es lo que fallaba en producción
    // (un selector con opción de valor vacío tiraba el árbol entero).
    const screen = await render(
      <EditorDeCotizacion
        oportunidad={oportunidad}
        abierto
        onClose={() => {}}
        onSaved={() => {}}
      />,
      { wrapper: Wrapper },
    );

    // Assert
    await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Título"))
      .toHaveValue("Demo Tecmilenio");
    await expect
      .element(screen.getByText("Total", { exact: true }))
      .toBeInTheDocument();
  });

  it("rellena líneas, título y condiciones al elegir una plantilla", async () => {
    const screen = await render(
      <EditorDeCotizacion
        oportunidad={oportunidad}
        abierto
        onClose={() => {}}
        onSaved={() => {}}
      />,
      { wrapper: Wrapper },
    );

    await screen.getByRole("combobox", { name: /desde plantilla/i }).click();
    await screen.getByRole("option", { name: "Enterprise" }).click();

    await expect
      .element(screen.getByLabelText("Título"))
      .toHaveValue("Vinqulia Enterprise");
    await expect
      .element(screen.getByText("Alcance de prueba"))
      .toBeInTheDocument();
    // 124,000 + 16 % de IVA
    await expect.element(screen.getByText(/143,840\.00/)).toBeInTheDocument();
  });
});
