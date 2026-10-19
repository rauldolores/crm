import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { firmaValida } from "./firma";

const SECRETO = "whsec_prueba";
const CUERPO =
  '{"id": "evt-1", "snapshot": {"generated_at": "2026-10-19T23:00:05Z"}}';
const AHORA = 1_790_000_000_000;
const t = Math.floor(AHORA / 1000);

const firmar = (cuerpo: string, ts = t, secreto = SECRETO) =>
  `t=${ts},v1=${createHmac("sha256", secreto).update(`${ts}.${cuerpo}`).digest("hex")}`;

describe("firmaValida", () => {
  it("acepta el cuerpo crudo firmado con el secreto", () => {
    expect(firmaValida(CUERPO, firmar(CUERPO), SECRETO, 300, AHORA)).toBe(true);
  });

  it("rechaza el cuerpo vuelto a serializar: la firma es del texto exacto", () => {
    const reserializado = JSON.stringify(JSON.parse(CUERPO));
    expect(
      firmaValida(reserializado, firmar(CUERPO), SECRETO, 300, AHORA),
    ).toBe(false);
  });

  it("rechaza otro secreto, una firma vieja y encabezados mal formados", () => {
    expect(
      firmaValida(CUERPO, firmar(CUERPO, t, "otro"), SECRETO, 300, AHORA),
    ).toBe(false);
    expect(
      firmaValida(CUERPO, firmar(CUERPO, t - 301), SECRETO, 300, AHORA),
    ).toBe(false);
    expect(firmaValida(CUERPO, null, SECRETO, 300, AHORA)).toBe(false);
    expect(firmaValida(CUERPO, "t=abc,v1=zz", SECRETO, 300, AHORA)).toBe(false);
    expect(firmaValida(CUERPO, `t=${t},v1=abcd`, SECRETO, 300, AHORA)).toBe(
      false,
    );
    expect(firmaValida(CUERPO, firmar(CUERPO), "", 300, AHORA)).toBe(false);
  });
});
