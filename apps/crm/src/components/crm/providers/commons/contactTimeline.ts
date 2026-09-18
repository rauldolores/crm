import type { DataProvider, GetListParams } from "ra-core";

import type { EventoDeLaLinea } from "../../linea-de-tiempo/eventos";
import type { ContactNote, Deal, Quote, Task, Ticket } from "../../types";

/**
 * Emulación en el cliente de la vista crm.contact_timeline, para el
 * proveedor FakeRest (demo, historias y pruebas): la misma unión de notas,
 * tareas, oportunidades, tickets y cotizaciones que hace la base, con las
 * mismas columnas. En Supabase la vista lo resuelve en SQL y esto no se usa.
 */

type Con<T> = T & { id: string | number };

const filaDeNota = (n: Con<ContactNote>, companyId: number | string | null) =>
  ({
    id: `note.${n.id}`,
    kind: "note",
    type: n.type ?? "note",
    source_id: n.id,
    contact_id: n.contact_id,
    company_id: companyId,
    date: n.date,
    sales_id: n.sales_id ?? null,
    title: null,
    text: n.text,
    status: n.status ?? null,
    attachment_count: n.attachments?.length ?? 0,
    amount: null,
  }) satisfies EventoDeLaLinea;

const base = (
  id: string,
  kind: EventoDeLaLinea["kind"],
  type: string,
  source: { id: string | number },
  contactId: string | number,
  companyId: string | number | null,
  date: string,
  salesId: string | number | null | undefined,
  title: string | null,
  text: string | null,
  status: string | null,
  amount: number | null,
): EventoDeLaLinea => ({
  id,
  kind,
  type,
  source_id: source.id,
  contact_id: contactId,
  company_id: companyId,
  date,
  sales_id: salesId ?? null,
  title,
  text,
  status,
  attachment_count: 0,
  amount,
});

const todos = { page: 1, perPage: 100000 };

/** Una colección que la base de prueba no tiene cuenta como vacía. */
const listar = async <T>(
  dataProvider: DataProvider,
  recurso: string,
  filter: Record<string, unknown>,
  sort: { field: string; order: "ASC" | "DESC" },
): Promise<T[]> => {
  try {
    const { data } = await dataProvider.getList<T & { id: string | number }>(
      recurso,
      { filter, pagination: todos, sort },
    );
    return data;
  } catch {
    return [];
  }
};

