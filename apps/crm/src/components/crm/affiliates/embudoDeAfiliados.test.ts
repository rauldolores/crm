import { describe, expect, it } from "vitest";

import type { DealPipeline } from "../types";
import {
  embudoDeAfiliados,
  filtroDeEmpresasParaEmbudo,
} from "./embudoDeAfiliados";

const etapa = (value: string, label = value) => ({ value, label });

// El embudo real de Kontrolia: los valores no coinciden con las etiquetas, y
// «lost» es «Acuerdo» (sigue en proceso), no una pérdida.
const AFILIADOS: DealPipeline = {
  value: "afiliados",
  label: "Afiliados",
  stages: [
    etapa("opportunity", "Solicitud"),
    etapa("proposal-sent", "Contacto inicial"),
    etapa("in-negociation", "Calificación"),
    etapa("won", "Capacitación"),
    etapa("lost", "Acuerdo"),
    etapa("delayed", "Activo"),
    etapa("rechazado", "Rechazado"),
  ],
  pipelineStatuses: ["delayed", "lost"],
  lostStages: ["rechazado"],
};

const VENTAS: DealPipeline = {
  value: "ventas",
  label: "Ventas",
  stages: [etapa("opportunity"), etapa("won")],
  pipelineStatuses: ["won"],
  lostStages: [],
};

const MODULO = {
  active: true,
  pipelineId: "afiliados",
  completionStages: ["delayed"],
};

describe("embudoDeAfiliados", () => {
  it("en proceso son las etapas sin la de afiliación completa ni las rechazadas", () => {
    const { etapasEnProceso } = embudoDeAfiliados(MODULO, [VENTAS, AFILIADOS]);

    expect(etapasEnProceso).toEqual([
      "opportunity",
      "proposal-sent",
      "in-negociation",
      "won",
      "lost",
    ]);
  });

  it("no está activo si el módulo está apagado", () => {
    const resultado = embudoDeAfiliados({ ...MODULO, active: false }, [
      AFILIADOS,
    ]);

    expect(resultado.activo).toBe(false);
  });

  it("no está activo si el embudo configurado ya no existe", () => {
    const resultado = embudoDeAfiliados(MODULO, [VENTAS]);

    expect(resultado.activo).toBe(false);
    expect(resultado.etapasEnProceso).toEqual([]);
  });
});

describe("filtroDeEmpresasParaEmbudo", () => {
  const afiliados = embudoDeAfiliados(MODULO, [VENTAS, AFILIADOS]);

  it("en el embudo de afiliados ofrece solo afiliados", () => {
    expect(filtroDeEmpresasParaEmbudo(afiliados, "afiliados")).toEqual({
      is_affiliate: true,
    });
  });

  it("en cualquier otro embudo ofrece solo clientes", () => {
    expect(filtroDeEmpresasParaEmbudo(afiliados, "ventas")).toEqual({
      is_client: true,
    });
  });

  it("sin embudo elegido trata la oportunidad como de cliente", () => {
    expect(filtroDeEmpresasParaEmbudo(afiliados, undefined)).toEqual({
      is_client: true,
    });
  });

  it("sin el módulo no filtra: todas las empresas son clientes", () => {
    const apagado = embudoDeAfiliados({ ...MODULO, active: false }, [
      AFILIADOS,
    ]);

    expect(filtroDeEmpresasParaEmbudo(apagado, "afiliados")).toEqual({});
  });
});
