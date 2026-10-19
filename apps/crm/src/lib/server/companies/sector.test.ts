import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sugerirSector } from "./sector";

const ORG = "11111111-1111-1111-1111-111111111111";

const SECTORES = [
  { value: "automotive", label: "Automotriz" },
  { value: "food", label: "Alimentos y bebidas" },
  { value: "software", label: "Software y tecnología" },
];

const decisiones = vi.fn();

vi.mock("../ia/auditoria", () => ({
  registrarDecisiones: (...args: unknown[]) => {
    decisiones(...args);
    return Promise.resolve();
  },
}));

const responder = (answers: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ answers }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => {
  vi.stubEnv("TYPESAFE_API_KEY", "clave-secreta");
  decisiones.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sugerirSector", () => {
  it("propone un sector de la lista de la organización", async () => {
    const fetchMock = responder({
      sector: { type: "choice", choice: "food", confidence: 0.93 },
    });

    const sugerencia = await sugerirSector(
      ORG,
      { nombre: "Panadería Lola", sitio: "panaderialola.mx" },
      SECTORES,
    );

    expect(sugerencia).toEqual({ sector: "food", confianza: 0.93 });
    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo.state).toEqual({
      empresa: "Panadería Lola",
      sitio_web: "panaderialola.mx",
    });
  });

  it("no rellena nada cuando el nombre no dice a qué se dedica", async () => {
    responder({
      sector: { type: "choice", choice: "_ninguno", confidence: 0.85 },
    });

    const sugerencia = await sugerirSector(
      ORG,
      { nombre: "Grupo GTX", sitio: "" },
      SECTORES,
    );

    expect(sugerencia.sector).toBeNull();
    expect(decisiones).toHaveBeenCalledWith(ORG, [
      {
        kind: "company_sector",
        value: "_ninguno",
        confianza: 0.85,
        aplicada: false,
      },
    ]);
  });

  it("descarta un sector que no está en Ajustes", async () => {
    responder({
      sector: { type: "choice", choice: "mineria", confidence: 0.99 },
    });

    expect(
      (await sugerirSector(ORG, { nombre: "Minas del Norte", sitio: "" }, SECTORES))
        .sector,
    ).toBeNull();
  });

  it("no pregunta sin nombre, sin sectores configurados ni sin clave", async () => {
    const fetchMock = responder({});

    await sugerirSector(ORG, { nombre: "   ", sitio: "" }, SECTORES);
    await sugerirSector(ORG, { nombre: "Panadería Lola", sitio: "" }, []);
    vi.stubEnv("TYPESAFE_API_KEY", "");
    await sugerirSector(ORG, { nombre: "Panadería Lola", sitio: "" }, SECTORES);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si la API falla, el desplegable se queda como estaba", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(
      await sugerirSector(ORG, { nombre: "Panadería Lola", sitio: "" }, SECTORES),
    ).toEqual({ sector: null, confianza: null });
    expect(decisiones).not.toHaveBeenCalled();
  });
});
