import type { Ticket } from "../types";
import { TicketList } from "./TicketList";
import { TicketCreate } from "./TicketCreate";
import { TicketEdit } from "./TicketEdit";
import { TicketShow } from "./TicketShow";

export default {
  list: TicketList,
  create: TicketCreate,
  edit: TicketEdit,
  show: TicketShow,
  recordRepresentation: (record: Ticket) => record?.subject,
};
