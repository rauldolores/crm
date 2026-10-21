import { describe, expect, it } from "vitest";

import type { Contract, CustomerUsage } from "../types";
import {
  agruparUso,
  ajustesDeRiesgo,
  consumo,
  diasDesde,
  fechaCorta,
  mesAnterior,
  nombreDelMes,
  ultimoAcceso,
  usuariosActivos,
} from "./usoDelCliente";

const AHORA = new Date("2026-10-21T18:00:00Z");
const haceDias = (dias: number) =>
  new Date(AHORA.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();

describe("ajustesDeRiesgo", () => {
  it("sin nada guardado valen los de fábrica: activo y 14 días", () => {
    expect(ajustesDeRiesgo(undefined)).toEqual({
      active: true,
      inactivityDays: 14,
    });
    expect(ajustesDeRiesgo([])).toEqual({ active: true, inactivityDays: 14 });
  });

  it("respeta lo guardado", () => {
    expect(ajustesDeRiesgo({ active: false, inactivityDays: 30 })).toEqual({
      active: false,
      inactivityDays: 30,
    });
    expect(ajustesDeRiesgo({ inactivityDays: "21" }).inactivityDays).toBe(21);
  });

  it("días inválidos valen 14; más de 365 se queda en 365", () => {
    expect(ajustesDeRiesgo({ inactivityDays: 0 }).inactivityDays).toBe(14);
    expect(ajustesDeRiesgo({ inactivityDays: -3 }).inactivityDays).toBe(14);
    expect(ajustesDeRiesgo({ inactivityDays: 7.5 }).inactivityDays).toBe(14);
    expect(ajustesDeRiesgo({ inactivityDays: null }).inactivityDays).toBe(14);
    expect(ajustesDeRiesgo({ inactivityDays: 900 }).inactivityDays).toBe(365);
  });
});

describe("usuarios y último acceso", () => {
  const contactos = [
    { source: "kontrolia_auth", last_seen: haceDias(2), archived_at: null },
    { source: "kontrolia_auth", last_seen: haceDias(45), archived_at: null },
    { source: "kontrolia_auth", last_seen: null, archived_at: null },
    // Archivado (ya no es usuario): no cuenta aunque haya entrado ayer.
    {
      source: "kontrolia_auth",
      last_seen: haceDias(1),
      archived_at: haceDias(1),
    },
    // Capturado a mano: no es usuario de la plataforma.
    { source: null, last_seen: haceDias(0), archived_at: null },
  ];

  it("cuenta a los usuarios que entraron en los últimos 30 días", () => {
    expect(usuariosActivos(contactos, AHORA)).toEqual({ activos: 1, total: 3 });
  });

  it("el último acceso es el más reciente de los usuarios vigentes", () => {
    expect(ultimoAcceso(contactos)).toBe(haceDias(2));
  });

  it("sin contactos sincronizados cuenta a todos los vigentes", () => {
    const aMano = [
      { last_seen: haceDias(3), archived_at: null },
      { last_seen: null, archived_at: null },
    ];
    expect(usuariosActivos(aMano, AHORA)).toEqual({ activos: 1, total: 2 });
  });

  it("si nadie ha entrado, no hay último acceso", () => {
    expect(ultimoAcceso([{ last_seen: null }])).toBeNull();
    expect(usuariosActivos([], AHORA)).toEqual({ activos: 0, total: 0 });
  });
});

describe("fechas", () => {
  it("días de calendario desde un instante", () => {
    expect(diasDesde(AHORA.toISOString(), AHORA)).toBe(0);
    expect(diasDesde(haceDias(3), AHORA)).toBe(3);
    // Un instante en el futuro (reloj desfasado) cuenta como hoy.
    expect(diasDesde(haceDias(-1), AHORA)).toBe(0);
  });

  it("fecha corta y nombre del mes en español", () => {
    expect(fechaCorta("2026-10-19T12:00:00")).toBe("19 oct 2026");
    expect(nombreDelMes("2026-10-01")).toBe("octubre de 2026");
    expect(mesAnterior("2026-01-01")).toBe("2025-12-01");
  });
});

describe("consumo", () => {
  it("dentro de lo incluido", () => {
    expect(consumo({ used: 120, included: 200 })).toEqual({
      usado: 120,
      incluido: 200,
      porcentaje: 60,
      excedente: 0,
    });
  });

  it("pasado de lo incluido: barra llena y lo de más", () => {
    expect(consumo({ used: 230, included: 200 })).toEqual({
      usado: 230,
      incluido: 200,
      porcentaje: 100,
      excedente: 30,
    });
  });

  it("sin límite no hay barra", () => {
    expect(consumo({ used: 5000, included: null })).toEqual({
      usado: 5000,
      incluido: null,
      porcentaje: null,
      excedente: 0,
    });
  });

  it("incluido en cero: cualquier uso es de más", () => {
    expect(consumo({ used: 3, included: 0 })).toMatchObject({
      porcentaje: 100,
      excedente: 3,
    });
    expect(consumo({ used: 0, included: 0 }).porcentaje).toBe(0);
  });
});

describe("agruparUso", () => {
  const fila = (
    datos: Partial<CustomerUsage> &
      Pick<CustomerUsage, "application_slug" | "limit_key" | "period_start">,
  ): CustomerUsage => ({
    id: `${datos.application_slug}-${datos.limit_key}-${datos.period_start}`,
    company_id: 1,
    used: 0,
    included: null,
    ...datos,
  });
  const contratos = [
    {
      id: 1,
      application_slug: "aduaniax",
      name: "AduaniaX · IMMEX",
      status: "active",
    },
    {
      id: 2,
      application_slug: "facturacion",
      name: "Faqturia · Básico",
      status: "active",
    },
  ] as Contract[];

  it("sin uso no hay productos", () => {
    expect(agruparUso([], contratos)).toEqual({
      mesActual: null,
      productos: [],
    });
  });

  it("agrupa por producto, con el mes actual y el anterior de cada límite", () => {
    const { mesActual, productos } = agruparUso(
      [
        fila({
          application_slug: "aduaniax",
          limit_key: "ctm_paginas",
          description: "Páginas escaneadas",
          period_start: "2026-10-01",
          used: 120,
          included: 200,
        }),
        fila({
          application_slug: "aduaniax",
          limit_key: "ctm_paginas",
          description: "Páginas escaneadas",
          period_start: "2026-09-01",
          used: 180,
          included: 200,
        }),
        fila({
          application_slug: "facturacion",
          limit_key: "timbres",
          description: "Timbres",
          period_start: "2026-10-01",
          used: 40,
        }),
        // Más viejo que el mes anterior: no se enseña.
        fila({
          application_slug: "aduaniax",
          limit_key: "ctm_paginas",
          period_start: "2026-08-01",
          used: 999,
        }),
      ],
      contratos,
    );
    expect(mesActual).toBe("2026-10-01");
    expect(productos.map((p) => p.nombre)).toEqual(["AduaniaX", "Faqturia"]);
    const [paginas] = productos[0].limites;
    expect(paginas.descripcion).toBe("Páginas escaneadas");
    expect(paginas.actual?.used).toBe(120);
    expect(paginas.anterior?.used).toBe(180);
    expect(productos[1].limites[0].anterior).toBeNull();
  });

  it("un límite que solo trae el mes anterior sale sin consumo actual", () => {
    const { productos } = agruparUso([
      fila({
        application_slug: "aduaniax",
        limit_key: "a",
        period_start: "2026-10-01",
      }),
      fila({
        application_slug: "aduaniax",
        limit_key: "b",
        period_start: "2026-09-01",
        used: 5,
      }),
    ]);
    const b = productos[0].limites.find((l) => l.limit_key === "b")!;
    expect(b.actual).toBeNull();
    expect(b.anterior?.used).toBe(5);
    // Sin contrato, el producto se nombra por su clave.
    expect(productos[0].nombre).toBe("aduaniax");
  });
});
