import { afterEach, describe, expect, it, vi } from "vitest";

import type { CuentaDeIa } from "./proveedores";
import { esProveedorDeIa, generarConIa } from "./proveedores";

const cuenta = (
  provider: CuentaDeIa["provider"],
  extra: Partial<CuentaDeIa> = {},
): CuentaDeIa => ({ provider, apiKey: "clave-secreta", ...extra });

const responder = (datos: unknown, ok = true, status = 200) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => datos,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("esProveedorDeIa", () => {
  it("acepta los tres soportados y rechaza cualquier otro", () => {
    expect(esProveedorDeIa("claude")).toBe(true);
    expect(esProveedorDeIa("openai")).toBe(true);
    expect(esProveedorDeIa("deepseek")).toBe(true);
    expect(esProveedorDeIa("llama")).toBe(false);
  });
});

describe("generarConIa", () => {
  it("manda la clave de Claude en x-api-key con la version de la API", async () => {
    // Claude no usa Bearer, y sin anthropic-version la API rechaza.
    const fetchMock = responder({ content: [{ type: "text", text: "hola" }] });

    await generarConIa(cuenta("claude"), "instrucciones", "peticion");

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(opciones.headers["x-api-key"]).toBe("clave-secreta");
    expect(opciones.headers["anthropic-version"]).toBe("2023-06-01");
    expect(opciones.headers.Authorization).toBeUndefined();
  });

  it("pone las instrucciones en «system» para Claude", async () => {
    const fetchMock = responder({ content: [{ type: "text", text: "hola" }] });

    await generarConIa(cuenta("claude"), "eres util", "escribe un correo");

    const enviado = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(enviado.system).toBe("eres util");
    expect(enviado.messages).toEqual([
      { role: "user", content: "escribe un correo" },
    ]);
  });

  it("pone las instrucciones como mensaje «system» para OpenAI", async () => {
    const fetchMock = responder({
      choices: [{ message: { content: "hola" } }],
    });

    await generarConIa(cuenta("openai"), "eres util", "escribe un correo");

    const enviado = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(enviado.messages[0]).toEqual({
      role: "system",
      content: "eres util",
    });
  });

  it("usa la direccion de DeepSeek con el dialecto de OpenAI", async () => {
    const fetchMock = responder({
      choices: [{ message: { content: "hola" } }],
    });

    const resultado = await generarConIa(cuenta("deepseek"), "i", "p");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.deepseek.com/chat/completions",
    );
    expect(resultado.texto).toBe("hola");
  });

  it("respeta el modelo elegido en vez del de por defecto", async () => {
    const fetchMock = responder({ content: [{ type: "text", text: "x" }] });

    await generarConIa(cuenta("claude", { model: "claude-opus-5" }), "i", "p");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe(
      "claude-opus-5",
    );
  });

  it("extrae el texto de cada formato de respuesta", async () => {
    responder({ content: [{ type: "text", text: "desde claude" }] });
    expect((await generarConIa(cuenta("claude"), "i", "p")).texto).toBe(
      "desde claude",
    );

    responder({ choices: [{ message: { content: "desde openai" } }] });
    expect((await generarConIa(cuenta("openai"), "i", "p")).texto).toBe(
      "desde openai",
    );
  });

  it("devuelve el motivo del proveedor cuando falla", async () => {
    responder({ error: { message: "Invalid API key" } }, false, 401);

    const resultado = await generarConIa(cuenta("openai"), "i", "p");

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toBe("Invalid API key");
  });

  it("no revienta si el proveedor no contesta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red")));

    const resultado = await generarConIa(cuenta("claude"), "i", "p");

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toContain("No se pudo contactar");
  });

  it("avisa si la respuesta viene sin contenido", async () => {
    responder({ choices: [] });

    const resultado = await generarConIa(cuenta("openai"), "i", "p");

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toContain("no devolvió contenido");
  });
});
