import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { juzgarSpam } from "./spam";

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

describe("juzgarSpam", () => {
  it("descarta lo que el modelo ve clarísimo", async () => {
    responder(0.97);
    expect(await juzgarSpam(envio)).toEqual({
      esSpam: true,
      probabilidad: 0.97,
    });
  });

  it("deja pasar la duda: el umbral es alto a propósito", async () => {
    responder(0.75);
    // La probabilidad vuelve igual: es lo que queda apuntado en la auditoría
    // y lo que permitirá mover el umbral con datos.
    expect(await juzgarSpam(envio)).toEqual({
      esSpam: false,
      probabilidad: 0.75,
    });
  });

  it("deja pasar cuando no hay clave, sin llamar a la API", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder(0.99);

    expect(await juzgarSpam(envio)).toEqual({
      esSpam: false,
      probabilidad: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deja pasar si la API falla: perder un cliente real es peor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await juzgarSpam(envio)).toEqual({
      esSpam: false,
      probabilidad: null,
    });
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
    expect(await juzgarSpam(envio)).toEqual({
      esSpam: false,
      probabilidad: null,
    });
  });
});
