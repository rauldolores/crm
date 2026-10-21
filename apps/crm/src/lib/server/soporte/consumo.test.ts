import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  cabecerasCors,
  limitesDelMes,
  listaDeOrigenes,
  responderConsumo,
  responderPreflight,
  type ConsumoDeSoporte,
  type DependenciasDeConsumo,
} from "./consumo";

const KONTROLIA = "25e354a1-0000-0000-0000-000000000001";
const OTRA = "99999999-0000-0000-0000-000000000009";
const CLIENTE_AUTH = "c1c1c1c1-0000-0000-0000-000000000001";
const ADUANIAX = "https://app.aduaniax.com";

type Fila = Record<string, unknown>;

/**
 * Base en memoria con lo justo del cliente de Supabase: select de columnas,
 * eq / in / gte / lte, order, limit, maybeSingle y rpc. Aplica los filtros
 * de verdad, para que una consulta sin el filtro de organización devuelva
 * filas ajenas y la prueba lo note.
 */
const baseFalsa = (
  tablas: Record<string, Fila[]>,
  resumen: Fila | null,
  llamadas: { rpc: unknown[] } = { rpc: [] },
) => {
  const consulta = (tabla: string) => {
    let filas = [...(tablas[tabla] ?? [])];
    let columnas: string[] | null = null;
    const q = {
      select(lista: string) {
        columnas = lista.split(",").map((c) => c.trim());
        return q;
      },
      eq(columna: string, valor: unknown) {
        filas = filas.filter((f) => f[columna] === valor);
        return q;
      },
      in(columna: string, valores: unknown[]) {
        filas = filas.filter((f) => valores.includes(f[columna]));
        return q;
      },
      gte(columna: string, valor: string) {
        filas = filas.filter((f) => String(f[columna]) >= valor);
        return q;
      },
      lte(columna: string, valor: string) {
        filas = filas.filter((f) => String(f[columna]) <= valor);
        return q;
      },
      order(columna: string) {
        filas = [...filas].sort((a, b) =>
          String(a[columna]).localeCompare(String(b[columna]), "en", {
            numeric: true,
          }),
        );
        return q;
      },
      limit(n: number) {
        filas = filas.slice(0, n);
        return q;
      },
      recortar: () =>
        filas.map((f) =>
          columnas
            ? Object.fromEntries(columnas.map((c) => [c, f[c]]))
            : { ...f },
        ),
      async maybeSingle() {
        return { data: q.recortar()[0] ?? null, error: null };
      },
      then(resolver: (r: { data: Fila[]; error: null }) => unknown) {
        return Promise.resolve({ data: q.recortar(), error: null }).then(
          resolver,
        );
      },
    };
    return q;
  };
  return {
    from: consulta,
    rpc: (nombre: string, argumentos: unknown) => {
      llamadas.rpc.push({ nombre, argumentos });
      return { maybeSingle: async () => ({ data: resumen, error: null }) };
    },
  } as unknown as SupabaseClient;
};

