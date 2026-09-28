import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pareceSpam } from "./spam";

const envio = {
  nombre: "Ana López",
  correo: "ana@panaderia.mx",
  empresa: "Panadería Lola",
  texto: "Quiero una demo para mi equipo de ventas.",
};

const responder = (probabilidad: number) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ answers: { spam: { type: "noul", noul: probabilidad } } }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  vi.stubEnv("TYPESAFE_API_KEY", "clave-secreta");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("pareceSpam", () => {
  it("descarta lo que el modelo ve clarísimo", async () => {
    responder(0.97);
    expect(await pareceSpam(envio)).toBe(true);
  });

  it("deja pasar la duda: el umbral es alto a propósito", async () => {
    responder(0.75);
    expect(await pareceSpam(envio)).toBe(false);
  });

  it("deja pasar cuando no hay clave, sin llamar a la API", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder(0.99);

    expect(await pareceSpam(envio)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deja pasar si la API falla: perder un cliente real es peor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await pareceSpam(envio)).toBe(false);
  });

  it("deja pasar si la respuesta no trae la probabilidad esperada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ answers: { spam: { type: "noul" } } }),
      }),
    );
    expect(await pareceSpam(envio)).toBe(false);
  });
});
