import { describe, expect, test } from "vitest";

import {
  aCorreoEntrante,
  CorreoDeResend,
  esAutomatico,
  htmlATexto,
  separarDireccion,
  direccionDeLaBandeja,
} from "./correoRecibido";

const recibido = (extra: Record<string, unknown> = {}) =>
  CorreoDeResend.parse({
    id: "4ef9a417",
    from: "laura@acme.mx",
    to: ["hola@aduaniax.com"],
    subject: "Re: Diagnóstico",
    text: "Me interesa.",
    message_id: "<m2@acme.mx>",
    created_at: "2026-10-23T19:02:10.743Z",
    headers: {
      from: "Laura Pérez <Laura@Acme.mx>",
      "In-Reply-To": "<m1@vinqulia>",
      references: "<m0@vinqulia> <m1@vinqulia>",
    },
    ...extra,
  });

describe("aCorreoEntrante", () => {
  test("una respuesta conserva su hilo y el nombre de quien escribe", () => {
    const correo = aCorreoEntrante(recibido());

    expect(correo).toMatchObject({
      provider_id: "4ef9a417",
      message_id: "<m2@acme.mx>",
      in_reply_to: "<m1@vinqulia>",
      references: ["<m0@vinqulia>", "<m1@vinqulia>"],
      from_email: "laura@acme.mx",
      from_name: "Laura Pérez",
      to: ["hola@aduaniax.com"],
      text: "Me interesa.",
      automatic: false,
    });
  });

  test("sin versión de texto, se lee el HTML como texto", () => {
    const correo = aCorreoEntrante(
      recibido({ text: null, html: "<p>Hola&nbsp;equipo</p><p>Gracias</p>" }),
    );

    expect(correo.text).toBe("Hola equipo\nGracias");
  });

  test("un correo nuevo, sin cabeceras de hilo, abre conversación", () => {
    const correo = aCorreoEntrante(recibido({ headers: {} }));

    expect(correo.in_reply_to).toBeNull();
    expect(correo.references).toEqual([]);
    expect(correo.from_email).toBe("laura@acme.mx");
  });
});

describe("esAutomatico", () => {
  test("un fuera de oficina no pide respuesta", () => {
    expect(esAutomatico({ "Auto-Submitted": "auto-replied" }, "a@x.mx")).toBe(
      true,
    );
  });

  test("un rebote o un boletín tampoco", () => {
    expect(esAutomatico({}, "mailer-daemon@googlemail.com")).toBe(true);
    expect(esAutomatico({ "list-unsubscribe": "<mailto:x>" }, "a@x.mx")).toBe(
      true,
    );
    expect(esAutomatico({ precedence: "bulk" }, "a@x.mx")).toBe(true);
  });

  test("el correo de una persona sí", () => {
    expect(esAutomatico({ "auto-submitted": "no" }, "laura@acme.mx")).toBe(
      false,
    );
    expect(esAutomatico({}, "noreplica.ventas@acme.mx")).toBe(false);
  });
});

describe("separarDireccion", () => {
  test("separa nombre y dirección y pasa la dirección a minúsculas", () => {
    expect(separarDireccion('"Pérez, Laura" <Laura@Acme.MX>')).toEqual({
      correo: "laura@acme.mx",
      nombre: "Pérez, Laura",
    });
    expect(separarDireccion("laura@acme.mx")).toEqual({
      correo: "laura@acme.mx",
      nombre: null,
    });
  });
});

describe("direccionDeLaBandeja", () => {
  const BANDEJA = ["hola@aduaniax.com", "hola@faqturia.com"];

  test("dice a qué dirección de proyecto escribieron", () => {
    expect(direccionDeLaBandeja({ to: ["Hola@AduaniaX.com"] }, BANDEJA)).toBe(
      "hola@aduaniax.com",
    );
    expect(
      direccionDeLaBandeja(
        { to: ["otra@x.com"], cc: ["Faqturia <hola@faqturia.com>"] },
        BANDEJA,
      ),
    ).toBe("hola@faqturia.com");
  });

  test("ignora lo que llega a direcciones que no son de la bandeja", () => {
    expect(
      direccionDeLaBandeja({ to: ["hola@chuujorai.resend.app"] }, BANDEJA),
    ).toBeNull();
  });
});

describe("htmlATexto", () => {
  test("quita estilos y etiquetas pero respeta los saltos de línea", () => {
    expect(
      htmlATexto("<style>p{}</style>Línea 1<br>Línea 2 &amp; más"),
    ).toBe("Línea 1\nLínea 2 & más");
  });
});
