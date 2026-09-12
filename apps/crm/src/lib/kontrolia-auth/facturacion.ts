/**
 * Planes, suscripción y cobros de la organización, contra KontrolIA Auth.
 *
 * Réplica exacta —misma firma, mismos endpoints, mismos tipos— de los
 * métodos `getPlans`, `getEntitlements`, `getPlanClaims`, `startCheckout` y
 * `openBillingPortal` que @kontrolia/auth añade a partir de la 2.3. La
 * versión publicada hoy (2.2.0) no los trae aún; en cuanto se publique, este
 * archivo se reduce a reexportar los del cliente (`getKontroliaClient()`).
 *
 * Nada de aquí procesa pagos ni ve tarjetas: la app solo navega a las URLs
 * hospedadas que devuelve KontrolIA Auth (Stripe Checkout y su portal).
 */
import { decodeAccessToken } from "@kontrolia/auth";

import { env } from "@/lib/env";
import { getKontroliaAccessToken } from "./client";

export type KontroliaBillingInterval = "month" | "year" | "one_time";
export type KontroliaLimitPeriod = "day" | "month" | "year" | "lifetime";
export type KontroliaSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export interface KontroliaPlanLimit {
  key: string;
  /** null = ilimitado. */
  limit: number | null;
  period: KontroliaLimitPeriod;
  description: string | null;
}

export interface KontroliaPlan {
  id: string;
  applicationId: string;
  slug: string;
  name: string;
  description: string | null;
  /** En centavos. */
  priceAmount: number;
  currency: string;
  billingInterval: KontroliaBillingInterval;
  trialDays: number;
  features: string[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  permissions: string[];
  limits: KontroliaPlanLimit[];
}

export interface KontroliaSubscription {
  id: string;
  organizationId: string;
  applicationId: string;
  planId: string;
  planSlug: string;
  planName: string;
  status: KontroliaSubscriptionStatus;
  /** Si hoy da acceso (vigente, o en periodo de gracia tras un cobro fallido). */
  isLive: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: "manual" | "stripe";
}

export interface KontroliaUsage extends KontroliaPlanLimit {
  used: number;
  /** null cuando el límite es ilimitado. */
  remaining: number | null;
  periodStart: string;
}

export type KontroliaAccess =
  | "ok"
  | "no_subscription"
  | "past_due"
  | "canceled"
  | "expired";

export interface KontroliaEntitlements {
  applicationId: string;
  applicationSlug: string;
  /** false = esta aplicación no exige plan: ignorar todo lo demás. */
  plansRequired: boolean;
  subscription: KontroliaSubscription | null;
  access: KontroliaAccess;
  permissions: string[];
  usage: KontroliaUsage[];
}

/** Error de auth-server con su código HTTP, para distinguir 403/400/409/503. */
export class ErrorDeFacturacion extends Error {
  constructor(
    mensaje: string,
    public readonly status: number,
  ) {
    super(mensaje);
    this.name = "ErrorDeFacturacion";
  }
}

/** true si la instalación puede hablar con auth-server para todo esto. */
export const facturacionDisponible = (): boolean =>
  Boolean(env.kontroliaAuthServerUrl && env.kontroliaAuthUrl);

const baseDeAuthServer = () => env.kontroliaAuthServerUrl.replace(/\/$/, "");

async function pedirAAuthServer<T>(
  metodo: string,
  ruta: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  if (!facturacionDisponible()) {
    throw new ErrorDeFacturacion(
      `${metodo} requiere NEXT_PUBLIC_KONTROLIA_AUTH_SERVER_URL.`,
      0,
    );
  }
  const token = await getKontroliaAccessToken();
  if (!token) {
    throw new ErrorDeFacturacion(`${metodo} requiere una sesión iniciada.`, 401);
  }
  const respuesta = await fetch(`${baseDeAuthServer()}${ruta}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const cuerpo = (await respuesta.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!respuesta.ok) {
    throw new ErrorDeFacturacion(
      cuerpo.error ?? `${metodo} falló (${respuesta.status}).`,
      respuesta.status,
    );
  }
  return cuerpo;
}

/** Los planes activos de la aplicación: lo que muestra la pantalla de precios. */
export async function getPlans(
  applicationSlug: string,
): Promise<KontroliaPlan[]> {
  const cuerpo = await pedirAAuthServer<{ plans?: KontroliaPlan[] }>(
    "getPlans",
    `/api/plans?application=${encodeURIComponent(applicationSlug)}`,
  );
  return cuerpo.plans ?? [];
}

/**
 * A qué tiene derecho la organización activa en esta aplicación ahora mismo:
 * plan, estado, por qué está bloqueado el acceso (si lo está), permisos
 * efectivos y cada límite con su consumo.
 */
export async function getEntitlements(
  applicationSlug: string,
): Promise<KontroliaEntitlements> {
  const cuerpo = await pedirAAuthServer<{
    entitlements: KontroliaEntitlements;
  }>(
    "getEntitlements",
    `/api/entitlements?application=${encodeURIComponent(applicationSlug)}`,
  );
  return cuerpo.entitlements;
}

/**
 * `{ "<slug de app>": "<slug de plan>" }` de las suscripciones vivas de la
 * organización activa, leído del token: sin red. Vacío sin sesión.
 */
export async function getPlanClaims(): Promise<Record<string, string>> {
  const token = await getKontroliaAccessToken();
  if (!token) return {};
  const claims = decodeAccessToken(token) as { plans?: Record<string, string> };
  return claims?.plans ?? {};
}

/**
 * Inicia un Stripe Checkout para un plan de pago y devuelve la URL de la
 * página hospedada: hay que navegar allí. Solo owner/admin de la organización.
 */
export async function startCheckout(input: {
  applicationSlug: string;
  planSlug: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const cuerpo = await pedirAAuthServer<{ url: string }>(
    "startCheckout",
    "/api/billing/checkout",
    {
      method: "POST",
      body: {
        application: input.applicationSlug,
        plan: input.planSlug,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      },
    },
  );
  return { url: cuerpo.url };
}

/** URL del portal de Stripe (cambiar plan, tarjeta, cancelar, facturas). */
export async function openBillingPortal(input: {
  applicationSlug: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const cuerpo = await pedirAAuthServer<{ url: string }>(
    "openBillingPortal",
    "/api/billing/portal",
    {
      method: "POST",
      body: { application: input.applicationSlug, returnUrl: input.returnUrl },
    },
  );
  return { url: cuerpo.url };
}

/**
 * Si quien tiene la sesión es owner o admin de su organización, según los
 * roles del token. Es lo mismo que comprueba auth-server antes de iniciar un
 * pago o abrir el portal; aquí solo sirve para no ofrecer botones que van a
 * responder 403.
 */
export async function esAdministradorDeLaOrganizacion(): Promise<boolean> {
  const token = await getKontroliaAccessToken();
  if (!token) return false;
  const roles = (decodeAccessToken(token) as { roles?: string[] })?.roles ?? [];
  return roles.includes("owner") || roles.includes("admin");
}
