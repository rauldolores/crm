import { createRemoteJWKSet, jwtVerify } from "jose";

import { kontroliaAuthConfig } from "@/lib/kontrolia-auth/config";
import {
  organizacionDeClaveDeApi,
  PREFIJO_CLAVE_DE_API,
} from "@/lib/server/apiKeys";

/**
 * Verificación de bearer token para el servidor MCP.
 *
 * Verifica contra el JWKS de KontrolIA Auth (no el del proyecto de Supabase
 * del CRM): el token que manda un cliente MCP lo emite KontrolIA Auth, y en
 * una instalación autoalojada esos dos proyectos de Supabase normalmente son
 * distintos. Verificar contra el proyecto equivocado haría fallar la
 * autenticación siempre, salvo en esta instalación donde ambos coinciden.
 */

const JWT_ISSUER = `${kontroliaAuthConfig.supabaseUrl}/auth/v1`;
const JWKS = createRemoteJWKSet(
  new URL(`${kontroliaAuthConfig.supabaseUrl}/auth/v1/.well-known/jwks.json`),
);

export interface AuthInfo {
  token: string;
  /**
   * Quién actúa: el `sub` del JWT, o `clave-de-api:<organización>` cuando
   * entra una integración. Solo para el límite de uso y la bitácora.
   */
  userId: string;
  role?: string;
  clientId?: string;
  /** Organización activa en KontrolIA Auth (claim `organization_id`). */
  organizationId?: string;
  /**
   * Los claims que evalúa RLS (`request.jwt.claims`). Con un JWT son los del
   * propio token; con una clave de API se arman aquí — ver validateToken.
   */
  claims: Record<string, unknown>;
  /** true si entró con una clave de API (`vnq_…`) y no con una sesión. */
  viaClaveDeApi: boolean;
}

/**
 * Acepta dos credenciales:
 *
 * - El JWT de KontrolIA Auth que emite el flujo OAuth (Claude, ChatGPT…).
 * - Una clave de API de la organización (`Bearer vnq_…`, las mismas de
 *   /api/claves que ya acepta /api/datos).
 *
 * La clave existe para las integraciones que corren solas, sin una persona
 * detrás —un agente de atención 24/7—. Con OAuth, su acceso colgaba de la
 * sesión de quien lo autorizó: cada "cerrar sesión" del ecosistema (que es
 * global) borraba también esa sesión, el refresh token dejaba de existir y
 * el agente se quedaba sin CRM sin que nadie se enterara. Una clave no
 * depende de ninguna sesión: vale hasta que un administrador la revoca.
 *
 * Con la clave no hay un JWT que reenviar a la base, así que los claims se
 * arman aquí: rol `authenticated` y la organización dueña de la clave. Es
 * todo lo que mira RLS (`crm.current_organization_id()` lee solo
 * `organization_id`), así que la clave ve exactamente lo de su organización
 * —lo mismo que un usuario de ella— y nada más. Sin `sub`: lo que escriba
 * queda sin responsable, igual que hoy por /api/datos.
 */
export async function validateToken(req: Request): Promise<AuthInfo | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) return null;

  if (token.startsWith(PREFIJO_CLAVE_DE_API)) {
    const organizationId = await organizacionDeClaveDeApi(token);
    if (!organizationId) return null;
    return {
      token,
      userId: `clave-de-api:${organizationId}`,
      role: "authenticated",
      organizationId,
      claims: { role: "authenticated", organization_id: organizationId },
      viaClaveDeApi: true,
    };
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: JWT_ISSUER });
    if (!payload.sub) return null;

    return {
      token,
      userId: payload.sub,
      role: payload.role as string | undefined,
      clientId: payload.client_id as string | undefined,
      organizationId: payload.organization_id as string | undefined,
      claims: payload as Record<string, unknown>,
      viaClaveDeApi: false,
    };
  } catch {
    return null;
  }
}

/**
 * Next.js en Vercel entrega el host real por el que llegó la petición (a
 * diferencia del gateway de Supabase Edge Functions, que lo pisa) — no hace
 * falta ninguna cabecera especial ni variable de entorno para esto.
 */
export function getBaseUrl(req: Request): string {
  return new URL(req.url).origin;
}

export function getResourceMetadataUrl(req: Request): string {
  return `${getBaseUrl(req)}/api/mcp/oauth-protected-resource`;
}

/**
 * Metadata RFC 9728 (OAuth 2.0 Protected Resource Metadata): le dice a un
 * cliente MCP dónde autenticarse. No hace falta servir por separado el
 * documento RFC 8414 (.well-known/oauth-authorization-server): KontrolIA
 * Auth ya lo expone en su propio proyecto de Supabase.
 */
export function protectedResourceMetadata(req: Request) {
  return {
    resource: `${getBaseUrl(req)}/api/mcp`,
    authorization_servers: [`${kontroliaAuthConfig.supabaseUrl}/auth/v1`],
    bearer_methods_supported: ["header"],
    // Además del token de OAuth se acepta una clave de API de la
    // organización (Bearer vnq_…) — ver validateToken.
  };
}
