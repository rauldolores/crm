/**
 * Reglas de «Mi día» que comparten la pantalla y el servidor: a qué etapa
 * avanza un prospecto, a cuáles se puede mover desde la cola, qué resultado
 * es válido y cómo se reparten las tareas vencidas en los próximos días.
 *
 * Los resultados salen de las etapas del propio embudo, no de una lista
 * aparte: en una cadencia como «Por contactar → WhatsApp → Correo → Llamada»
 * cada etapa ya dice qué canal se usó, así que «avanzar» es pasar a la
 * siguiente y cada organización lo configura al definir su embudo.
 */

export interface EtapaDeMiDia {
  value: string;
  label: string;
}

export interface EmbudoDeMiDia {
  value: string;
  label: string;
  stages: EtapaDeMiDia[];
  lostStages?: string[];
  pipelineStatuses?: string[];
}

export type ResultadoDeMiDia =
  | { tipo: "mover"; etapa: string }
  | { tipo: "quedarse" }
  | { tipo: "posponer"; fecha: string }
  | { tipo: "descartar"; motivo: string };

/** Las etapas en las que se trabaja: ni las de pérdida ni las ganadas. */
const esDeTrabajo = (embudo: EmbudoDeMiDia, etapa: string): boolean =>
  !(embudo.lostStages ?? []).includes(etapa) &&
  !(embudo.pipelineStatuses ?? []).includes(etapa);

/** La etapa donde esperan los prospectos que nadie ha tocado. */
export const primeraEtapa = (embudo: EmbudoDeMiDia): EtapaDeMiDia | null =>
  embudo.stages.find((etapa) => esDeTrabajo(embudo, etapa.value)) ?? null;

/**
 * La siguiente etapa de trabajo después de `actual`, en el orden del
 * embudo. Nunca propone ganar ni perder: eso tiene sus propias reglas
 * (motivo de pérdida, ingreso para ganar) y su propio botón.
 */
export const siguienteEtapa = (
  embudo: EmbudoDeMiDia,
  actual: string,
): EtapaDeMiDia | null => {
  const posicion = embudo.stages.findIndex((etapa) => etapa.value === actual);
  if (posicion === -1) return null;
  return (
    embudo.stages
      .slice(posicion + 1)
      .find((etapa) => esDeTrabajo(embudo, etapa.value)) ?? null
  );
};

/** Para comparar nombres sin que importen mayúsculas ni acentos. */
const normalizar = (texto: string): string =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/**
 * A qué etapa lleva el botón principal. Si más adelante en el embudo hay una
 * etapa que se llama como el canal que se usó («Llamada» tras llamar), esa:
 * en una cadencia por canales, la etapa dice qué canal ya se usó, y saltar
 * de «Por contactar» a «WhatsApp» después de una llamada lo falsearía. Si
 * no la hay, la siguiente etapa de trabajo.
 */
export const etapaSugerida = (
  embudo: EmbudoDeMiDia,
  actual: string,
  nombreDelCanal: string | null,
): EtapaDeMiDia | null => {
  const posicion = embudo.stages.findIndex((etapa) => etapa.value === actual);
  if (posicion === -1) return null;
  if (nombreDelCanal) {
    const delCanal = embudo.stages
      .slice(posicion + 1)
      .find(
        (etapa) =>
          esDeTrabajo(embudo, etapa.value) &&
          normalizar(etapa.label) === normalizar(nombreDelCanal),
      );
    if (delCanal) return delCanal;
  }
  return siguienteEtapa(embudo, actual);
};

/**
 * A qué etapas se puede mover desde la cola. Las de pérdida van por
 * «Descartar», que pide motivo; las ganadas, solo si la organización no
 * exige un ingreso para ganar (eso se comprueba en el tablero).
 */
export const destinosPosibles = (
  embudo: EmbudoDeMiDia,
  actual: string,
  exigirIngresoParaGanar: boolean,
): EtapaDeMiDia[] =>
  embudo.stages.filter(
    (etapa) =>
      etapa.value !== actual &&
      !(embudo.lostStages ?? []).includes(etapa.value) &&
      !(
        exigirIngresoParaGanar &&
        (embudo.pipelineStatuses ?? []).includes(etapa.value)
      ),
  );

