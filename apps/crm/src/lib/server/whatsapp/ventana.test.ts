import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  digitosParaReconocer,
  ultimoMensajeEntrante,
  ventanaAbierta,
  ventanaDeConversacion,
} from "./ventana";

const AHORA = new Date("2026-10-21T12:00:00Z");
const horasAntes = (horas: number) =>
  new Date(AHORA.getTime() - horas * 60 * 60 * 1000);

/** Así entrega WhatsApp un móvil de México: con el 1 después del 52. */
const DESDE_MEXICO = "whatsapp:+5215512345678";

/** Un mensaje tal como lo lista Twilio (fecha en RFC 2822). */
const mensaje = (direction: string, from: string, fecha: Date) => ({
  direction,
  from,
  date_sent: fecha.toUTCString(),
});

beforeEach(() => {
  vi.stubEnv("TWILIO_ACCOUNT_SID", "AC123");
  vi.stubEnv("TWILIO_AUTH_TOKEN", "secreto");
  vi.stubEnv("TWILIO_WHATSAPP_FROM", "+5215500000000");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ventanaAbierta", () => {
  it("está abierta si el contacto escribió hace menos de 24 horas", () => {
    expect(ventanaAbierta(horasAntes(23), AHORA)).toBe(true);
  });

  it("está cerrada a partir de las 24 horas", () => {
    expect(ventanaAbierta(horasAntes(24), AHORA)).toBe(false);
    expect(ventanaAbierta(horasAntes(72), AHORA)).toBe(false);
  });

  it("está cerrada si el contacto nunca escribió", () => {
    expect(ventanaAbierta(null, AHORA)).toBe(false);
  });

  it("no da por abierta una fecha del futuro ni una fecha inválida", () => {
    expect(ventanaAbierta(horasAntes(-1), AHORA)).toBe(false);
    expect(ventanaAbierta(new Date("no es fecha"), AHORA)).toBe(false);
  });
});

describe("digitosParaReconocer", () => {
  it("reduce a los últimos 8 dígitos cualquier forma de escribir el número", () => {
    expect(digitosParaReconocer("whatsapp:+5215512345678")).toBe("12345678");
    expect(digitosParaReconocer("+52 55 1234 5678")).toBe("12345678");
    expect(digitosParaReconocer("55-1234-5678")).toBe("12345678");
  });

  it("no reconoce un número demasiado corto", () => {
    expect(digitosParaReconocer("1234")).toBe("");
  });
});

describe("ultimoMensajeEntrante", () => {
  it("encuentra la respuesta del contacto aunque en su ficha falte el 1 o el código de país", () => {
    const datos = { messages: [mensaje("inbound", DESDE_MEXICO, horasAntes(2))] };
    for (const enLaFicha of ["+525512345678", "5512345678", "+5215512345678"]) {
      expect(ultimoMensajeEntrante(datos, enLaFicha)?.toISOString()).toBe(
        horasAntes(2).toISOString(),
      );
    }
  });

  it("ignora los mensajes de otros contactos al mismo número", () => {
    const datos = {
      messages: [mensaje("inbound", "whatsapp:+5215599998888", horasAntes(1))],
    };
    expect(ultimoMensajeEntrante(datos, "5512345678")).toBeNull();
  });

  it("ignora lo que le escribimos nosotros: eso no abre la ventana", () => {
    const datos = {
      messages: [mensaje("outbound-api", DESDE_MEXICO, horasAntes(1))],
    };
    expect(ultimoMensajeEntrante(datos, "5512345678")).toBeNull();
  });

  it("se queda con el más reciente de los suyos", () => {
    const datos = {
      messages: [
        mensaje("inbound", DESDE_MEXICO, horasAntes(20)),
        mensaje("inbound", DESDE_MEXICO, horasAntes(3)),
      ],
    };
    expect(ultimoMensajeEntrante(datos, "5512345678")?.toISOString()).toBe(
      horasAntes(3).toISOString(),
    );
  });

  it("no revienta con una respuesta inesperada", () => {
    expect(ultimoMensajeEntrante(null, "5512345678")).toBeNull();
    expect(ultimoMensajeEntrante({ messages: "x" }, "5512345678")).toBeNull();
    expect(
      ultimoMensajeEntrante(
        { messages: [null, { direction: "inbound" }] },
        "5512345678",
      ),
    ).toBeNull();
  });
});

describe("ventanaDeConversacion", () => {
  const responder = (datos: unknown, ok = true) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => datos,
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("pide a Twilio lo que llegó a nuestro número desde ayer", async () => {
    const fetchMock = responder({ messages: [] });

    await ventanaDeConversacion("5512345678", AHORA);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/2010-04-01/Accounts/AC123/Messages.json");
    expect(url.searchParams.get("To")).toBe("whatsapp:+5215500000000");
    expect(url.searchParams.get("DateSent>")).toBe("2026-10-20");
    expect(url.searchParams.get("PageSize")).toBe("1000");
  });

  it("la da por abierta si el contacto escribió hace poco", async () => {
    responder({ messages: [mensaje("inbound", DESDE_MEXICO, horasAntes(2))] });

    expect(await ventanaDeConversacion("5512345678", AHORA)).toEqual({
      abierta: true,
      ultimoMensaje: horasAntes(2).toISOString(),
      comprobada: true,
    });
  });

  it("la da por cerrada, comprobada, si el contacto no escribió", async () => {
    responder({ messages: [] });

    expect(await ventanaDeConversacion("5512345678", AHORA)).toEqual({
      abierta: false,
      ultimoMensaje: null,
      comprobada: true,
    });
  });

  it("ante un fallo de Twilio la deja cerrada y sin comprobar: mejor pedir plantilla", async () => {
    responder({}, false);

    expect(await ventanaDeConversacion("5512345678", AHORA)).toEqual({
      abierta: false,
      ultimoMensaje: null,
      comprobada: false,
    });
  });

  it("lo mismo si la red falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const ventana = await ventanaDeConversacion("5512345678", AHORA);

    expect(ventana.comprobada).toBe(false);
    expect(ventana.abierta).toBe(false);
  });

  it("no llama a Twilio sin configurar", async () => {
    vi.stubEnv("TWILIO_WHATSAPP_FROM", "");
    const fetchMock = responder({ messages: [] });

    const ventana = await ventanaDeConversacion("5512345678", AHORA);

    expect(ventana.comprobada).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
