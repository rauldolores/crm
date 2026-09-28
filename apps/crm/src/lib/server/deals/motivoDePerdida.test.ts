import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sugerirMotivoDePerdida } from "./motivoDePerdida";

const ORG = "11111111-1111-1111-1111-111111111111";

const MOTIVOS = [
  { value: "price", label: "Precio" },
  { value: "competitor", label: "Se fue con la competencia" },
  { value: "no_budget", label: "Sin presupuesto" },
];

let deal: Record<string, unknown> | null;
let notas: Array<{ date: string; text: string }>;
const decisiones = vi.fn();

vi.mock("../ia/auditoria", () => ({
  registrarDecisiones: (...args: unknown[]) => {
    decisiones(...args);
    return Promise.resolve();
  },
}));

vi.mock("../supabase-service", () => ({
  getServiceClient: () => ({
    from: (tabla: string) =>
      tabla === "deals"
        ? {
            select: () => ({
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: deal }) }),
            }),
          }
        : {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: notas }),
                }),
              }),
            }),
          },
  }),
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
  deal = {
    id: 7,
    organization_id: ORG,
    name: "Tecnilenio - 8 licencias",
    description: "",
    amount: 48000,
  };
  // Como las devuelve la consulta real: la más reciente primero.
  notas = [
    {
      date: "2026-09-15T00:00:00Z",
      text: "Dicen que otro proveedor les dio un precio más bajo y se van con ellos",
    },
    { date: "2026-09-10T00:00:00Z", text: "Pidieron cotización de 8 usuarios" },
  ];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sugerirMotivoDePerdida", () => {
  it("propone un motivo de la lista de la organización", async () => {
    const fetchMock = responder({
      motivo: { type: "choice", choice: "competitor", confidence: 0.91 },
    });

    const sugerencia = await sugerirMotivoDePerdida(ORG, 7, MOTIVOS);

    expect(sugerencia).toEqual({
      loss_reason: "competitor",
      confianza: 0.91,
    });
    // Las notas viajan en orden cronológico: la conversación se lee como pasó.
    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(cuerpo.state.notas).toMatch(
      /cotización de 8 usuarios[\s\S]*precio más bajo/,
    );
  });

  it("deja el campo vacío si el modelo dice que las notas no lo cuentan", async () => {
    responder({
      motivo: { type: "choice", choice: "_ninguno", confidence: 0.88 },
    });

    const sugerencia = await sugerirMotivoDePerdida(ORG, 7, MOTIVOS);

    expect(sugerencia.loss_reason).toBeNull();
    // Pero queda la constancia de que se preguntó y de qué respondió.
    expect(decisiones).toHaveBeenCalledWith(ORG, [
      {
        kind: "deal_loss_reason",
        value: "_ninguno",
        confianza: 0.88,
        aplicada: false,
        entidad: { tabla: "deals", id: 7 },
      },
    ]);
  });

  it("propone sin umbral, porque hay una persona mirando el desplegable", async () => {
    responder({
      motivo: { type: "choice", choice: "price", confidence: 0.35 },
    });

    // Una propuesta floja se muestra (con su seguridad al lado) en vez de
    // ocultarse: la persona la ve antes de guardar y la cambia si no es eso.
    expect(await sugerirMotivoDePerdida(ORG, 7, MOTIVOS)).toEqual({
      loss_reason: "price",
      confianza: 0.35,
    });
  });

  it("no pregunta nada si la oportunidad no tiene ni una nota", async () => {
    notas = [];
    const fetchMock = responder({});

    const sugerencia = await sugerirMotivoDePerdida(ORG, 7, MOTIVOS);

    // El nombre de la oportunidad no dice por qué se perdió: una corazonada
    // sobre la nada es peor que una casilla vacía.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sugerencia.loss_reason).toBeNull();
  });

  it("no toca una oportunidad de otra organización", async () => {
    deal = { ...deal, organization_id: "otra-organizacion" };
    const fetchMock = responder({});

    expect(await sugerirMotivoDePerdida(ORG, 7, MOTIVOS)).toEqual({
      loss_reason: null,
      confianza: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no pregunta si la organización no configuró motivos", async () => {
    const fetchMock = responder({});

    await sugerirMotivoDePerdida(ORG, 7, []);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no pregunta sin clave del despliegue", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder({});

    await sugerirMotivoDePerdida(ORG, 7, MOTIVOS);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si la API falla, el desplegable se queda como siempre", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await sugerirMotivoDePerdida(ORG, 7, MOTIVOS)).toEqual({
      loss_reason: null,
      confianza: null,
    });
    expect(decisiones).not.toHaveBeenCalled();
  });
});
