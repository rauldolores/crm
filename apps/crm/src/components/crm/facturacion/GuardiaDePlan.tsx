import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

import { LIMITE_DE_USUARIOS_KEY } from "../providers/supabase/authProvider";
import { useDerechos } from "./useDerechos";

/** Parámetro con el que «elige tu plan» sabe que el problema es de cupo. */
export const MOTIVO_USUARIOS = "usuarios";

/** true si el servidor rechazó dar de alta a esta persona por falta de cupo. */
export const sinCupoDeUsuarios = (): boolean => {
  try {
    return window.localStorage.getItem(LIMITE_DE_USUARIOS_KEY) !== null;
  } catch {
    return false;
  }
};

/** Rutas del propio circuito de planes, que nunca se bloquean. */
export const RUTA_ELIGE_TU_PLAN = "/elige-tu-plan";
export const RUTA_FACTURACION = "/facturacion";
export const RUTA_RETORNO_DE_PAGO = "/facturacion/ok";

/**
 * Bloqueo por plan: en cada carga de la app consulta los derechos de la
 * organización y, si la aplicación exige plan y esta organización no tiene
 * uno vigente, manda a «elige tu plan».
 *
 * Vive en el layout (escritorio y móvil), que es lo que se monta una vez por
 * carga con sesión ya validada. No pinta nada.
 *
 * Si `plansRequired` es false, esta app no exige plan y no se hace nada: el
 * interruptor vive en KontrolIA Auth, no aquí. Y si auth-server no contesta,
 * tampoco: un fallo del proveedor de planes no debe dejar a nadie fuera.
 */
export const GuardiaDePlan = () => {
  const { derechos } = useDerechos();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (
      pathname.startsWith(RUTA_FACTURACION) ||
      pathname === RUTA_ELIGE_TU_PLAN
    ) {
      return;
    }
    // Sin cupo de usuarios no hay ficha de comercial, y sin ficha la app
    // funciona a medias. Se explica en vez de dejar entrar a un sitio vacío.
    if (sinCupoDeUsuarios()) {
      navigate(`${RUTA_ELIGE_TU_PLAN}?motivo=${MOTIVO_USUARIOS}`, {
        replace: true,
      });
      return;
    }
    if (!derechos || !derechos.plansRequired || derechos.access === "ok") {
      return;
    }
    navigate(RUTA_ELIGE_TU_PLAN, { replace: true });
  }, [derechos, navigate, pathname]);

  return null;
};
