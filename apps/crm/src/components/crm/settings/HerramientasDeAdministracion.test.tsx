import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

import { spanishCrmMessages } from "../providers/commons/spanishCrmMessages";
import { HerramientasDeAdministracion } from "./HerramientasDeAdministracion";

const get = (obj: unknown, path: string) =>
  path
    .split(".")
    .reduce<unknown>(
      (a, k) => (a && typeof a === "object" ? (a as any)[k] : undefined),
      obj,
    );

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <CoreAdminContext
    dataProvider={fakeDataProvider({})}
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

describe("HerramientasDeAdministracion", () => {
  it("enlaza cada herramienta a su propia página, con nombre completo", async () => {
    // Arrange & Act
    const screen = await render(<HerramientasDeAdministracion />, {
      wrapper: Wrapper,
    });

    // Assert: cada tarjeta lleva a un destino distinto.
    const destinos: Record<string, string> = {
      Automatizaciones: "/automatizaciones",
      "Formularios web": "/formularios",
      "API y webhooks": "/integraciones",
      "Catálogo de módulos": "/modulos/catalogo",
      "Correo saliente": "/correo",
      "Inteligencia artificial": "/inteligencia-artificial",
    };

    for (const [titulo, ruta] of Object.entries(destinos)) {
      const enlace = screen.getByRole("link", { name: new RegExp(titulo) });
      await expect.element(enlace).toBeInTheDocument();
      await expect
        .element(enlace)
        .toHaveAttribute("href", expect.stringContaining(ruta));
    }
  });

  it('el catálogo de módulos no se llama solo "Módulos"', async () => {
    // La barra lateral ya usa "Módulos" para los módulos activos; esta
    // tarjeta lleva a activarlos o desactivarlos, así que necesita su
    // propio nombre para no competir con ese.
    const screen = await render(<HerramientasDeAdministracion />, {
      wrapper: Wrapper,
    });

    await expect
      .element(screen.getByText("Catálogo de módulos"))
      .toBeInTheDocument();
  });
});