/** La etapa a la que va un prospecto descartado, si el embudo tiene una. */
export const etapaDeDescarte = (embudo: EmbudoDeMiDia): string | null =>
  (embudo.lostStages ?? []).find((valor) =>
    embudo.stages.some((etapa) => etapa.value === valor),
  ) ?? null;

/**
 * Por qué no vale un resultado, o null si vale. Lo comprueba el servidor:
 * la pantalla solo ofrece los válidos, pero la ruta es pública para
 * cualquiera con sesión.
 */
export const errorDelResultado = (
  resultado: ResultadoDeMiDia,
  contexto: {
    embudo: EmbudoDeMiDia | null;
    etapaActual: string | null;
    exigirIngresoParaGanar: boolean;
    motivosDePerdida: string[];
    tieneTarea: boolean;
    tieneContacto: boolean;
  },
): string | null => {
  const { embudo, etapaActual } = contexto;
  switch (resultado.tipo) {
    case "quedarse":
      return null;
    case "posponer": {
      const fecha = new Date(resultado.fecha);
      if (Number.isNaN(fecha.getTime())) return "La fecha no es válida.";
      if (!contexto.tieneTarea && !contexto.tieneContacto) {
        return "Para posponerlo hace falta un contacto al que dejarle la tarea.";
      }
      return null;
    }
    case "mover": {
      if (!embudo || etapaActual === null) {
        return "Este prospecto no tiene una oportunidad que mover.";
      }
      const permitido = destinosPosibles(
        embudo,
        etapaActual,
        contexto.exigirIngresoParaGanar,
      ).some((etapa) => etapa.value === resultado.etapa);
      return permitido
        ? null
        : "Esa etapa no se puede elegir desde «Mi día».";
    }
    case "descartar": {
      if (!embudo || etapaActual === null) {
        return "Este prospecto no tiene una oportunidad que descartar.";
      }
      if (!etapaDeDescarte(embudo)) {
        return "El embudo no tiene una etapa de descarte.";
      }
      return contexto.motivosDePerdida.includes(resultado.motivo)
        ? null
        : "Elige un motivo de la lista.";
    }
  }
};

/**
 * Los próximos `cuantos` días hábiles (lunes a viernes) después de `desde`,
 * a la hora indicada en la zona del navegador.
 */
export const diasHabiles = (
  desde: Date,
  cuantos: number,
  hora = 9,
): Date[] => {
  const dias: Date[] = [];
  const cursor = new Date(desde);
  cursor.setHours(hora, 0, 0, 0);
  while (dias.length < cuantos) {
    cursor.setDate(cursor.getDate() + 1);
    const diaDeLaSemana = cursor.getDay();
    if (diaDeLaSemana !== 0 && diaDeLaSemana !== 6) {
      dias.push(new Date(cursor));
    }
  }
  return dias;
};

/**
 * Reparte elementos en fechas, `porDia` en cada una y en orden. Lo que no
 * cabe en las fechas dadas se queda en la última: mejor un día cargado que
 * una tarea sin fecha.
 */
export const repartirEnFechas = <T>(
  elementos: T[],
  fechas: string[],
  porDia: number,
): { elemento: T; fecha: string }[] => {
  if (fechas.length === 0 || porDia < 1) return [];
  return elementos.map((elemento, posicion) => ({
    elemento,
    fecha: fechas[Math.min(Math.floor(posicion / porDia), fechas.length - 1)],
  }));
};

/**
 * Si una tarea va en la cola del embudo elegido. Las tareas cuelgan del
 * contacto, no de la oportunidad, así que van con los embudos de sus
 * oportunidades abiertas. Las de un contacto sin ninguna salen en todos: si
 * no, no saldrían en ninguno.
 */
export const tareaEnElEmbudo = (
  embudosDelContacto: string[],
  embudo: string,
): boolean =>
  embudosDelContacto.length === 0 || embudosDelContacto.includes(embudo);