export async function getContactTimeline(
  dataProvider: DataProvider,
  params: GetListParams,
): Promise<{ data: EventoDeLaLinea[]; total: number }> {
  const { filter = {}, pagination, sort } = params;
  const contactId = filter.contact_id;
  const { data: contactos } = await dataProvider.getList("contacts", {
    filter: { id: contactId },
    pagination: todos,
    sort: { field: "id", order: "ASC" },
  });
  const contacto = contactos[0];
  const companyId = contacto?.company_id ?? null;

  const porId = { field: "id", order: "ASC" } as const;
  const [notas, tareas, oportunidades, tickets, cotizaciones] =
    await Promise.all([
      listar<Con<ContactNote>>(
        dataProvider,
        "contact_notes",
        { contact_id: contactId },
        { field: "date", order: "DESC" },
      ),
      listar<Con<Task>>(
        dataProvider,
        "tasks",
        { contact_id: contactId },
        porId,
      ),
      listar<Con<Deal>>(dataProvider, "deals", {}, porId),
      listar<Con<Ticket>>(
        dataProvider,
        "tickets",
        { contact_id: contactId },
        porId,
      ),
      listar<Con<Quote>>(
        dataProvider,
        "quotes",
        { contact_id: contactId },
        porId,
      ),
    ]);
  const cambiosDeEtapa = await listar<
    Con<{
      deal_id: string | number;
      sales_id?: string | number | null;
      field: string;
      old_value?: string | null;
      new_value?: string | null;
      created_at: string;
    }>
  >(dataProvider, "deal_events", { field: "stage" }, porId);

  const eventos: EventoDeLaLinea[] = [
    ...notas.map((n) => filaDeNota(n, companyId)),
    ...tareas.flatMap((t) => {
      const filas: EventoDeLaLinea[] = [];
      if (t.due_date) {
        filas.push(
          base(
            `task.${t.id}`,
            "task",
            "task",
            t,
            contactId,
            companyId,
            t.due_date,
            t.sales_id,
            t.type,
            t.text,
            null,
            null,
          ),
        );
      }
      if (t.done_date) {
        filas.push(
          base(
            `task_done.${t.id}`,
            "task",
            "task_done",
            t,
            contactId,
            companyId,
            t.done_date,
            t.sales_id,
            t.type,
            t.text,
            null,
            null,
          ),
        );
      }
      return filas;
    }),
    ...oportunidades
      .filter((d) => (d.contact_ids ?? []).some((c) => c == contactId))
      .flatMap((d) => {
        const filas: EventoDeLaLinea[] = [
          base(
            `deal.${d.id}`,
            "deal",
            "deal",
            d,
            contactId,
            d.company_id,
            d.created_at,
            d.sales_id,
            d.name,
            d.description ?? null,
            d.stage,
            d.amount ?? null,
          ),
        ];
        for (const e of cambiosDeEtapa.filter((e) => e.deal_id == d.id)) {
          filas.push(
            base(
              `deal_stage.${e.id}`,
              "deal",
              "deal_stage",
              e,
              contactId,
              d.company_id,
              e.created_at,
              e.sales_id,
              d.name,
              e.new_value ?? null,
              e.old_value ?? null,
              d.amount ?? null,
            ),
          );
        }
        if (d.archived_at) {
          filas.push(
            base(
              `deal_archived.${d.id}`,
              "deal",
              "deal_archived",
              d,
              contactId,
              d.company_id,
              d.archived_at,
              d.sales_id,
              d.name,
              d.loss_reason ?? null,
              d.stage,
              d.amount ?? null,
            ),
          );
        }
        return filas;
      }),
    ...tickets.flatMap((tk) => {
      const filas: EventoDeLaLinea[] = [
        base(
          `ticket.${tk.id}`,
          "ticket",
          "ticket",
          tk,
          contactId,
          tk.company_id,
          tk.created_at ?? new Date().toISOString(),
          tk.sales_id,
          tk.subject,
          tk.description ?? null,
          tk.status,
          null,
        ),
      ];
      if (tk.closed_at) {
        filas.push(
          base(
            `ticket_closed.${tk.id}`,
            "ticket",
            "ticket_closed",
            tk,
            contactId,
            tk.company_id,
            tk.closed_at,
            tk.sales_id,
            tk.subject,
            tk.resolution ?? null,
            tk.status,
            null,
          ),
        );
      }
      return filas;
    }),
    ...cotizaciones.flatMap((q) => {
      const filas: EventoDeLaLinea[] = [];
      if (q.sent_at) {
        filas.push(
          base(
            `quote.${q.id}`,
            "quote",
            "quote",
            q,
            contactId,
            q.company_id,
            q.sent_at,
            q.sales_id,
            q.title || q.number,
            q.number,
            q.status,
            q.total,
          ),
        );
      }
      if (q.accepted_at || q.rejected_at) {
        filas.push(
          base(
            `quote_decided.${q.id}`,
            "quote",
            q.accepted_at ? "quote_accepted" : "quote_rejected",
            q,
            contactId,
            q.company_id,
            (q.accepted_at ?? q.rejected_at) as string,
            q.sales_id,
            q.title || q.number,
            q.accepted_by_name ?? q.rejection_reason ?? null,
            q.status,
            q.total,
          ),
        );
      }
      return filas;
    }),
  ];

  const busqueda =
    typeof filter.q === "string" ? filter.q.trim().toLowerCase() : "";
  const coincide = (valor: string | null | undefined) =>
    !!valor && valor.toLowerCase().includes(busqueda);
  const filtrados = eventos.filter(
    (e) =>
      (filter.kind == null || e.kind === filter.kind) &&
      (filter.type == null || e.type === filter.type) &&
      (busqueda === "" || coincide(e.title) || coincide(e.text)),
  );
  const orden = sort?.order === "ASC" ? 1 : -1;
  filtrados.sort((a, b) => orden * a.date.localeCompare(b.date));

  const { page, perPage } = pagination ?? { page: 1, perPage: 25 };
  const inicio = (page - 1) * perPage;
  return {
    data: filtrados.slice(inicio, inicio + perPage),
    total: filtrados.length,
  };
}
