import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

/**
 * Validación de sesión en servidor.
 *
 * El navegador nunca habla con la base de datos: manda el token de KontrolIA
 * Auth a las rutas /api del CRM, el servidor lo verifica aquí y solo entonces
 * consulta la base. Así el CRM funciona contra cualquier Supabase que el
 * cliente ya tenga, local o en la nube, sin configurar nada en ese proyecto.
 */

const AUTH_URL = process.env.NEXT_PUBLIC_KONTROLIA_AUTH_URL ?? "";
const SECRETO_SUPABASE = process.env.SUPABASE_JWT_SECRET ?? "";

/** Vida del token interno: corta a propósito, se emite en cada petición. */
const VIGENCIA_TOKEN_INTERNO = "2m";

export interface SesionKontrolia {
  usuarioId: string;
  organizacionId: string | null;
  roles: string[];
  permisos: string[];
}

/**
 * El juego de claves se descarga una vez y se mantiene en caché. KontrolIA Auth
 * firma con ES256, así que basta su clave pública: el CRM no necesita conocer
 * ningún secreto del servidor de autenticación.
 */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function obtenerJwks() {
  if (!AUTH_URL) {
    throw new Error("Falta NEXT_PUBLIC_KONTROLIA_AUTH_URL.");
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${AUTH_URL.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`),
    );
  }
  return jwks;
}

/**
 * Verifica el token que envía el navegador y devuelve sus datos de sesión.
 * Devuelve null si no hay token o si no es válido: quien llama responde 401.
 */
export async function validarSesion(
  peticion: Request,
): Promise<SesionKontrolia | null> {
  const cabecera = peticion.headers.get("authorization") ?? "";
  const token = cabecera.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, obtenerJwks());

    return {
      usuarioId: String(payload.sub ?? ""),
      organizacionId: (payload.organization_id as string | null) ?? null,
      roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
      permisos: Array.isArray(payload.permissions)
        ? (payload.permissions as string[])
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * Emite el token con el que el servidor consulta la base de datos del CRM.
 *
 * Se firma con el secreto de ese Supabase y lleva `organization_id`, de modo
 * que las políticas RLS siguen aplicándose dentro de la base. Es deliberado no
 * usar la clave de servicio: esa salta el RLS por completo, y entonces el
 * aislamiento entre organizaciones dependería de que cada consulta recordara
 * filtrar. Un olvido y una empresa vería datos de otra.
 */
export async function firmarTokenInterno(
  sesion: SesionKontrolia,
): Promise<string> {
  if (!SECRETO_SUPABASE) {
    throw new Error(
      "Falta SUPABASE_JWT_SECRET. Es el secreto JWT de la base de datos del CRM y solo debe existir en el servidor.",
    );
  }

  return new SignJWT({
    role: "authenticated",
    organization_id: sesion.organizacionId,
    roles: sesion.roles,
    permissions: sesion.permisos,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(sesion.usuarioId)
    .setIssuedAt()
    .setExpirationTime(VIGENCIA_TOKEN_INTERNO)
    .sign(new TextEncoder().encode(SECRETO_SUPABASE));
}
