import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  leerPlantilla,
  listarPlantillasAprobadas,
  paginaSiguiente,
} from "./plantillas";

const SID = `HX${"a".repeat(32)}`;
const OTRO_SID = `HX${"b".repeat(32)}`;

/** Una plantilla tal como la devuelve /v1/ContentAndApprovals. */
const deTwilio = (cambios: Record<string, unknown> = {}) => ({
  sid: SID,
  friendly_name: "presentacion_faqturia",
  language: "es_MX",
  variables: { "1": "Juan", "2": "martes" },
  types: {
    "twilio/text": {
      body: "Hola {{1}}, ¿te viene bien una demo el {{2}}?",
    },
  },
  approval_requests: { status: "approved", category: "MARKETING" },
  ...cambios,
});

const responder = (...paginas: unknown[]) => {
  const fetchMock = vi.fn();
  for (const pagina of paginas) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => pagina,
    });
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  vi.stubEnv("TWILIO_ACCOUNT_SID", "AC123");
  vi.stubEnv("TWILIO_AUTH_TOKEN", "secreto");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("leerPlantilla", () => {
  it("convierte una plantilla aprobada a la forma del CRM", () => {
    expect(leerPlantilla(deTwilio())).toEqual({
      sid: SID,
      nombre: "presentacion_faqturia",
      idioma: "es_MX",
      categoria: "MARKETING",
      cuerpo: "Hola {{1}}, ¿te viene bien una demo el {{2}}?",
      variables: [
        { clave: "1", ejemplo: "Juan" },
        { clave: "2", ejemplo: "martes" },
      ],
    });
  });

  it("descarta las que no están aprobadas: fuera de la ventana no llegarían", () => {
    for (const status of ["pending", "rejected", "received", "paused"]) {
      expect(
        leerPlantilla(deTwilio({ approval_requests: { status } })),
      ).toBeNull();
    }
  });

  it("descarta las que nunca se mandaron a aprobar", () => {
    expect(leerPlantilla(deTwilio({ approval_requests: {} }))).toBeNull();
    expect(leerPlantilla(deTwilio({ approval_requests: null }))).toBeNull();
  });

  it("entiende la aprobación anidada por canal", () => {
    const anidada = deTwilio({
      approval_requests: { whatsapp: { status: "approved", category: "UTILITY" } },
    });
    expect(leerPlantilla(anidada)?.categoria).toBe("UTILITY");
  });

  it("descarta un SID que no es de plantilla", () => {
    expect(leerPlantilla(deTwilio({ sid: "MG123" }))).toBeNull();
  });

  it("descarta una plantilla sin texto", () => {
    expect(leerPlantilla(deTwilio({ types: {} }))).toBeNull();
  });

  it("toma el texto de otros tipos de contenido, como una con botones", () => {
    const conBotones = deTwilio({
      types: {
        "twilio/quick-reply": {
          body: "¿Agendamos la demo, {{1}}?",
          actions: [{ title: "Sí" }],
        },
      },
    });
    expect(leerPlantilla(conBotones)?.cuerpo).toBe("¿Agendamos la demo, {{1}}?");
  });

  it("ordena las variables numéricamente: {{2}} antes que {{10}}", () => {
    const plantilla = leerPlantilla(
      deTwilio({
        variables: {},
        types: { "twilio/text": { body: "{{10}} {{2}} {{1}}" } },
      }),
    );
    expect(plantilla?.variables.map((v) => v.clave)).toEqual(["1", "2", "10"]);
  });

  it("incluye una variable del cuerpo aunque Twilio no le diera ejemplo", () => {
    const plantilla = leerPlantilla(
      deTwilio({ variables: { "1": "Juan" } }),
    );
    expect(plantilla?.variables).toEqual([
      { clave: "1", ejemplo: "Juan" },
      { clave: "2", ejemplo: "" },
    ]);
  });

  it("lee el ejemplo oficial de la especificación de Twilio (twilio-oai, content v1)", () => {
    // Copiado de spec/yaml/twilio_content_v1.yaml, ejemplo readResults: la
    // aprobación viene plana, no anidada por canal, y una plantilla sin
    // mandar a aprobar llega como «unsubmitted».
    const oficial = {
      date_created: "2015-07-30T19:00:00Z",
      sid: "HXaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      friendly_name: "Some content",
      language: "en",
      variables: { name: "foo" },
      types: {
        "twilio/text": { body: "Foo Bar Co is located at 39.7392, 104.9903" },
        "twilio/location": { longitude: 104.9903, latitude: 39.7392 },
      },
      approval_requests: {
        name: "",
        category: "",
        content_type: "",
        status: "unsubmitted",
        rejection_reason: "",
        allow_category_change: true,
      },
    };

    expect(leerPlantilla(oficial)).toBeNull();

    const aprobada = leerPlantilla({
      ...oficial,
      approval_requests: { ...oficial.approval_requests, status: "approved" },
    });
    expect(aprobada?.cuerpo).toBe("Foo Bar Co is located at 39.7392, 104.9903");
    // Una variable declarada fuera del cuerpo (p. ej. en la URL de un
    // archivo) también se pide: si se omite, Twilio usaría su valor de muestra.
    expect(aprobada?.variables).toEqual([{ clave: "name", ejemplo: "foo" }]);
  });

  it("no revienta con basura", () => {
    expect(leerPlantilla(null)).toBeNull();
    expect(leerPlantilla("texto")).toBeNull();
    expect(leerPlantilla(42)).toBeNull();
  });
});

