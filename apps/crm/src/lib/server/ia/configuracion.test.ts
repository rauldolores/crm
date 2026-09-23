import { describe, expect, test } from "vitest";

import {
  cuentaIncluida,
  MODELO_INCLUIDO,
  resolverCuentaDeIa,
  type FilaDeIa,
} from "./configuracion";

const fila = (extra: Partial<FilaDeIa> = {}): FilaDeIa => ({
  provider: "openai",
  api_key: null,
  model: null,
  active: true,
  ...extra,
});

describe("cuentaIncluida", () => {
  test("nuestra clave de OpenAI va con el modelo mini barato", () => {
    const cuenta = cuentaIncluida({ OPENAI_API_KEY: "sk-nuestra" });

    expect(cuenta).toEqual({
      provider: "openai",
      apiKey: "sk-nuestra",
      model: MODELO_INCLUIDO,
    });
  });

  test("el modelo incluido se puede cambiar solo desde el despliegue", () => {
    const cuenta = cuentaIncluida({
      OPENAI_API_KEY: "sk-nuestra",
      AI_INCLUDED_MODEL: "gpt-4.1-nano",
    });

    expect(cuenta?.model).toBe("gpt-4.1-nano");
  });

  test("AI_API_KEY manda sobre la nuestra (instalación con cuenta propia)", () => {
    const cuenta = cuentaIncluida({
      OPENAI_API_KEY: "sk-nuestra",
      AI_API_KEY: "sk-del-cliente",
      AI_PROVIDER: "claude",
      AI_MODEL: "claude-opus-5",
    });

    expect(cuenta).toEqual({
      provider: "claude",
      apiKey: "sk-del-cliente",
      model: "claude-opus-5",
    });
  });

  test("sin ninguna clave, no hay IA incluida", () => {
    expect(cuentaIncluida({})).toBeNull();
  });
});

describe("resolverCuentaDeIa", () => {
  const incluida = cuentaIncluida({ OPENAI_API_KEY: "sk-nuestra" });

  test("una organización nueva usa la incluida", () => {
    expect(resolverCuentaDeIa(incluida, null)).toEqual(incluida);
  });

  test("apagada es apagada, aunque haya IA incluida", () => {
    expect(resolverCuentaDeIa(incluida, fila({ active: false }))).toBeNull();
  });

  test("con la incluida, el modelo que guardó la organización se ignora", () => {
    const cuenta = resolverCuentaDeIa(incluida, fila({ model: "gpt-4o" }));

    expect(cuenta?.model).toBe(MODELO_INCLUIDO);
    expect(cuenta?.apiKey).toBe("sk-nuestra");
  });

  test("con su propia clave, elige proveedor y modelo", () => {
    const cuenta = resolverCuentaDeIa(
      incluida,
      fila({ provider: "claude", api_key: "sk-suya", model: "claude-opus-5" }),
    );

    expect(cuenta).toEqual({
      provider: "claude",
      apiKey: "sk-suya",
      model: "claude-opus-5",
    });
  });

  test("su clave sin modelo cae en el recomendado de su proveedor", () => {
    const cuenta = resolverCuentaDeIa(
      incluida,
      fila({ provider: "deepseek", api_key: "sk-suya" }),
    );

    expect(cuenta).toEqual({
      provider: "deepseek",
      apiKey: "sk-suya",
      model: "deepseek-chat",
    });
  });

  test("sin IA incluida y sin clave propia, no hay IA", () => {
    expect(resolverCuentaDeIa(null, fila())).toBeNull();
  });

  test("un proveedor desconocido guardado no habilita su clave", () => {
    expect(
      resolverCuentaDeIa(null, fila({ provider: "gemini", api_key: "sk-x" })),
    ).toBeNull();
  });
});
