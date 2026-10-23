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
  /** Régimen fiscal y uso de CFDI del SAT, para facturar (conectores). */
  tax_regime?: string | null;
  cfdi_use?: string | null;
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
  /** Etiquetas (ids de tags), como en contactos. */
  tags?: number[] | null;
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
  /** Archivado: fuera de listas y selectores, con su historial (null = activo). */
  archived_at?: string | null;
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
  /** Última nota, tarea hecha, oportunidad tocada o ticket (contacts_summary). */
  last_activity?: string;
  /** true si la temperatura la puso el puntaje y no una persona. */
  status_is_automatic?: boolean;
  /** Cuándo alguien fijó el estado a mano; manda 14 días. */
  status_set_at?: string;
  /** De dónde vino (kontrolia_auth…) y su id allá; null = alta a mano. */
  source?: string | null;
  external_id?: string | null;
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
  /** Nulo cuando la oportunidad se creó sin importe (API, MCP, formulario público). */
  amount: number | null;
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
  /** Etiquetas (ids de tags), como en contactos. */
  tags?: number[] | null;
  /**
   * Oportunidad de renovación (la abre sola la base): de qué contrato y qué
   * fecha de renovación. Nulos en las demás.
   */
  contract_id?: Identifier | null;
  renewal_for?: string | null;
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
  /**
   * Condición en español que el modelo de decisión juzga contra el texto de la
   * fila («el cliente amenaza con irse»). Vacía = regla de siempre. Con
   * condición la regla actúa con hasta un minuto de retraso, porque el
   * disparador encola y la aplicación drena. Ver `admiteCondicion`.
   */
  condition_text?: string | null;
  trigger_resource:
    | "contacts"
    | "deals"
    | "contracts"
    | "quotes"
    | "tickets"
    | "email_outbox";
  /**
   * renewal_due (contratos), unanswered (cotizaciones), los de tickets por
   * horas (unanswered, unassigned, overdue) y stalled (oportunidades que
   * llevan días en una etapa) los evalúa el cron horario, no un disparador.
   */
  trigger_event:
    | "created"
    | "stage_changed"
    | "stalled"
    | "renewal_due"
    | "unanswered"
    | "unassigned"
    | "overdue"
    | "closed"
    | "sent";
  trigger_params: {
    stage?: string;
    /**
     * Embudo de la etapa (deals:stalled). Hace falta porque los embudos
     * comparten los nombres internos de etapa: sin él, la regla saltaría en
     * todos los que tengan una etapa con ese nombre.
     */
    pipeline?: string;
    /** Días en la misma etapa sin moverse (deals:stalled). */
    daysInStage?: number;
    daysBefore?: number;
    daysAfter?: number;
    hoursAfter?: number;
    /** Solo tickets creados con esta prioridad (tickets:created). */
    priority?: string;
    /**
     * Solo oportunidades cuyo contacto tenga (o no) un teléfono móvil.
     * Ausente = la regla no mira el teléfono.
     */
    contacto?: "movil" | "sin_movil";
    /**
     * Solo cuando salga el correo de esta plantilla (email_outbox:sent).
     * Ausente = cualquier correo.
     */
    templateId?: Identifier;
  };
  action_params: {
    text?: string;
    taskType?: string;
    /** Ausente = la tarea se crea sin fecha límite. */
    dueInDays?: number;
    salesId?: Identifier;
    /** Plantilla que se envía, para la acción send_email. */
    templateId?: Identifier;
    /**
     * Etapa de destino, para la acción move_stage: siempre del mismo embudo
     * que la de la regla (deals:stalled, el único disparador que la admite).
     */
    stage?: string;
  };
  action_type: "create_task" | "assign_owner" | "send_email" | "move_stage";
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
  /** Integración con KontrolIA Auth: de qué producto es y qué plan tiene. */
  application_slug?: string | null;
  plan_slug?: string | null;
  plan_name?: string | null;
  /** manual = por contrato; stripe = con tarjeta. */
  provider?: string | null;
  addons?: ContractAddon[] | null;
  /** Módulo de facturación: si el contrato se factura solo. */
  billing_enabled?: boolean;
  /** Venció sin pago y KontrolIA Auth le da días de gracia hasta grace_until. */
  in_grace?: boolean;
  grace_until?: string | null;
} & Pick<RaRecord, "id">;

/** Extra de un contrato tal como lo manda KontrolIA Auth (importes en centavos). */
export type ContractAddon = {
  addon_id?: string | null;
  slug?: string | null;
  name?: string | null;
  /** Incluido en el plan (sin costo aparte). */
  included?: boolean | null;
  price_amount?: number | null;
  currency?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  contract_amount?: number | null;
  contract_currency?: string | null;
};

