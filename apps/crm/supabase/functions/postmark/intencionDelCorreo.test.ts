// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { intencionDelCorreo } from "./intencionDelCorreo.ts";

/**
 * El módulo lee `Deno.env` en tiempo de llamada, no al cargarse, así que se
 * puede probar en Node con este sustituto.
 */
const conClave = (clave: string | undefined) => {
  vi.stubGlobal("Deno", { env: { get: () => clave } });
};

const responder = (answers: unknown, status = 200) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ answers }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  conClave("clave-secreta");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("intencionDelCorreo", () => {
  it("marca como automática una respuesta de vacaciones", async () => {
    responder({
      intencion: { type: "choice", choice: "autoresponder", confidence: 0.97 },
    });

    const juicio = await intencionDelCorreo(
      "Re: Tu propuesta",
      "Estoy de vacaciones hasta el 15 de octubre. Para urgencias escribe a ana@empresa.mx.",
    );

    expect(juicio).toEqual({
      intencion: "autoresponder",
      automatico: true,
      valor: "autoresponder",
      confianza: 0.97,
    });
  });

  it("deja contar como actividad la respuesta de una persona", async () => {
    responder({
      intencion: { type: "choice", choice: "human_reply", confidence: 0.99 },
    });

    const juicio = await intencionDelCorreo(
      "Re: Tu propuesta",
      "Nos interesa. ¿Podemos verlo el jueves a las 10?",
    );

    expect(juicio.automatico).toBe(false);
    expect(juicio.intencion).toBe("human_reply");
  });

  it("con poca confianza cuenta como persona, que es el lado seguro", async () => {
    responder({
      intencion: { type: "choice", choice: "newsletter", confidence: 0.6 },
    });

    const juicio = await intencionDelCorreo("Novedades", "Mira esto.");

    // Confundir una respuesta de verdad con una máquina es lo caro: ese
    // contacto dejaría de contar como vivo y nadie lo volvería a llamar.
    expect(juicio.automatico).toBe(false);
    // Pero la duda queda apuntada, que es de lo que sirve la auditoría.
    expect(juicio).toMatchObject({ valor: "newsletter", confianza: 0.6 });
  });

  it("no se cree una intención que no está en la lista", async () => {
    responder({
      intencion: { type: "choice", choice: "inventada", confidence: 0.99 },
    });

    const juicio = await intencionDelCorreo("Asunto", "Cuerpo");

    expect(juicio.intencion).toBeNull();
    expect(juicio.automatico).toBe(false);
    expect(juicio.valor).toBe("inventada");
  });

  it("sin clave del despliegue no llama a la API y todo cuenta como antes", async () => {
    conClave(undefined);
    const fetchMock = responder({
      intencion: { type: "choice", choice: "autoresponder", confidence: 0.99 },
    });

    const juicio = await intencionDelCorreo("Asunto", "Cuerpo");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(juicio.automatico).toBe(false);
  });

  it("si la API falla, cuenta como persona", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await intencionDelCorreo("Asunto", "Cuerpo")).toEqual({
      intencion: null,
      automatico: false,
      valor: null,
      confianza: null,
    });
  });

  it("reintenta una vez cuando la API está saturada", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          answers: {
            intencion: { type: "choice", choice: "bounce", confidence: 0.99 },
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const juicio = await intencionDelCorreo(
      "Undelivered Mail Returned to Sender",
      "550 5.1.1 User unknown",
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(juicio).toMatchObject({ intencion: "bounce", automatico: true });
  });

  it("recorta el correo: no se paga por veinte respuestas citadas", async () => {
    const fetchMock = responder({
      intencion: { type: "choice", choice: "human_reply", confidence: 0.99 },
    });

    await intencionDelCorreo("a".repeat(500), "b".repeat(5000));

    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo.state.asunto).toHaveLength(300);
    expect(cuerpo.state.cuerpo).toHaveLength(2000);
  });
});
