import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { juzgarDuplicados } from "./juicio";

const ORGANIZACION = "org-1";

/**
 * Encadenable como el cliente de Supabase, con los dos caminos que usa el
 * módulo: `.eq().in()` para leer los candidatos y `.eq().eq().maybeSingle()`
 * para resolver el nombre de la empresa.
 */
const clienteQueDevuelve = (filas: unknown[], empresa: unknown = null) => {
  const inMock = vi.fn().mockResolvedValue({ data: filas });
  const maybeSingle = vi.fn().mockResolvedValue({ data: empresa });
  const eq = vi.fn(() => ({ in: inMock, eq: () => ({ maybeSingle }) }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { cliente: { from }, from, select, eq, in: inMock, maybeSingle };
};

const { getServiceClient } = vi.hoisted(() => ({
  getServiceClient: vi.fn(),
}));

vi.mock("../supabase-service", () => ({ getServiceClient }));

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
  getServiceClient.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("juzgarDuplicados", () => {
  it("pregunta una vez por candidato y devuelve su probabilidad", async () => {
    const { cliente } = clienteQueDevuelve([
      { id: 7, first_name: "Juan", last_name: "García", company_name: "Lola" },
      { id: 9, first_name: "Juan", last_name: "García", company_name: "Otra" },
    ]);
    getServiceClient.mockReturnValue(cliente);
    const fetchMock = responder({
      id_7: { type: "noul", noul: 0.93 },
      id_9: { type: "noul", noul: 0.04 },
    });

    const veredicto = await juzgarDuplicados(
      ORGANIZACION,
      "contacts",
      { nombre: "Juan", apellidos: "García" },
      [7, 9],
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const cuerpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(cuerpo.questions)).toEqual(["id_7", "id_9"]);
    expect(cuerpo.questions.id_7.type).toBe("noul");
    expect(veredicto).toEqual({ 7: 0.93, 9: 0.04 });
  });

  it("cambia el id de la empresa por su nombre, que es lo que distingue a dos homónimos", async () => {
    const consulta = clienteQueDevuelve([{ id: 7 }], { name: "Panadería Lola" });
    getServiceClient.mockReturnValue(consulta.cliente);
    const fetchMock = responder({ id_7: { type: "noul", noul: 0.9 } });

    await juzgarDuplicados(
      ORGANIZACION,
      "contacts",
      { nombre: "Juan", empresa_id: "12" },
      [7],
    );

    const { state } = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(state.nuevo).toEqual({ nombre: "Juan", empresa: "Panadería Lola" });
    expect(state.nuevo.empresa_id).toBeUndefined();
  });

  it("sigue adelante si la empresa no se puede resolver", async () => {
    const consulta = clienteQueDevuelve([{ id: 7 }], null);
    getServiceClient.mockReturnValue(consulta.cliente);
    const fetchMock = responder({ id_7: { type: "noul", noul: 0.9 } });

    await juzgarDuplicados(
      ORGANIZACION,
      "contacts",
      { nombre: "Juan", empresa_id: "99" },
      [7],
    );

    const { state } = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(state.nuevo).toEqual({ nombre: "Juan" });
  });

  it("acota la lectura a la organización de quien pregunta", async () => {
    const consulta = clienteQueDevuelve([{ id: 7 }]);
    getServiceClient.mockReturnValue(consulta.cliente);
    responder({ id_7: { type: "noul", noul: 0.8 } });

    await juzgarDuplicados(ORGANIZACION, "companies", { nombre: "Lola" }, [7]);

    expect(consulta.from).toHaveBeenCalledWith("companies");
    expect(consulta.eq).toHaveBeenCalledWith("organization_id", ORGANIZACION);
    expect(consulta.in).toHaveBeenCalledWith("id", [7]);
  });

  it("nunca juzga más de cinco candidatos", async () => {
    const consulta = clienteQueDevuelve([{ id: 1 }]);
    getServiceClient.mockReturnValue(consulta.cliente);
    responder({ id_1: { type: "noul", noul: 0.9 } });

    await juzgarDuplicados(
      ORGANIZACION,
      "contacts",
      { nombre: "Ana" },
      [1, 2, 3, 4, 5, 6, 7],
    );

    expect(consulta.in).toHaveBeenCalledWith("id", [1, 2, 3, 4, 5]);
  });

  it("no consulta nada sin clasificador", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const fetchMock = responder({});

    expect(
      await juzgarDuplicados(ORGANIZACION, "contacts", { nombre: "Ana" }, [1]),
    ).toEqual({});
    expect(getServiceClient).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no opina si los candidatos no son de esta organización", async () => {
    const { cliente } = clienteQueDevuelve([]);
    getServiceClient.mockReturnValue(cliente);
    const fetchMock = responder({});

    expect(
      await juzgarDuplicados(ORGANIZACION, "contacts", { nombre: "Ana" }, [99]),
    ).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve el mapa vacío si el clasificador falla", async () => {
    const { cliente } = clienteQueDevuelve([{ id: 7 }]);
    getServiceClient.mockReturnValue(cliente);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(
      await juzgarDuplicados(ORGANIZACION, "contacts", { nombre: "Ana" }, [7]),
    ).toEqual({});
  });
});