const tablas = (): Record<string, Fila[]> => ({
  companies: [
    {
      id: 1,
      name: "Agencia Aduanal Norte",
      organization_id: KONTROLIA,
      source: "kontrolia_auth",
      external_id: CLIENTE_AUTH,
    },
    // La misma organización del cliente, ligada en OTRA organización del
    // CRM: no debe encontrarse.
    {
      id: 50,
      name: "Copia ajena",
      organization_id: OTRA,
      source: "kontrolia_auth",
      external_id: CLIENTE_AUTH,
    },
  ],
  soporte_tiempos: [
    {
      id: 12,
      organization_id: KONTROLIA,
      company_id: 1,
      fecha_atencion: "2026-10-15",
      ticket_id: 7,
      atendio: 2,
      descripcion_cliente: "Se reinstaló el complemento.",
      nota_interna: "SECRETO: el cliente borró la carpeta",
      minutos: 60,
      consume: true,
      motivo_no_consume: null,
      corrige_a: null,
    },
    {
      id: 11,
      organization_id: KONTROLIA,
      company_id: 1,
      fecha_atencion: "2026-10-03",
      ticket_id: 7,
      atendio: null,
      descripcion_cliente: "Falla al timbrar.",
      nota_interna: "SECRETO 2",
      minutos: 30,
      consume: false,
      motivo_no_consume: "FALLA_SISTEMA",
      corrige_a: null,
    },
    {
      id: 13,
      organization_id: KONTROLIA,
      company_id: 1,
      fecha_atencion: "2026-10-15",
      ticket_id: 7,
      atendio: 2,
      descripcion_cliente: "Corrección del registro del 15/10/2026",
      nota_interna: null,
      minutos: -60,
      consume: true,
      motivo_no_consume: null,
      corrige_a: 12,
    },
    // Otro mes y otra empresa: no deben salir.
    {
      id: 5,
      organization_id: KONTROLIA,
      company_id: 1,
      fecha_atencion: "2026-09-30",
      ticket_id: 7,
      atendio: 2,
      descripcion_cliente: "Septiembre",
      minutos: 10,
      consume: true,
      corrige_a: null,
    },
    {
      id: 6,
      organization_id: KONTROLIA,
      company_id: 2,
      fecha_atencion: "2026-10-10",
      ticket_id: 8,
      atendio: 2,
      descripcion_cliente: "Otra empresa",
      minutos: 10,
      consume: true,
      corrige_a: null,
    },
  ],
  tickets: [
    {
      id: 7,
      organization_id: KONTROLIA,
      subject: "[support] No timbra el pedimento",
    },
  ],
  sales: [
    { id: 2, organization_id: KONTROLIA, first_name: "Raúl", last_name: "D." },
  ],
  soporte_bolsas: [
    { slug: "10-horas-de-soporte-basico", nombre: "Soporte Básico" },
  ],
});

const resumen = {
  mes: "2026-10-01",
  bolsas: ["10-horas-de-soporte-basico"],
  minutos_incluidos: 600,
  minutos_usados: 0,
  minutos_de_mas: 0,
  minutos_no_consumen: 30,
  precio_hora_de_mas_centavos: 40000,
  registros: 3,
};

const deps = (
  extra: Partial<DependenciasDeConsumo> = {},
): DependenciasDeConsumo => ({
  verificarToken: async () => ({ organizationId: CLIENTE_AUTH }),
  db: baseFalsa(tablas(), resumen),
  organizacionCrm: KONTROLIA,
  origenesPermitidos: [ADUANIAX],
  ahora: new Date("2026-10-20T18:00:00Z"),
  ...extra,
});

const peticion = (consulta = "?aplicacion=aduaniax&mes=2026-10", origen = ADUANIAX) =>
  new Request(`https://crm.test/api/soporte/consumo${consulta}`, {
    headers: { origin: origen, authorization: "Bearer x" },
  });

