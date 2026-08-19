import type {
  Automation,
  Company,
  Contact,
  ContactNote,
  Deal,
  DealNote,
  Sale,
  SavedView,
  Tag,
  Task,
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
  saved_views: SavedView[];
  webhooks: Webhook[];
  tags: Tag[];
  tasks: Task[];
  configuration: Array<{ id: number; config: ConfigurationContextValue }>;
}
