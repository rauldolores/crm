import { useCallback, useEffect, useState } from "react";

import { env } from "@/lib/env";
import {
  facturacionDisponible,
  getEntitlements,
  type KontroliaEntitlements,
} from "@/lib/kontrolia-auth/facturacion";

/**
 * Derechos de la organización activa en esta aplicación (plan, estado,
 * consumo), consultados a KontrolIA Auth una vez por carga y compartidos
 * entre quien los necesite: la guardia que bloquea sin plan, la barra
 * lateral que muestra el consumo y la pantalla de facturación.
 *
 * Caché a nivel de módulo y no un contexto de React: las páginas «elige tu
 * plan» y «volviendo del pago» viven fuera del layout, y aun así deben ver
 * lo mismo que el resto de la app.
 */

interface EstadoDeDerechos {
  derechos: KontroliaEntitlements | null;
  cargando: boolean;
  /** Fallo de red o de auth-server: no se sabe. Nunca se bloquea por esto. */
  error: string | null;
}

let estado: EstadoDeDerechos = { derechos: null, cargando: false, error: null };
let peticionEnVuelo: Promise<void> | null = null;
const oyentes = new Set<(estado: EstadoDeDerechos) => void>();

const publicar = (nuevo: EstadoDeDerechos) => {
  estado = nuevo;
  oyentes.forEach((oyente) => oyente(estado));
};

/** Vuelve a pedir los derechos. Concurrente-seguro: una sola petición a la vez. */
export const recargarDerechos = (): Promise<void> => {
  if (peticionEnVuelo) return peticionEnVuelo;
  if (!facturacionDisponible()) {
    publicar({ derechos: null, cargando: false, error: null });
    return Promise.resolve();
  }
  publicar({ ...estado, cargando: true });
  peticionEnVuelo = getEntitlements(env.kontroliaApplicationSlug)
    .then((derechos) => publicar({ derechos, cargando: false, error: null }))
    .catch((error: unknown) =>
      publicar({
        ...estado,
        cargando: false,
        error: error instanceof Error ? error.message : "Sin respuesta",
      }),
    )
    .finally(() => {
      peticionEnVuelo = null;
    });
  return peticionEnVuelo;
};

/** Al cerrar sesión o cambiar de organización lo cacheado deja de valer. */
export const olvidarDerechos = () => {
  publicar({ derechos: null, cargando: false, error: null });
};

export const useDerechos = (): EstadoDeDerechos & {
  recargar: () => Promise<void>;
} => {
  const [actual, setActual] = useState(estado);

  useEffect(() => {
    oyentes.add(setActual);
    if (!estado.derechos && !estado.cargando && !estado.error) {
      void recargarDerechos();
    }
    return () => {
      oyentes.delete(setActual);
    };
  }, []);

  const recargar = useCallback(() => recargarDerechos(), []);

  return { ...actual, recargar };
};