describe("responderConsumo", () => {
  it("devuelve el resumen y los registros del mes de la empresa del token", async () => {
    // Act
    const respuesta = await responderConsumo(peticion(), deps());
    const cuerpo = (await respuesta.json()) as ConsumoDeSoporte;

    // Assert
    expect(respuesta.status).toBe(200);
    expect(cuerpo).toMatchObject({
      mes: "2026-10",
      empresa: { nombre: "Agencia Aduanal Norte" },
      bolsas: [{ slug: "10-horas-de-soporte-basico", nombre: "Soporte Básico" }],
      minutosIncluidos: 600,
      minutosUsados: 0,
      minutosDeMas: 0,
      minutosNoConsumen: 30,
      precioHoraDeMasCentavos: 40000,
    });
    expect(cuerpo.registros.map((r) => r.id)).toEqual([11, 12, 13]);
    expect(cuerpo.registros[0]).toEqual({
      id: 11,
      fecha: "2026-10-03",
      ticket: { id: 7, asunto: "No timbra el pedimento" },
      atendio: null,
      descripcion: "Falla al timbrar.",
      minutos: 30,
      consume: false,
      motivoNoConsume: "FALLA_SISTEMA",
      esCorreccion: false,
    });
    expect(cuerpo.registros[1].atendio).toBe("Raúl D.");
    expect(cuerpo.registros[2].esCorreccion).toBe(true);
  });

  it("nunca devuelve la nota interna", async () => {
    const respuesta = await responderConsumo(peticion(), deps());
    const texto = await respuesta.text();

    expect(texto).not.toContain("SECRETO");
    expect(texto).not.toContain("nota");
  });

  it("pide el resumen de la empresa ligada y del primer día del mes", async () => {
    const llamadas = { rpc: [] as unknown[] };

    await responderConsumo(
      peticion(),
      deps({ db: baseFalsa(tablas(), resumen, llamadas) }),
    );

    expect(llamadas.rpc).toEqual([
      {
        nombre: "soporte_resumen",
        argumentos: { p_company_id: 1, p_mes: "2026-10-01" },
      },
    ]);
  });

  it("usa el mes en curso de México si no se indica", async () => {
    const respuesta = await responderConsumo(
      peticion("?aplicacion=aduaniax"),
      // 1 de noviembre 02:00 UTC = 31 de octubre en México.
      deps({ ahora: new Date("2026-11-01T02:00:00Z") }),
    );

    expect((await respuesta.json()).mes).toBe("2026-10");
  });

  it("responde 401 sin token válido", async () => {
    const respuesta = await responderConsumo(
      peticion(),
      deps({ verificarToken: async () => null }),
    );

    expect(respuesta.status).toBe(401);
  });

  it("responde 401 si el token no trae organización", async () => {
    const respuesta = await responderConsumo(
      peticion(),
      deps({ verificarToken: async () => ({}) }),
    );

    expect(respuesta.status).toBe(401);
  });

  it("responde 404 si la organización no tiene empresa ligada en KONTROLIA", async () => {
    const respuesta = await responderConsumo(
      peticion(),
      deps({ organizacionCrm: "00000000-0000-0000-0000-000000000000" }),
    );

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({
      error: "Tu organización no tiene soporte registrado.",
    });
  });

  it("responde 400 con un mes mal escrito", async () => {
    for (const mes of ["2026-13", "2026-1", "octubre"]) {
      const respuesta = await responderConsumo(
        peticion(`?mes=${mes}`),
        deps(),
      );
      expect(respuesta.status).toBe(400);
    }
  });

  it("responde 503 si falta la organización de KONTROLIA en la configuración", async () => {
    const respuesta = await responderConsumo(
      peticion(),
      deps({ organizacionCrm: undefined }),
    );

    expect(respuesta.status).toBe(503);
  });

  it("lleva CORS para un origen permitido, también en los errores", async () => {
    const respuesta = await responderConsumo(
      peticion(),
      deps({ verificarToken: async () => null }),
    );

    expect(respuesta.headers.get("access-control-allow-origin")).toBe(ADUANIAX);
    expect(respuesta.headers.get("cache-control")).toContain("no-store");
  });
});

describe("CORS", () => {
  it("no abre la puerta a un origen que no está en la lista", () => {
    const cabeceras = cabecerasCors(
      peticion("", "https://malicioso.example"),
      [ADUANIAX],
    );

    expect(cabeceras["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("responde el preflight con los métodos y cabeceras permitidos", () => {
    const respuesta = responderPreflight(peticion(), [ADUANIAX]);

    expect(respuesta.status).toBe(204);
    expect(respuesta.headers.get("access-control-allow-headers")).toContain(
      "authorization",
    );
    expect(respuesta.headers.get("access-control-allow-methods")).toContain(
      "GET",
    );
  });

  it("lee la lista de orígenes de la variable de entorno", () => {
    expect(
      listaDeOrigenes(" https://app.aduaniax.com/ , http://localhost:3020 "),
    ).toEqual(["https://app.aduaniax.com", "http://localhost:3020"]);
    expect(listaDeOrigenes(undefined)).toEqual([]);
  });
});

describe("limitesDelMes", () => {
  it("da el primer y el último día, también en febrero", () => {
    expect(limitesDelMes("2026-10")).toEqual({
      inicio: "2026-10-01",
      fin: "2026-10-31",
    });
    expect(limitesDelMes("2028-02").fin).toBe("2028-02-29");
  });
});
