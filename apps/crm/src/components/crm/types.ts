import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";

import type {
  COMPANY_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  DEAL_CREATED,
  DEAL_NOTE_CREATED,
} from "./consts";

export type SignUpData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type SalesFormData = {
  avatar?: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
};

export type Sale = {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin
   * DO NOT UPDATE this field directly, it should be updated by the backend
   */
  email: string;

  /**
   * This is used by the fake rest provider to store the password
   * DO NOT USE this field in your code besides the fake rest provider
   * @deprecated
   */
  password?: string;
} & Pick<RaRecord, "id">;

/** Tipos de dato que puede tener un campo personalizado. */
export type CustomFieldType = "text" | "number" | "date" | "list" | "checkbox";

/**
 * Definición de un campo personalizado de la organización. Vive en
 * configuration.config (una fila por organización); los valores capturados
 * van en la columna JSONB custom_fields de cada ficha, con `value` como clave.
 */
export interface CustomFieldDefinition {
  value: string;
  label: string;
  type: CustomFieldType;
  /** Solo para el tipo "list": se guarda el texto de la opción tal cual. */
  options?: string[];
}

/** Valores capturados de los campos personalizados de una ficha. */
export type CustomFieldValues = Record<string, string | number | boolean>;

export type Company = {
  name: string;
  logo: RAFile;
  sector: string;
  size: 1 | 10 | 50 | 250 | 500;
  linkedin_url: string;
  website: string;
  phone_number: string;
  address: string;
  zipcode: string;
  city: string;
  state_abbr: string;
  sales_id?: Identifier;
  created_at: string;
  description: string;
  revenue: string;
  tax_identifier: string;
  country: string;
  context_links?: string[];
  nb_contacts?: number;
  nb_deals?: number;
  /** Tickets asociados a contactos de esta empresa. */
  nb_tickets?: number;
  /** De esos, cuántos siguen sin estado "closed". */
  nb_tickets_open?: number;
  custom_fields?: CustomFieldValues;
  /** Módulo Afiliados: qué afiliado trajo a este cliente (primer toque). */
  referred_by_affiliate_id?: Identifier | null;
  /** Módulo Clientes: prospecto, cliente activo, en riesgo, perdido. */
  lifecycle_stage?: string | null;
} & Pick<RaRecord, "id">;

export type EmailAndType = {
  email: string;
  type: "Work" | "Home" | "Other";
};

export type PhoneNumberAndType = {
  number: string;
  type: "Work" | "Home" | "Other";
};

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  company_id?: Identifier | null;
  email_jsonb: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: number[];
  gender: string;
  sales_id?: Identifier;
  status: string;
  background: string;
  phone_jsonb: PhoneNumberAndType[];
  nb_tasks?: number;
  /** Tickets levantados por este contacto. */
  nb_tickets?: number;
  /** De esos, cuántos siguen sin estado "closed". */
  nb_tickets_open?: number;
  company_name?: string;
  custom_fields?: CustomFieldValues;
  lead_score?: number;
} & Pick<RaRecord, "id">;

export type ContactNote = {
  contact_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  status: string;
  attachments?: AttachmentNote[];
  /** Tipo de actividad: nota, llamada, reunión… (value de un ActivityType). */
  type?: string;
} & Pick<RaRecord, "id">;

export type Deal = {
  name: string;
  company_id: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  expected_closing_date: string;
  sales_id: Identifier;
  index: number;
  /** Embudo al que pertenece (value de un DealPipeline de la configuración). */
  pipeline: string;
  /** Motivo de pérdida, cuando está en una etapa de pérdida. */
  loss_reason?: string | null;
  custom_fields?: CustomFieldValues;
} & Pick<RaRecord, "id">;

export type DealNote = {
  deal_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];
  /** Tipo de actividad: nota, llamada, reunión… (value de un ActivityType). */
  type?: string;

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

export type TicketNote = {
  ticket_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];
  /** Tipo de actividad: nota, llamada, reunión… (value de un ActivityType). */
  type?: string;

  // This is defined for compatibility with `ContactNote`
  status?: undefined;
} & Pick<RaRecord, "id">;

