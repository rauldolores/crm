import type { Identifier } from "ra-core";

/**
 * Las vistas de la bandeja y el filtro de cada una. «Pendientes» es la
 * lista de trabajo: lo que espera respuesta del equipo, sin respuestas
 * automáticas.
 */

export type Vista =
  | "pending"
  | "mine"
  | "unassigned"
  | "no_contact"
  | "answered"
  | "closed";

export const VISTAS: Vista[] = [
  "pending",
  "mine",
  "unassigned",
  "no_contact",
  "answered",
  "closed",
];

export const esVista = (valor: string | null): valor is Vista =>
  VISTAS.includes(valor as Vista);

export const filtroDeVista = (
  vista: Vista,
  comercialId: Identifier | undefined,
): Record<string, unknown> => {
  switch (vista) {
    case "pending":
      return { status: "pending" };
    case "mine":
      return { status: "pending", sales_id: comercialId ?? -1 };
    case "unassigned":
      return { status: "pending", "sales_id@is": null };
    case "no_contact":
      return { "status@neq": "closed", "contact_id@is": null };
    case "answered":
      return { status: "answered" };
    case "closed":
      return { status: "closed" };
  }
};
