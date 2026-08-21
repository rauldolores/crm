import type {
  Automation,
  Company,
  Contact,
  ContactNote,
  Deal,
  DealNote,
  Sale,
  PublicForm,
  SavedView,
  Tag,
  Task,
  Ticket,
  Webhook,
} from "../../../types";
import type { ConfigurationContextValue } from "../../../root/ConfigurationContext";

export interface Db {
  companies: Company[];
  contacts: Contact[];
  contact_notes: ContactNote[];
  deals: Deal[];
  deal_notes: DealNote[];
  sales: Sale[];
  automations: Automation[];
  public_forms: PublicForm[];
  public_form_submissions: {
    id: number;
    public_form_id: number;
    created_at: string;
  }[];
  saved_views: SavedView[];
  webhooks: Webhook[];
  tags: Tag[];
  tasks: Task[];
  tickets: Ticket[];
  configuration: Array<{ id: number; config: ConfigurationContextValue }>;
}