/** Historial del contrato: lo escribe la integración, nadie a mano. */
export type ContractEvent = {
  contract_id?: Identifier | null;
  company_id?: Identifier | null;
  type: string;
  occurred_at: string;
  title: string;
  detail?: Record<string, unknown>;
  amount?: number | null;
  currency?: string | null;
  source: string;
  external_id: string;
  created_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Consumo de un cliente de KONTROLIA en un mes, por producto y límite (lo
 * escribe la integración con KontrolIA Auth). `included` null = sin límite;
 * `overage_price_amount` en pesos.
 */
export type CustomerUsage = {
  company_id: Identifier;
  application_slug: string;
  limit_key: string;
  description?: string | null;
  /** Primer día del periodo (AAAA-MM-01 en los meses; 1970-01-01 en «total»). */
  period_start: string;
  /** month, year, day o lifetime. */
  period?: string | null;
  /** El periodo que corre ahora (el mes anterior va en false). */
  is_current?: boolean | null;
  used: number;
  included?: number | null;
  overage_price_amount?: number | null;
  currency?: string | null;
  updated_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Marca que pone crm.revisar_clientes_en_riesgo() cuando nadie de la empresa
 * entra en N días: la empresa pasó sola a «en riesgo».
 */
export type CustomerRisk = {
  company_id: Identifier;
  /** Último acceso cuando se marcó; null = nadie había entrado nunca. */
  last_seen_at?: string | null;
  inactivity_days: number;
  flagged_at: string;
  task_id?: Identifier | null;
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
  /** Solo los contratos con periodicidad: lo que entra cada periodo. */
  nb_recurring_contracts: number;
  recurring_amount: number;
  /** Contratos de pago único (o guardados sin periodicidad). */
  nb_one_time_contracts: number;
  one_time_amount: number;
  /** Oportunidades ganadas de esta empresa, según las etapas de su embudo. */
  nb_won_deals: number;
  won_amount: number;
  next_renewal_on?: string | null;
  /** Soporte: tickets abiertos y vencidos; en riesgo = 3+ abiertos o alguno vencido. */
  open_tickets: number;
  overdue_tickets: number;
  at_risk: boolean;
  /** De dónde viene la empresa (kontrolia_auth = se sincroniza sola). */
  source?: string | null;
  external_id?: string | null;
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
  /** Responsable; por defecto quien lo creó. */
  sales_id?: Identifier | null;
  created_at?: string;
  updated_at?: string;
  /** Valor de configuration.ticketPriorities. */
  priority: string;
  /** Valor de configuration.ticketCategories; nulo si no se clasificó. */
  category?: string | null;
  /** manual | web_form | mcp | api | voice_agent | email */
  source?: string;
  /** Sellado al pasar a «closed»; nulo al reabrir. */
  closed_at?: string | null;
  /** Motivo de cierre (ticketResolutions); nulo mientras está abierto. */
  resolution?: string | null;
  /** Último cambio o nota; es lo que ordena la lista. */
  last_activity_at?: string;
  /** Quién hizo la última modificación; lo sella el puente. */
  updated_by?: Identifier | null;
  /** SLA (Ajustes → Tickets): plazo de primera respuesta y de resolución. */
  first_response_due_at?: string | null;
  due_at?: string | null;
  /** Primera nota de una persona en el ticket; lo sella la base. */
  first_response_at?: string | null;
  /** Oportunidad y contrato relacionados, si los hay. */
  deal_id?: Identifier | null;
  contract_id?: Identifier | null;
  /** Encuesta de satisfacción: enlace público y respuesta (1 a 5). */
  survey_token?: string;
  satisfaction_rating?: number | null;
  satisfaction_comment?: string | null;
  satisfaction_at?: string | null;
  /**
   * De qué habla el comentario y si el cliente sigue con algo sin resolver.
   * Los pone el modelo de decisión al responder la encuesta; nulos cuando no
   * hubo comentario o no se pudo clasificar. Ver `temaDeEncuesta.ts`.
   */
  satisfaction_topic?: string | null;
  satisfaction_followup?: boolean | null;
} & Pick<RaRecord, "id">;

/** Un cambio en un ticket: quién cambió qué y cuándo (crm.ticket_events). */
export type TicketEvent = {
  ticket_id: Identifier;
  /** Quién; nulo cuando lo hizo un sistema (formulario, API, agente). */
  sales_id?: Identifier | null;
  /** created | status | priority | category | sales_id */
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
} & Pick<RaRecord, "id">;

/**
 * Tiempo de soporte dedicado a un ticket (crm.soporte_tiempos). Solo de
 * alta: un error se corrige con otro registro en contra (`corrige_a`).
 */
export type SoporteTiempo = {
  ticket_id: Identifier;
  company_id: Identifier;
  contract_id?: Identifier | null;
  /** AAAA-MM-DD, en hora de México. */
  fecha_atencion: string;
  atendio?: Identifier | null;
  minutos: number;
  consume: boolean;
  motivo_no_consume?: string | null;
  descripcion_cliente: string;
  nota_interna?: string | null;
  autorizado_por?: string | null;
  autorizado_en?: string | null;
  corrige_a?: Identifier | null;
  motivo_correccion?: string | null;
  created_at: string;
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
  /** comisionista: Kontrolia cobra y paga comisión. revendedor: compra con descuento. */
  mode?: AffiliateMode;
  /** Meses que cada cliente genera comisión. null = de por vida. */
  commission_months?: number | null;
  kontrolia_auth_user_id?: string | null;
  sales_id?: Identifier | null;
  created_at?: string;
  updated_at?: string;
} & Pick<RaRecord, "id">;

export type AffiliateMode = "comisionista" | "revendedor";

/** Soluciones del ecosistema con tasa propia (crm.affiliate_rates). */
export type AffiliateApplication =
  | "facturacion"
  | "crm"
  | "nodia-agents"
  | "aduaniax"
  | "diagnostico";

/** Excepción a la tasa general de un afiliado para una solución. */
export type AffiliateRate = {
  affiliate_id: Identifier;
  application_slug: AffiliateApplication;
  percentage: number;
  created_at?: string;
} & Pick<RaRecord, "id">;

/**
 * Una vez que una empresa quedó (o intentó quedar) ligada a un afiliado
 * (crm.affiliate_attributions, solo lectura: lo escribe la base).
 */
export type AffiliateAttribution = {
  company_id: Identifier;
  affiliate_id?: Identifier | null;
  referral_code?: string | null;
  source: "enlace" | "manual" | "importacion" | "fusion";
  status: "vigente" | "reemplazada" | "retirada" | "rechazada";
  origin_application?: string | null;
  actor_sales_id?: Identifier | null;
  reason?: string | null;
  created_at: string;
  ended_at?: string | null;
  ended_by_sales_id?: Identifier | null;
  end_reason?: string | null;
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

export type DealStage = LabeledValue & {
  /**
   * Probabilidad de cierre (0-100) de las oportunidades en esta etapa. Sin
   * valor, el CRM la estima por la posición de la etapa (ver
   * deals/probabilidad.ts).
   */
  probability?: number | null;
};

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

/**
 * Cotización: el documento comercial que sale de una oportunidad. Las líneas
 * llevan su propio precio e IVA; los totales los calcula la base con cada
 * cambio de líneas, así que aquí son de solo lectura.
 */
export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired";

export type QuoteContractPeriod = "monthly" | "quarterly" | "yearly";

export type Quote = {
  organization_id?: string;
  number: string;
  deal_id: Identifier | null;
  company_id: Identifier | null;
  contact_id: Identifier | null;
  title: string;
  status: QuoteStatus;
  currency: string;
  valid_until: string | null;
  notes: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  /** Con periodicidad, al aceptarse nace un contrato; sin ella, una compra. */
  contract_period: QuoteContractPeriod | null;
  public_token: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  accepted_by_name: string | null;
  accepted_by_email: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  sales_id: Identifier | null;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

/** Un producto del catálogo conectado (Shopify…), espejo de crm.products. */
export type Product = {
  organization_id?: string;
  provider: string;
  external_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit_price: number;
  currency: string;
  active: boolean;
  image_url: string | null;
  synced_at: string;
} & Pick<RaRecord, "id">;

export type InvoiceStatus = "stamped" | "draft" | "cancelled" | "error";

export type InvoiceOrigin =
  | "quote"
  | "contract"
  | "card"
  | "credits"
  | "manual"
  | "overage";

export type InvoiceBillingStatus =
  | "pending_review"
  | "missing_data"
  | "queued"
  | "stamping"
  | "stamped"
  | "error"
  | "cancelled"
  | "discarded";

export type InvoicePaymentStatus = "unpaid" | "partial" | "paid";

/**
 * Una factura emitida por el proveedor conectado (Faqturia…), o en la
 * bandeja «Por facturar» antes de timbrarse (sin id externo todavía).
 */
export type Invoice = {
  organization_id?: string;
  provider: string;
  quote_id: Identifier | null;
  company_id: Identifier | null;
  external_id: string | null;
  uuid: string | null;
  serie: string | null;
  folio: string | null;
  status: InvoiceStatus;
  total: number;
  currency: string;
  issued_at: string | null;
  error: string | null;
  created_at: string;
  updated_at?: string;
  contract_id?: Identifier | null;
  period_start?: string | null;
  period_end?: string | null;
  origin?: InvoiceOrigin;
  billing_status?: InvoiceBillingStatus | null;
  payment_method?: "PPD" | "PUE" | null;
  payment_form?: string | null;
  payment_status?: InvoicePaymentStatus | null;
  paid_amount?: number | string | null;
  paid_at?: string | null;
  due_on?: string | null;
  subtotal?: number | string | null;
  tax?: number | string | null;
  source_ref?: string | null;
  /** Lo que falta para timbrar: rfc, tax_regime, cfdi_use, zipcode… */
  problems?: string[] | null;
  approved_at?: string | null;
  discard_reason?: string | null;
  /** Referencia del pago registrado a mano. */
  payment_reference?: string | null;
  /** Texto que se imprime en el CFDI (el consumo de un excedente). */
  notes?: string | null;
  /** Renovar el acceso al pagar (contratos de KontrolIA Auth por transferencia). */
  access_status?: InvoiceAccessStatus | null;
  access_renewed_until?: string | null;
  access_error?: string | null;
  access_attempts?: number | null;
  access_updated_at?: string | null;
  access_next_attempt_at?: string | null;
} & Pick<RaRecord, "id">;

export type InvoiceAccessStatus =
  | "not_applicable"
  | "pending"
  | "renewed"
  | "error"
  | "skipped";

/** Renglón de una factura que armó el CRM (precio antes de IVA). */
export type InvoiceItem = {
  invoice_id: Identifier;
  position: number;
  description: string;
  product_ref: string | null;
  quantity: number | string;
  unit_price: number | string;
  amount: number | string;
  clave_prod_serv: string;
  clave_unidad: string;
  tax_rate: number | string;
} & Pick<RaRecord, "id">;

/** Ajustes de facturación de un producto ('*' = los generales). */
export type BillingSettings = {
  product_key: string;
  clave_prod_serv: string;
  clave_unidad: string;
  concept_template: string;
  tax_rate: number;
  prices_include_tax: boolean;
  metodo_pago_transferencia: "PPD" | "PUE";
  forma_pago_transferencia: string;
  forma_pago_tarjeta: string;
  days_before: number;
  mode: "review" | "auto";
  active: boolean;
};

export type QuoteItem = {
  quote_id: Identifier;
  position: number;
  description: string;
  product_ref: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  tax_rate: number;
  /** Calculado por la base: cantidad × precio × (1 − descuento). */
  amount: number;
} & Pick<RaRecord, "id">;

/** Quién emite las cotizaciones: lo que va en la cabecera del documento. */
export interface QuoteIssuer {
  name: string;
  tax_id?: string;
  address?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
}

/** Una plantilla de cotización: líneas y condiciones que se rellenan solas. */
export interface QuoteTemplateItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
  tax_rate?: number;
}

export interface QuoteTemplate {
  key: string;
  name: string;
  title: string;
  notes?: string;
  contract_period?: QuoteContractPeriod | null;
  valid_days?: number;
  items: QuoteTemplateItem[];
}

/** Una conversación de la bandeja compartida (por ahora, solo correo). */
export type Conversation = {
  channel: "email";
  contact_id: Identifier | null;
  /** La dirección del otro lado. */
  counterpart: string;
  counterpart_name: string | null;
  subject: string | null;
  status: "pending" | "answered" | "closed";
  unread: boolean;
  /** Quién la atiende; nulo = pila compartida. */
  sales_id: Identifier | null;
  /** Solo trajo respuestas automáticas (fuera de oficina, rebotes). */
  automatic: boolean;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
} & Pick<RaRecord, "id">;

export type ConversationMessage = {
  conversation_id: Identifier;
  direction: "in" | "out";
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  subject: string | null;
  body_text: string | null;
  sales_id: Identifier | null;
  automatic: boolean;
  attachments: {
    filename: string;
    content_type: string | null;
    size: number | null;
  }[];
  sent_at: string;
} & Pick<RaRecord, "id">;