/** Vista guardada de una lista: filtros y orden con nombre, por organización. */
export type SavedView = {
  resource: string;
  name: string;
  params: {
    filter?: Record<string, unknown>;
    sort?: { field: string; order: "ASC" | "DESC" };
  };
  sales_id?: Identifier;
  created_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Regla «cuando pase X, haz Y» de la organización. El motor vive en la base
 * (public.run_automations), así que se aplica venga el cambio de donde venga.
 */
export type Automation = {
  name: string;
  active: boolean;
  trigger_resource: "contacts" | "deals";
  trigger_event: "created" | "stage_changed";
  trigger_params: { stage?: string };
  action_params: {
    text?: string;
    taskType?: string;
    /** Ausente = la tarea se crea sin fecha límite. */
    dueInDays?: number;
    salesId?: Identifier;
    /** Plantilla que se envía, para la acción send_email. */
    templateId?: Identifier;
  };
  action_type: "create_task" | "assign_owner" | "send_email";
  created_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Formulario público de captación: un enlace o iframe que el cliente pega en
 * su propia web y que crea contactos o tickets solo, sin sesión de por
 * medio. `slug` es la clave pública, no un id secuencial. `type` decide qué
 * crea cada envío: "lead" da de alta un contacto (y su empresa); "ticket"
 * abre un ticket de soporte asociado al contacto que lo reporta.
 */
export type PublicForm = {
  name: string;
  slug: string;
  type: "lead" | "ticket";
  active: boolean;
  created_at?: string;
} & Pick<RaRecord, "id">;

/** Clave de API para integraciones externas (servidor a servidor). */
export type ApiKey = {
  name: string;
  key_prefix: string;
  active: boolean;
  created_at?: string;
  last_used_at?: string | null;
} & Pick<RaRecord, "id">;

/**
 * Plantilla de correo de la organización. El cuerpo es HTML con los campos
 * de fusión escritos como {{contacto.nombre}} — ver camposDeFusion.ts.
 */
export type EmailTemplate = {
  name: string;
  subject: string;
  body_html: string;
  logo_url?: string | null;
  /** Diseño: lo que necesita plantillaBase.ts para armar el correo. */
  accent_color?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  footer_text?: string | null;
  active: boolean;
  sales_id?: Identifier | null;
  created_at?: string;
  updated_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Módulo Clientes. `source` y `external_id` dicen de qué sistema vino cada
 * fila: el CRM no es dueño del catálogo ni de la facturación, solo guarda lo
 * que necesita para vender más.
 */
export type Contract = {
  company_id: Identifier;
  name: string;
  status: "active" | "paused" | "cancelled" | "expired";
  billing_period?: string | null;
  amount?: number | null;
  currency: string;
  started_on?: string | null;
  /** Próxima renovación o vencimiento: la fecha sobre la que se avisa. */
  renews_on?: string | null;
  ended_on?: string | null;
  auto_renew: boolean;
  source: string;
  external_id?: string | null;
  notes?: string | null;
  sales_id?: Identifier | null;
  created_at?: string;
  updated_at?: string;
} & Pick<RaRecord, "id">;

export type Purchase = {
  company_id: Identifier;
  contract_id?: Identifier | null;
  reference?: string | null;
  purchased_on: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "cancelled" | "refunded";
  source: string;
  external_id?: string | null;
  created_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Línea de una compra. `description` y `unit_price` son la foto del momento:
 * si el producto cambia de nombre o precio, lo vendido no se reescribe.
 */
export type PurchaseItem = {
  purchase_id: Identifier;
  description: string;
  product_ref?: string | null;
  quantity: number;
  unit_price?: number | null;
  amount?: number | null;
} & Pick<RaRecord, "id">;

/** Todo lo que ha hecho un cliente, agregado (vista customer_summary). */
export type CustomerSummary = {
  name: string;
  lifecycle_stage?: string | null;
  sales_id?: Identifier | null;
  nb_purchases: number;
  total_spent: number;
  first_purchase_on?: string | null;
  last_purchase_on?: string | null;
  nb_active_contracts: number;
  recurring_amount: number;
  next_renewal_on?: string | null;
} & Pick<RaRecord, "id">;

/** Webhook saliente de la organización. */
export type Webhook = {
  url: string;
  secret?: string;
  resources: string[];
  /**
   * Eventos concretos a los que se suscribe («contacts.created»…). Vacío =
   * todos los del recurso. Suscribirse solo a lo necesario es lo que evita
   * el bucle cuando el receptor responde escribiendo de vuelta en el CRM.
   */
  events: string[];
  active: boolean;
  created_at?: string;
} & Pick<RaRecord, "id">;

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type Task = {
  contact_id: Identifier;
  type: string;
  text: string;
  /**
   * Nulo cuando nadie puso plazo. La columna lo permite, y lo que crea el
   * servidor MCP suele llegar asi.
   */
  due_date: string | null;
  done_date?: string | null;
  /**
   * Nulo cuando la fila no tiene responsable: el disparador que lo rellenaba
   * se apoya en auth.uid(), y el puente /api consulta con la clave de
   * servicio. Ver `isAssignedToOrUnassigned`.
   */
  sales_id?: Identifier | null;
} & Pick<RaRecord, "id">;

/**
 * Ticket de soporte reportado por un cliente. Siempre va asociado a un
 * contacto y a una empresa (la del propio contacto), para que el historial
 * de soporte quede visible desde ambas fichas.
 */
export type Ticket = {
  subject: string;
  description?: string;
  status: string;
  contact_id: Identifier;
  company_id: Identifier;
  sales_id?: Identifier;
  created_at?: string;
  updated_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Afiliado: un contacto que llegó a la etapa de "afiliación completa" del
 * embudo configurado en el módulo Afiliados (crm.gestionar_modulo_afiliados).
 * `kontrolia_auth_user_id` queda nulo hasta que un administrador vincula
 * manualmente la cuenta que creó en KontrolIA Auth.
 */
export type Affiliate = {
  contact_id: Identifier;
  company_id: Identifier;
  deal_id?: Identifier | null;
  referral_code: string;
  commission_percentage?: number | null;
  active: boolean;
  kontrolia_auth_user_id?: string | null;
  sales_id?: Identifier | null;
  created_at?: string;
  updated_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Negocio referido y comisión devengada por afiliado (vista
 * crm.affiliate_commissions, solo lectura). El `id` es el del afiliado.
 */
export type AffiliateCommission = {
  contact_id: Identifier;
  company_id: Identifier;
  referral_code: string;
  commission_percentage?: number | null;
  active: boolean;
  nb_referred_companies: number;
  nb_won_deals: number;
  won_amount: number;
  commission_amount: number;
} & Pick<RaRecord, "id">;

export type ActivityCompanyCreated = {
  type: typeof COMPANY_CREATED;
  company_id: Identifier;
  company: Company;
  sales_id: Identifier;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactCreated = {
  type: typeof CONTACT_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  contact: Contact;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactNoteCreated = {
  type: typeof CONTACT_NOTE_CREATED;
  sales_id?: Identifier;
  contactNote: ContactNote;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityDealCreated = {
  type: typeof DEAL_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  deal: Deal;
  date: string;
};

export type ActivityDealNoteCreated = {
  type: typeof DEAL_NOTE_CREATED;
  sales_id?: Identifier;
  dealNote: DealNote;
  date: string;
};

export type Activity = RaRecord &
  (
    | ActivityCompanyCreated
    | ActivityContactCreated
    | ActivityContactNoteCreated
    | ActivityDealCreated
    | ActivityDealNoteCreated
  );

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;

export interface LabeledValue {
  value: string;
  label: string;
}

export type DealStage = LabeledValue;

/**
 * Un embudo de oportunidades de la organización, con sus propias etapas.
 * Una empresa real lleva varios procesos a la vez (ventas nuevas,
 * renovaciones, cobranza…) y cada uno tiene etapas distintas.
 */
export interface DealPipeline extends LabeledValue {
  stages: DealStage[];
  /** Etapas de este embudo que cuentan como parte del pipeline (ganadas). */
  pipelineStatuses: string[];
  /** Etapas que significan «perdida»: al llegar a una se pide el motivo. */
  lostStages: string[];
}

export interface NoteStatus extends LabeledValue {
  color: string;
}

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}
