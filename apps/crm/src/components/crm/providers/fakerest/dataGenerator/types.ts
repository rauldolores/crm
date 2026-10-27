import type {
  Affiliate,
  AffiliateAttribution,
  AffiliateRate,
  Automation,
  AutomationLog,
  Company,
  Contact,
  ContactNote,
  Deal,
  DealNote,
  Sale,
  PublicForm,
  Quote,
  QuoteItem,
  SavedView,
  Tag,
  Task,
  Ticket,
  TicketNote,
  SoporteTiempo,
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
  automation_log: AutomationLog[];
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
  ticket_notes: TicketNote[];
  soporte_tiempos: SoporteTiempo[];
  affiliates: Affiliate[];
  affiliate_rates: AffiliateRate[];
  affiliate_attributions: AffiliateAttribution[];
  quotes: Quote[];
  quote_items: QuoteItem[];
  configuration: Array<{ id: number; config: ConfigurationContextValue }>;
}
