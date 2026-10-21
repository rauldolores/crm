import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { registroDeTiempoSchema } from "@/lib/soporteTiempos";
import { corregirTiempo, registrarTiempo } from "./tiempos";

const ORG = "11111111-1111-1111-1111-111111111111";

interface Respuesta {
  data: unknown;
  error: { message: string } | null;
}

/**
 * Cliente de Supabase mínimo: guarda lo que se inserta y devuelve lo que se
 * le indique para la lectura del registro original y para el alta.
 */
const clienteFalso = ({
  original = null,
  alta = { data: [{ id: 99 }], error: null },
}: {
  original?: Record<string, unknown> | null;
  alta?: Respuesta;
} = {}) => {
  const insertados: unknown[] = [];
  const filtros: [string, unknown][] = [];
  const db = {
    from: () => ({
      insert: (filas: unknown) => {
        insertados.push(filas);
        return { select: async () => alta };
      },
      select: () => {
        const consulta = {
          eq: (columna: string, valor: unknown) => {
            filtros.push([columna, valor]);
            return consulta;
          },
          maybeSingle: async () => ({ data: original, error: null }),
        };
        return consulta;
      },
    }),
  };
  return { db: db as unknown as SupabaseClient, insertados, filtros };
};

const original = {
  id: 5,
  organization_id: ORG,
  ticket_id: 7,
  atendio: 2,
  consume: true,
  motivo_no_consume: null,
  descripcion_cliente: "Se reinstaló el complemento.",
  nota_interna: "Era la versión vieja.",
  fecha_atencion: "2026-10-15",
  corrige_a: null,
};

describe("registrarTiempo", () => {
  it("manda la organización de la sesión y quien atendió, no la empresa", async () => {
    // Arrange
    const { db, insertados } = clienteFalso();
    const registro = registroDeTiempoSchema.parse({
      ticketId: 7,
      minutos: 30,
      descripcionCliente: "Se explicó el reporte mensual.",
    });

    // Act
    const resultado = await registrarTiempo(db, ORG, 2, registro);

    // Assert
    expect(resultado).toEqual({ ok: true, ids: [99] });
    expect(insertados[0]).toMatchObject({
      organization_id: ORG,
      ticket_id: 7,
      atendio: 2,
      minutos: 30,
    });
    expect(insertados[0]).not.toHaveProperty("company_id");
  });

  it("devuelve el mensaje del disparador cuando la base rechaza el alta", async () => {
    const { db } = clienteFalso({
      alta: { data: null, error: { message: "El ticket 7 no existe." } },
    });
    const registro = registroDeTiempoSchema.parse({
      ticketId: 7,
      minutos: 30,
      descripcionCliente: "x",
    });

    const resultado = await registrarTiempo(db, ORG, 2, registro);

    expect(resultado).toEqual({
      ok: false,
      estado: 400,
      mensaje: "El ticket 7 no existe.",
    });
  });
});

describe("corregirTiempo", () => {
  it("busca el original solo dentro de la organización de la sesión", async () => {
    const { db, filtros } = clienteFalso();

    const resultado = await corregirTiempo(db, ORG, 2, {
      id: 5,
      motivo: "Error de captura",
    });

    expect(filtros).toContainEqual(["organization_id", ORG]);
    expect(resultado).toMatchObject({ ok: false, estado: 404 });
  });

  it("solo anula cuando no se indican los minutos correctos", async () => {
    const { db, insertados } = clienteFalso({ original });

    const resultado = await corregirTiempo(db, ORG, 3, {
      id: 5,
      motivo: "Se registró en el ticket equivocado",
    });

    expect(resultado.ok).toBe(true);
    const filas = insertados[0] as Record<string, unknown>[];
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      corrige_a: 5,
      motivo_correccion: "Se registró en el ticket equivocado",
      atendio: 3,
    });
  });

  it("anula y deja la cifra buena en un solo alta", async () => {
    const { db, insertados } = clienteFalso({ original });

    await corregirTiempo(db, ORG, 3, {
      id: 5,
      motivo: "Fueron 20 minutos, no 60",
      minutosCorrectos: 20,
    });

    const filas = insertados[0] as Record<string, unknown>[];
    expect(insertados).toHaveLength(1);
    expect(filas).toHaveLength(2);
    expect(filas[1]).toMatchObject({
      minutos: 20,
      atendio: 2,
      descripcion_cliente: original.descripcion_cliente,
      fecha_atencion: "2026-10-15",
      consume: true,
    });
  });

  it("no corrige una corrección", async () => {
    const { db, insertados } = clienteFalso({
      original: { ...original, corrige_a: 4 },
    });

    const resultado = await corregirTiempo(db, ORG, 3, {
      id: 5,
      motivo: "Otra vez",
    });

    expect(resultado).toMatchObject({ ok: false, estado: 400 });
    expect(insertados).toHaveLength(0);
  });

  it("avisa cuando otra persona ya lo corrigió", async () => {
    const { db } = clienteFalso({
      original,
      alta: {
        data: null,
        error: {
          message:
            'duplicate key value violates unique constraint "soporte_tiempos_corrige_a_uk"',
        },
      },
    });

    const resultado = await corregirTiempo(db, ORG, 3, {
      id: 5,
      motivo: "Error",
    });

    expect(resultado).toEqual({
      ok: false,
      estado: 409,
      mensaje: "Ese registro ya se corrigió.",
    });
  });
});