describe("paginaSiguiente", () => {
  it("sigue la página siguiente de Twilio", () => {
    const url = "https://content.twilio.com/v1/ContentAndApprovals?PageToken=abc";
    expect(paginaSiguiente(url)).toBe(url);
  });

  it("no sigue una URL de otro sitio: llevaría las credenciales en la cabecera", () => {
    expect(paginaSiguiente("https://ataque.example/robar")).toBeNull();
    expect(
      paginaSiguiente("https://content.twilio.com.ataque.example/v1"),
    ).toBeNull();
    expect(paginaSiguiente("http://content.twilio.com/v1")).toBeNull();
  });

  it("devuelve null cuando no hay más páginas o el valor no es una URL", () => {
    expect(paginaSiguiente(null)).toBeNull();
    expect(paginaSiguiente("")).toBeNull();
    expect(paginaSiguiente("no es una url")).toBeNull();
  });
});

describe("listarPlantillasAprobadas", () => {
  it("pide las plantillas con las credenciales de la cuenta", async () => {
    const fetchMock = responder({ contents: [deTwilio()], meta: {} });

    await listarPlantillasAprobadas();

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toContain("https://content.twilio.com/v1/ContentAndApprovals");
    expect(opciones.headers.Authorization).toBe(
      `Basic ${btoa("AC123:secreto")}`,
    );
  });

  it("devuelve solo las aprobadas, ordenadas por nombre", async () => {
    responder({
      contents: [
        deTwilio({ sid: OTRO_SID, friendly_name: "zeta" }),
        deTwilio({ friendly_name: "alfa" }),
        deTwilio({
          sid: `HX${"c".repeat(32)}`,
          approval_requests: { status: "pending" },
        }),
      ],
      meta: {},
    });

    const resultado = await listarPlantillasAprobadas();

    expect(resultado.ok && resultado.plantillas.map((p) => p.nombre)).toEqual([
      "alfa",
      "zeta",
    ]);
  });

  it("recorre todas las páginas", async () => {
    const fetchMock = responder(
      {
        contents: [deTwilio()],
        meta: {
          next_page_url:
            "https://content.twilio.com/v1/ContentAndApprovals?PageToken=p2",
        },
      },
      { contents: [deTwilio({ sid: OTRO_SID, friendly_name: "otra" })], meta: {} },
    );

    const resultado = await listarPlantillasAprobadas();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(resultado.ok && resultado.plantillas).toHaveLength(2);
  });

  it("no sigue una página siguiente que apunte fuera de Twilio", async () => {
    const fetchMock = responder({
      contents: [deTwilio()],
      meta: { next_page_url: "https://ataque.example/robar" },
    });

    await listarPlantillasAprobadas();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("explica el fallo cuando Twilio responde con error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }),
    );

    const resultado = await listarPlantillasAprobadas();

    expect(resultado).toEqual({
      ok: false,
      mensaje: "Twilio respondió 401 al pedir las plantillas.",
    });
  });

  it("no llama a Twilio sin credenciales", async () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    const fetchMock = responder({ contents: [] });

    const resultado = await listarPlantillasAprobadas();

    expect(resultado.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
