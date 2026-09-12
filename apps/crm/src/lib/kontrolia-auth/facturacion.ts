/**
 * Planes, suscripción y cobros de la organización, contra KontrolIA Auth.
 *
 * Envoltura fina sobre los métodos de planes de @kontrolia/auth (≥ 2.3):
 * `getPlans`, `getEntitlements`, `getPlanClaims`, `startCheckout` y
 * `openBillingPortal`. Existe para usarlos FUERA del árbol de React (la
 * guardia, la caché de derechos) con el mismo singleton que el resto del
 * CRM, y para dar un solo sitio donde preguntar si esta instalación tiene
 * planes siquiera.
 *
 * Nada de aquí procesa pagos ni ve tarjetas: la app solo navega a las URLs
 * hospedadas que devuelve KontrolIA Auth (Stripe Checkout y su portal).
 */
import { decodeAccessToken, type KontroliaClient } from "@kontrolia/auth";

import { env } from "@/lib/env";
import { getKontroliaAccessToken, getKontroliaClient } from "./client";

// Los tipos se derivan del propio SDK para no depender de @kontrolia/shared
// (una dependencia transitiva) ni duplicarlos aquí.
export type KontroliaPlan = Awaited<
  ReturnType<KontroliaClient["getPlans"]>
>[number];
export type KontroliaEntitlements = Awaited<
  ReturnType<KontroliaClient["getEntitlements"]>
>;
export type KontroliaSubscription = NonNullable<
  KontroliaEntitlements["subscription"]
>;
export type KontroliaUsage = KontroliaEntitlements["usage"][number];
export type KontroliaAccess = KontroliaEntitlements["access"];
export type KontroliaBillingInterval = KontroliaPlan["billingInterval"];

/** true si la instalación puede hablar con auth-server para todo esto. */
export const facturacionDisponible = (): boolean =>
  Boolean(env.kontroliaAuthServerUrl && env.kontroliaAuthUrl);

const cliente = (metodo: string): KontroliaClient => {
  const c = getKontroliaClient();
  if (!c || !facturacionDisponible()) {
    throw new Error(
      `${metodo} requiere KontrolIA Auth y NEXT_PUBLIC_KONTROLIA_AUTH_SERVER_URL.`,
    );
  }
  return c;
};

/** Los planes activos de la aplicación: lo que muestra la pantalla de precios. */
export const getPlans = (applicationSlug: string): Promise<KontroliaPlan[]> =>
  cliente("getPlans").getPlans(applicationSlug);

/**
 * A qué tiene derecho la organización activa en esta aplicación ahora mismo:
 * plan, estado, por qué está bloqueado el acceso (si lo está), permisos
 * efectivos y cada límite con su consumo.
 */
export const getEntitlements = (
  applicationSlug: string,
): Promise<KontroliaEntitlements> =>
  cliente("getEntitlements").getEntitlements(applicationSlug);

/** `{ "<slug de app>": "<slug de plan>" }` leído del token: sin red. */
export const getPlanClaims = (): Promise<Record<string, string>> =>
  cliente("getPlanClaims").getPlanClaims();

/**
 * Inicia un Stripe Checkout para un plan de pago y devuelve la URL de la
 * página hospedada: hay que navegar allí. Solo owner/admin de la organización.
 */
export const startCheckout = (input: {
  applicationSlug: string;
  planSlug: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> => cliente("startCheckout").startCheckout(input);

/** URL del portal de Stripe (cambiar plan, tarjeta, cancelar, facturas). */
export const openBillingPortal = (input: {
  applicationSlug: string;
  returnUrl: string;
}): Promise<{ url: string }> =>
  cliente("openBillingPortal").openBillingPortal(input);

/**
 * Si quien tiene la sesión es owner o admin de su organización, según los
 * roles del token. Es lo mismo que comprueba auth-server antes de iniciar un
 * pago o abrir el portal; aquí solo sirve para no ofrecer botones que van a
 * responder 403.
 */
export async function esAdministradorDeLaOrganizacion(): Promise<boolean> {
  const token = await getKontroliaAccessToken();
  if (!token) return false;
  const roles = decodeAccessToken(token)?.roles ?? [];
  return roles.includes("owner") || roles.includes("admin");
}
