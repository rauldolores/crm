import { env } from "@/lib/env";

/** La aplicación a la que pertenece un rol, tal como la embebe auth-server. */
export interface AplicacionDelRol {
  name: string;
  slug?: string;
}

/**
 * true si el rol es de esta aplicación. KontrolIA Auth es compartido por
 * todo el ecosistema: la organización también tiene los roles de las otras
 * aplicaciones que usa (Faqturia, Aduaniax…) y los de organización (Owner,
 * Admin, Member), que no dan acceso al CRM por sí solos.
 *
 * Sin módulos de navegador: lo usan tanto el diálogo de invitar como la
 * sincronización de miembros en el servidor.
 */
export const esRolDeEstaApp = (rol: {
  application?: AplicacionDelRol | null;
}): boolean => rol.application?.slug === env.kontroliaApplicationSlug;
