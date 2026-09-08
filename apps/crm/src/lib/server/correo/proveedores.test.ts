import { afterEach, describe, expect, it, vi } from "vitest";

import type { CuentaDeEnvio } from "./proveedores";
import { enviarConProveedor, esProveedorDeCorreo } from "./proveedores";

const mensaje = {
  para: "ana@empresa.com",
  asunto: "Hola",
  textoPlano: "Qué tal",
};

const cuenta = (
  provider: CuentaDeEnvio["provider"],
  extra: Partial<CuentaDeEnvio> = {},
): CuentaDeEnvio => ({
  provider,
  apiKey: "clave-secreta",
  fromEmail: "ventas@kontrolia.io",
  ...extra,
});

/** Deja `fetch` mockeado y devuelve la petición que se hizo. */
const capturarEnvio = (respuesta: Partial<Response> = { ok: true }) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    ...respuesta,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("esProveedorDeCorreo", () => {
  it("acepta los proveedores soportados y rechaza cualquier otro", () => {
    expect(esProveedorDeCorreo("resend")).toBe(true);
    expect(esProveedorDeCorreo("mailchimp")).toBe(false);
    expect(esProveedorDeCorreo(undefined)).toBe(false);
  });
});

describe("enviarConProveedor", () => {
  it("manda la clave de Resend como Bearer y el destinatario en una lista", async () => {
    // Arrange
    const fetchMock = capturarEnvio();

    // Act
    await enviarConProveedor(cuenta("resend"), mensaje);

    // Assert
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(opciones.headers.Authorization).toBe("Bearer clave-secreta");
    expect(JSON.parse(opciones.body)).toMatchObject({
      from: "ventas@kontrolia.io",
      to: ["ana@empresa.com"],
      subject: "Hola",
    });
  });

  it("manda la clave de Postmark en su cabecera propia, no como Bearer", async () => {
    const fetchMock = capturarEnvio();

    await enviarConProveedor(cuenta("postmark"), mensaje);

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.postmarkapp.com/email");
    expect(opciones.headers["X-Postmark-Server-Token"]).toBe("clave-secreta");
    expect(opciones.headers.Authorization).toBeUndefined();
  });

  it("arma el sobre anidado que espera SendGrid", async () => {
    const fetchMock = capturarEnvio();

    await enviarConProveedor(cuenta("sendgrid"), mensaje);

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.sendgrid.com/v3/mail/send");
    expect(JSON.parse(opciones.body)).toMatchObject({
      personalizations: [{ to: [{ email: "ana@empresa.com" }] }],
      from: { email: "ventas@kontrolia.io" },
    });
  });

  it("usa «Nombre <correo>» cuando hay nombre de remitente", async () => {
    const fetchMock = capturarEnvio();

    await enviarConProveedor(
      cuenta("resend", { fromName: "Ventas Kontrolia" }),
      mensaje,
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).from).toBe(
      "Ventas Kontrolia <ventas@kontrolia.io>",
    );
  });

  it("devuelve el motivo que da el proveedor, no un codigo HTTP pelado", async () => {
    // Lo que necesita leer quien configura es «el dominio no esta
    // verificado», no «HTTP 422».
    capturarEnvio({
      ok: false,
      status: 422,
      json: async () => ({ message: "The domain is not verified" }),
    });

    const resultado = await enviarConProveedor(cuenta("resend"), mensaje);

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toBe("The domain is not verified");
  });

  it("no revienta si el proveedor no contesta", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("red caida"));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await enviarConProveedor(cuenta("resend"), mensaje);

    expect(resultado.ok).toBe(false);
    expect(resultado.mensaje).toContain("No se pudo contactar");
  });
});
