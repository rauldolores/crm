import { useNotify, useTranslate } from "ra-core";
import { useEffect } from "react";

import {
  EVENTO_EXCEDENTE,
  type Excedente,
} from "@/lib/kontrolia-auth/excedentes";

import { nombreDelLimite } from "./ConsumoDelPlan";
import { importeConMoneda } from "./formato";
import { recargarDerechos } from "./useDerechos";

/** «Tus 150 contactos registrados del mes se agotaron; cada extra cuesta $3.50 MXN». */
export const textoDeAviso = (
  excedente: Pick<
    Excedente,
    "key" | "limit" | "period" | "overagePriceAmount" | "currency"
  >,
  translate: (clave: string, opciones?: Record<string, unknown>) => string,
): string =>
  translate("crm.billing.overage_notice", {
    limit: excedente.limit ?? 0,
    name: nombreDelLimite({ key: excedente.key }).toLowerCase(),
    period: translate(`crm.billing.overage_periods.${excedente.period}`),
    price: importeConMoneda(
      excedente.overagePriceAmount ?? 0,
      excedente.currency,
    ),
  });

/** «12 extra · $42.00 MXN este mes». */
export const textoDeAcumulado = (
  excedente: Pick<
    Excedente,
    "period" | "overageUnits" | "overageAmount" | "currency"
  >,
  translate: (clave: string, opciones?: Record<string, unknown>) => string,
): string =>
  translate("crm.billing.overage_accumulated", {
    units: excedente.overageUnits,
    amount: importeConMoneda(excedente.overageAmount, excedente.currency),
    period: translate(`crm.billing.overage_periods.${excedente.period}`),
  });

/**
 * Escucha las operaciones que el servidor dejó pasar en excedente y lo dice
 * con una notificación; además recarga los derechos para que la barra
 * lateral enseñe el acumulado al momento. Un aviso por límite y periodo:
 * quien ya lo vio no necesita verlo con cada contacto que cree.
 */
export const AvisoDeExcedente = () => {
  const notify = useNotify();
  const translate = useTranslate();

  useEffect(() => {
    const avisados = new Set<string>();
    const alExcedente = (evento: Event) => {
      const excedente = (evento as CustomEvent<Excedente>).detail;
      if (!excedente || excedente.overagePriceAmount === null) return;
      void recargarDerechos();
      const clave = `${excedente.key}:${excedente.period}`;
      if (avisados.has(clave)) return;
      avisados.add(clave);
      notify(
        `${textoDeAviso(excedente, translate)} ${textoDeAcumulado(excedente, translate)}`,
        { type: "warning", autoHideDuration: 10000 },
      );
    };
    window.addEventListener(EVENTO_EXCEDENTE, alExcedente);
    return () => window.removeEventListener(EVENTO_EXCEDENTE, alExcedente);
  }, [notify, translate]);

  return null;
};
