import { estaAbierta } from "../deals/probabilidad";
import type {
  NotaDeInforme,
  OportunidadDeInforme,
  TareaDeInforme,
} from "../providers/commons/datosDeInformes";
import type { DealPipeline, Sale, Ticket } from "../types";

/**
 * Desempeño de cada persona del equipo en un embudo y un periodo: qué tiene
 * en las manos ahora (oportunidades abiertas, tareas vencidas, tickets
 * abiertos) y qué hizo en el periodo (oportunidades nuevas, ganadas,
 * perdidas, tareas completadas, notas registradas).
 *
 * «Ganadas/perdidas en el periodo» sigue el mismo criterio que el resto de
 * la página: oportunidades creadas en el periodo que hoy están en una etapa
 * de cierre.
 */
export interface DesempenoDePersona {
  /** String del id de `sales`, o "" para lo que no tiene responsable. */
  id: string;
  nombre: string;
  abiertas: number;
  importeAbierto: number;
  nuevas: number;
  ganadas: number;
  importeGanado: number;
  perdidas: number;
  /** % ganadas sobre cerradas; null sin ninguna cerrada. */
  conversion: number | null;
  tareasCompletadas: number;
  tareasVencidas: number;
  notas: number;
  ticketsAbiertos: number;
  ticketsCerrados: number;
}

interface Entrada {
  comerciales: Sale[];
  oportunidades: OportunidadDeInforme[];
  tareas: TareaDeInforme[];
  notas: NotaDeInforme[];
  tickets: Ticket[];
  embudo: Pick<DealPipeline, "value" | "pipelineStatuses" | "lostStages">;
  desde: Date | null;
  sinResponsable: string;
  ahora?: Date;
}

const clave = (salesId: unknown) => (salesId == null ? "" : String(salesId));

export const desempenoDelEquipo = ({
  comerciales,
  oportunidades,
  tareas,
  notas,
  tickets,
  embudo,
  desde,
  sinResponsable,
  ahora = new Date(),
}: Entrada): DesempenoDePersona[] => {
  const enPeriodo = (fecha?: string | null) =>
    !!fecha && (!desde || new Date(fecha) >= desde);

  const filas = new Map<string, DesempenoDePersona>();
  const fila = (id: string) => {
    let existente = filas.get(id);
    if (!existente) {
      existente = {
        id,
        nombre: id === "" ? sinResponsable : id,
        abiertas: 0,
        importeAbierto: 0,
        nuevas: 0,
        ganadas: 0,
        importeGanado: 0,
        perdidas: 0,
        conversion: null,
        tareasCompletadas: 0,
        tareasVencidas: 0,
        notas: 0,
        ticketsAbiertos: 0,
        ticketsCerrados: 0,
      };
      filas.set(id, existente);
    }
    return existente;
  };

  // Quien está activo aparece aunque no tenga nada: un cero también es un
  // dato. Quien está desactivado, solo si algo sigue a su nombre.
  for (const comercial of comerciales) {
    if (!comercial.disabled) fila(clave(comercial.id));
  }

  for (const oportunidad of oportunidades) {
    if ((oportunidad.pipeline ?? "ventas") !== embudo.value) continue;
    const persona = fila(clave(oportunidad.sales_id));
    if (estaAbierta(oportunidad, embudo)) {
      persona.abiertas += 1;
      persona.importeAbierto += oportunidad.amount ?? 0;
    }
    if (!enPeriodo(oportunidad.created_at)) continue;
    persona.nuevas += 1;
    if ((embudo.pipelineStatuses ?? []).includes(oportunidad.stage)) {
      persona.ganadas += 1;
      persona.importeGanado += oportunidad.amount ?? 0;
    } else if ((embudo.lostStages ?? []).includes(oportunidad.stage)) {
      persona.perdidas += 1;
    }
  }

  for (const tarea of tareas) {
    if (tarea.done_date) {
      if (enPeriodo(tarea.done_date))
        fila(clave(tarea.sales_id)).tareasCompletadas += 1;
    } else if (tarea.due_date && new Date(tarea.due_date) < ahora) {
      fila(clave(tarea.sales_id)).tareasVencidas += 1;
    }
  }

  for (const nota of notas) {
    if (enPeriodo(nota.date)) fila(clave(nota.sales_id)).notas += 1;
  }

  for (const ticket of tickets) {
    if (ticket.status !== "closed") {
      fila(clave(ticket.sales_id)).ticketsAbiertos += 1;
    } else if (enPeriodo(ticket.closed_at)) {
      fila(clave(ticket.sales_id)).ticketsCerrados += 1;
    }
  }

  const nombres = new Map(
    comerciales.map((comercial) => [
      clave(comercial.id),
      `${comercial.first_name} ${comercial.last_name}`.trim(),
    ]),
  );

  return [...filas.values()]
    .map((persona) => {
      const cerradas = persona.ganadas + persona.perdidas;
      return {
        ...persona,
        nombre: nombres.get(persona.id) || persona.nombre,
        conversion: cerradas > 0 ? (persona.ganadas / cerradas) * 100 : null,
      };
    })
    .filter((persona) => persona.id !== "" || tieneAlgo(persona))
    .sort(
      (a, b) =>
        // «Sin responsable» al final; el resto, de más a menos vendido.
        Number(a.id === "") - Number(b.id === "") ||
        b.importeGanado - a.importeGanado ||
        b.abiertas - a.abiertas ||
        a.nombre.localeCompare(b.nombre),
    );
};

const tieneAlgo = (persona: DesempenoDePersona) =>
  persona.abiertas +
    persona.nuevas +
    persona.tareasCompletadas +
    persona.tareasVencidas +
    persona.notas +
    persona.ticketsAbiertos +
    persona.ticketsCerrados >
  0;
