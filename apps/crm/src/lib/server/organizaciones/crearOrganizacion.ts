/**
 * Crea en KontrolIA Auth una organización lista para usar esta app, con el
 * token de quien la pide. Replica lo que hace el registro público
 * (provision_self_service_tenant) pero para alguien que YA tiene cuenta y
 * quiere un espacio nuevo del que sea dueño:
 *
 *   1. POST /api/organizations → la org; el disparador del auth-server
 *      deja a quien llama como Owner.
 *   2. POST /api/organizations/{id}/applications → habilita esta app; el
 *      disparador crea el rol «Administrador de <app>» con todos los
 *      permisos.
 *   3. POST /api/organization-members/roles → ese rol al creador (Owner a
 *      secas no trae permisos de la app: el token los saca de los roles).
 *   4. POST /api/roles → «Usuario de <app>», sin permisos, para invitar a
 *      quien no deba administrar.
 *
 * Todo con el bearer del usuario: la autorización es la RLS del
 * auth-server, no este código. Si falla algo después del paso 1 la
 * organización ya existe: se devuelve con un `aviso` en vez de fingir que
 * no se creó, para que la persona pueda cambiar a ella y pedir ayuda.
 */

export interface OrganizacionCreada {
  organizacion: { id: string; nombre: string; slug: string };
  aviso?: string;
}

interface Dependencias {
  authServerUrl: string;
  applicationSlug: string;
  token: string;
  /** Id del usuario (claim `sub` del token), para localizar su membresía. */
  userId: string;
  fetch?: typeof fetch;
}

export class ErrorDeAuthServer extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Mismo slug que genera provision_self_service_tenant: el nombre en
 * minúsculas, sin acentos ni símbolos, más 6 caracteres aleatorios para
 * que dos organizaciones con el mismo nombre no choquen.
 */
export const slugDeOrganizacion = (
  nombre: string,
  aleatorio: string = crypto.randomUUID().replace(/-/g, "").slice(0, 6),
): string => {
  const base =
    nombre
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "org";
  return `${base}-${aleatorio}`;
};

export async function crearOrganizacionEnKontroliaAuth(
  nombre: string,
  deps: Dependencias,
): Promise<OrganizacionCreada> {
  const hacerFetch = deps.fetch ?? fetch;
  const base = deps.authServerUrl.replace(/\/$/, "");

  const pedir = async <T>(
    ruta: string,
    init: RequestInit & { generico: string },
  ): Promise<T> => {
    const { generico, ...resto } = init;
    const respuesta = await hacerFetch(`${base}${ruta}`, {
      ...resto,
      headers: {
        Authorization: `Bearer ${deps.token}`,
        ...(resto.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!respuesta.ok) {
      const cuerpo = (await respuesta.json().catch(() => null)) as {
        error?: unknown;
      } | null;
      throw new ErrorDeAuthServer(
        typeof cuerpo?.error === "string" ? cuerpo.error : generico,
        respuesta.status,
      );
    }
    return (await respuesta.json().catch(() => ({}))) as T;
  };

  // 1. La organización.
  const { organization } = await pedir<{
    organization: { id: string; name: string; slug: string };
  }>("/api/organizations", {
    method: "POST",
    body: JSON.stringify({ name: nombre, slug: slugDeOrganizacion(nombre) }),
    generico: "No se pudo crear la organización.",
  });
  const organizacion = {
    id: organization.id,
    nombre: organization.name,
    slug: organization.slug,
  };

  try {
    // 2. Esta app, habilitada en ella.
    const { applications } = await pedir<{
      applications: { id: string; name: string; slug: string }[];
    }>("/api/applications", {
      generico: "No se pudo consultar el catálogo de aplicaciones.",
    });
    const app = applications.find((a) => a.slug === deps.applicationSlug);
    if (!app) {
      throw new Error(
        `La aplicación «${deps.applicationSlug}» no está en el catálogo de KontrolIA Auth.`,
      );
    }
    await pedir(`/api/organizations/${organizacion.id}/applications`, {
      method: "POST",
      body: JSON.stringify({ applicationId: app.id }),
      generico: "No se pudo habilitar la aplicación en la organización.",
    });

    // 3. El rol de administrador de la app, al creador.
    const { roles } = await pedir<{
      roles: { id: string; slug: string; application_id: string | null }[];
    }>(`/api/roles?organizationId=${organizacion.id}`, {
      generico: "No se pudieron consultar los roles de la organización.",
    });
    const rolAdmin = roles.find(
      (r) => r.application_id === app.id && r.slug === `admin-${app.slug}`,
    );
    const { members } = await pedir<{
      members: { membershipId: string; userId: string }[];
    }>(`/api/organization-members?organizationId=${organizacion.id}`, {
      generico: "No se pudo consultar la membresía de la organización.",
    });
    const miMembresia = members.find((m) => m.userId === deps.userId);
    if (!rolAdmin || !miMembresia) {
      throw new Error(
        "La organización se creó, pero no se pudo asignar el rol de administrador.",
      );
    }
    await pedir("/api/organization-members/roles", {
      method: "POST",
      body: JSON.stringify({
        membershipId: miMembresia.membershipId,
        roleId: rolAdmin.id,
      }),
      generico: "No se pudo asignar el rol de administrador.",
    });

    // 4. El rol de usuario sin permisos, para las invitaciones.
    await pedir("/api/roles", {
      method: "POST",
      body: JSON.stringify({
        organizationId: organizacion.id,
        applicationId: app.id,
        name: `Usuario de ${app.name}`,
      }),
      generico: "No se pudo crear el rol de usuario.",
    });
  } catch (e) {
    return {
      organizacion,
      aviso: e instanceof Error ? e.message : "Quedó configuración pendiente.",
    };
  }

  return { organizacion };
}

/** `sub` del JWT sin verificar la firma: solo para localizar la membresía. */
export const subDelToken = (token: string): string | null => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
      ),
    ) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
};
