import { describe, expect, it } from "vitest";

import { esPantallaDeAjustes, gruposVisibles } from "./apartadosDeAjustes";

const rutas = (modulos: Record<string, { active?: boolean }>) =>
  gruposVisibles(modulos).flatMap((grupo) =>
    grupo.entradas.map((entrada) => entrada.ruta),
  );

describe("esPantallaDeAjustes", () => {
  it("reconoce los apartados, las pantallas de administración y sus subpáginas", () => {
    expect(esPantallaDeAjustes("/settings")).toBe(true);
    expect(esPantallaDeAjustes("/settings/embudos")).toBe(true);
    expect(esPantallaDeAjustes("/automatizaciones")).toBe(true);
    expect(esPantallaDeAjustes("/sales")).toBe(true);
    expect(esPantallaDeAjustes("/email_templates/3")).toBe(true);
  });

  it("deja fuera el trabajo diario aunque la ruta empiece igual", () => {
    expect(esPantallaDeAjustes("/deals")).toBe(false);
    expect(esPantallaDeAjustes("/bandeja")).toBe(false);
    expect(esPantallaDeAjustes("/affiliates")).toBe(false);
    expect(esPantallaDeAjustes("/salesforce")).toBe(false);
  });
});

describe("gruposVisibles", () => {
  it("esconde los apartados de los módulos apagados", () => {
    const visibles = rutas({});

    expect(visibles).not.toContain("/bandeja/configurar");
    expect(visibles).not.toContain("/settings/renovaciones");
    expect(visibles).toContain("/settings/embudos");
  });

  it("muestra los apartados de un módulo cuando se activa", () => {
    const visibles = rutas({ inbox: { active: true } });

    expect(visibles).toContain("/bandeja/configurar");
  });
});
