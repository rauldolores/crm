import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { StoryWrapper } from "@/test/StoryWrapper";

/**
 * La pantalla que usa alguien que no es técnico: ve las dos familias, elige
 * un proveedor, sigue los pasos y pega su credencial. Lo que llega al
 * servidor es lo que se prueba aquí; la red se simula.
 */

const llamadas = vi.hoisted(() => ({ llamarApi: vi.fn() }));
vi.mock("../misc/llamarApi", () => ({ llamarApi: llamadas.llamarApi }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const montar = () =>
  render(
    <StoryWrapper initialEntries={["/modulos/conectores"]}>
      <></>
    </StoryWrapper>,
  );

describe("ConectoresPage", () => {
  it("ofrece un proveedor por familia y, al elegirlo, enseña los pasos y los campos", async () => {
    llamadas.llamarApi.mockResolvedValue({ conectores: [] });
    const screen = await montar();

    await expect
      .element(screen.getByText("Catálogo de productos"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Facturación", { exact: true }))
      .toBeInTheDocument();

    await screen.getByRole("button", { name: /Shopify/ }).click();

    await expect
      .element(screen.getByText(/Revelar token una vez/))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Dirección de tu tienda"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Token de acceso de la aplicación"))
      .toBeInTheDocument();
  });

  it("manda proveedor, ajustes y credencial a la familia correcta al conectar", async () => {
    llamadas.llamarApi.mockImplementation(async (ruta: string) => {
      if (ruta === "/api/conectores") return { conectores: [] };
      return {
        conector: {
          id: 1,
          family: "products",
          provider: "shopify",
          settings: { shop_domain: "mitienda.myshopify.com" },
          status: "connected",
          last_error: null,
          last_checked_at: null,
          last_synced_at: null,
        },
        detalle: "Conectado con «Mi tienda»: 12 productos en MXN.",
        sincronizacion: { total: 12 },
      };
    });
    const screen = await montar();

    await screen.getByRole("button", { name: /Shopify/ }).click();
    await screen
      .getByLabelText("Dirección de tu tienda")
      .fill("mitienda.myshopify.com");
    await screen
      .getByLabelText("Token de acceso de la aplicación")
      .fill("shpat_secreto");
    await screen.getByRole("button", { name: "Probar y conectar" }).click();

    await expect
      .poll(() =>
        llamadas.llamarApi.mock.calls.find(
          ([ruta]) => ruta === "/api/conectores/products",
        ),
      )
      .toBeTruthy();
    const [, opciones] = llamadas.llamarApi.mock.calls.find(
      ([ruta]) => ruta === "/api/conectores/products",
    )!;
    expect(JSON.parse((opciones as RequestInit).body as string)).toEqual({
      provider: "shopify",
      settings: { shop_domain: "mitienda.myshopify.com" },
      secret: "shpat_secreto",
    });
  });
});
