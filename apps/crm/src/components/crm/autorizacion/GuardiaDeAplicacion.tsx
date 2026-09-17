import { decodeAccessToken } from "@kontrolia/auth";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import { env } from "@/lib/env";
import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";
import { isKontroliaAuthConfigured } from "@/lib/kontrolia-auth/config";
import { facturacionDisponible } from "@/lib/kontrolia-auth/facturacion";
import { useDerechos } from "../facturacion/useDerechos";

/** Ruta a la que manda cuando el token no trae acceso a esta app. */
export const RUTA_SIN_ACCESO = "/sin-acceso";

/** true si alguno de los permisos del token es de esta aplicación. */
export const tienePermisoDeLaApp = (permisos: string[]): boolean => {
  const prefijo = `${env.kontroliaApplicationSlug}.`;
  return permisos.some((permiso) => permiso.startsWith(prefijo));
};

/**
 * Solo los dos claims que hacen falta aquí — no se importa el tipo completo
 * del SDK (`@kontrolia/shared`) por lo mismo que explica el comentario en
 * facturacion.ts: es una dependencia transitiva, y duplicar dos campos es
 * más simple que depender de ella directamente.
 */
interface ClaimsDeAcceso {
  permissions: string[];
  is_platform_admin?: boolean;
}

/**
 * true si los claims dejan entrar a esta aplicación: un permiso `crm.…`, o
 * `is_platform_admin` — el claim aparte que pone kontrolia_auth para el
 * personal de soporte/operación, fuera del espacio de permisos por app
 * (ningún catálogo de la aplicación puede otorgarlo).
 */
export const tieneAccesoALaApp = (claims: ClaimsDeAcceso | null): boolean =>
  claims?.is_platform_admin === true ||
  tienePermisoDeLaApp(claims?.permissions ?? []);

export type DecisionSinPermiso = "esperar" | "sin_acceso" | "dejar_al_plan";

/**
 * Qué hacer cuando el token no trae ningún permiso de esta app. El token
 * solo no basta para saber por qué: el hook de KontrolIA Auth quita los
 * permisos de una app que exige plan cuando la organización no tiene uno
 * vigente, así que «sin permisos» puede ser «esta organización no usa el
 * CRM» o «lo usa, pero todavía no ha contratado plan» — y esa segunda
 * persona debe ir a «elige tu plan» (para contratarlo), no a «sin acceso».
 * Lo distingue la consulta de derechos: se espera a tenerla antes de
 * decidir, y si no llega (error, o planes no configurados) se cae al
 * bloqueo de siempre.
 */
export const decidirSinPermiso = (
  derechos: { plansRequired: boolean; access: string } | null,
  error: string | null,
  hayPlanes: boolean = facturacionDisponible(),
): DecisionSinPermiso => {
  if (!hayPlanes || error) return "sin_acceso";
  if (!derechos) return "esperar";
  return derechos.plansRequired && derechos.access !== "ok"
    ? "dejar_al_plan"
    : "sin_acceso";
};

/**
 * Bloqueo de aplicación: KontrolIA Auth es compartido por todo el
 * ecosistema (Faqturia, el CRM, lo que venga después), así que tener una
 * sesión válida ahí no dice nada sobre si la organización activa tiene el
 * CRM contratado. El servidor ya lo exige sin excepción en cada petición
 * (ver requireKontroliaPermission.ts) — sin esta guardia, quien no tiene
 * acceso igual entraba a la aplicación y solo se topaba con una pantalla
 * llena de errores 403 al primer dato que intentara cargar, en vez de una
 * explicación clara.
 *
 * El criterio de acceso vive en tieneAccesoALaApp(), que también deja pasar
 * al personal de soporte/operación de KontrolIA Auth (is_platform_admin).
 *
 * Vive en el layout (escritorio y móvil), igual que GuardiaDePlan, y
 * comprueba el token en vez de llamar al servidor: los claims ya traen la
 * respuesta, sin necesidad de una petición de red.
 */
export const GuardiaDeAplicacion = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { derechos, error } = useDerechos();

  useEffect(() => {
    if (pathname === RUTA_SIN_ACCESO || !isKontroliaAuthConfigured()) return;

    let cancelado = false;
    void getKontroliaAccessToken().then((token) => {
      if (cancelado) return;
      const claims = token ? decodeAccessToken(token) : null;
      if (tieneAccesoALaApp(claims)) return;
      // Sin plan, GuardiaDePlan es quien manda a «elige tu plan».
      if (decidirSinPermiso(derechos, error) === "sin_acceso") {
        navigate(RUTA_SIN_ACCESO, { replace: true });
      }
    });

    return () => {
      cancelado = true;
    };
  }, [navigate, pathname, derechos, error]);

  return null;
};
