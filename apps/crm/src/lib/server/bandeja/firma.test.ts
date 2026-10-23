import { createHmac } from "node:crypto";
import { describe, expect, test } from "vitest";

import { firmaDeResendValida } from "./firma";

const SECRETO = `whsec_${Buffer.from("secreto-de-prueba").toString("base64")}`;
const CUERPO = '{"type":"email.received"}';
const AHORA = new Date("2026-10-23T20:00:00Z");
const TIMESTAMP = String(AHORA.getTime() / 1000);

const firmar = (cuerpo: string, timestamp = TIMESTAMP, id = "msg_1") =>
  `v1,${createHmac("sha256", Buffer.from("secreto-de-prueba"))
    .update(`${id}.${timestamp}.${cuerpo}`)
    .digest("base64")}`;

describe("firmaDeResendValida", () => {
  test("acepta un aviso firmado con el secreto de la organización", () => {
    expect(
      firmaDeResendValida(
        CUERPO,
        { id: "msg_1", timestamp: TIMESTAMP, signature: firmar(CUERPO) },
        SECRETO,
        AHORA,
      ),
    ).toBe(true);
  });

  test("rechaza un cuerpo alterado", () => {
    expect(
      firmaDeResendValida(
        '{"type":"email.received","x":1}',
        { id: "msg_1", timestamp: TIMESTAMP, signature: firmar(CUERPO) },
        SECRETO,
        AHORA,
      ),
    ).toBe(false);
  });

  test("rechaza un aviso de hace más de cinco minutos", () => {
    const viejo = String(AHORA.getTime() / 1000 - 301);
    expect(
      firmaDeResendValida(
        CUERPO,
        { id: "msg_1", timestamp: viejo, signature: firmar(CUERPO, viejo) },
        SECRETO,
        AHORA,
      ),
    ).toBe(false);
  });

  test("acepta si alguna de las firmas vale (secreto recién rotado)", () => {
    expect(
      firmaDeResendValida(
        CUERPO,
        {
          id: "msg_1",
          timestamp: TIMESTAMP,
          signature: `v1,b3RyYQ== ${firmar(CUERPO)}`,
        },
        SECRETO,
        AHORA,
      ),
    ).toBe(true);
  });

  test("sin cabeceras o sin secreto no hay firma válida", () => {
    expect(
      firmaDeResendValida(
        CUERPO,
        { id: null, timestamp: TIMESTAMP, signature: firmar(CUERPO) },
        SECRETO,
        AHORA,
      ),
    ).toBe(false);
    expect(
      firmaDeResendValida(
        CUERPO,
        { id: "msg_1", timestamp: TIMESTAMP, signature: firmar(CUERPO) },
        "",
        AHORA,
      ),
    ).toBe(false);
  });
});
