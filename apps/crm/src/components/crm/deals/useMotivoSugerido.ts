import type { Identifier } from "ra-core";
import { useEffect, useState } from "react";

import { llamarApi } from "../misc/llamarApi";

/**
 * Pide el motivo de pérdida que proponen las notas de una oportunidad, para
 * que el diálogo de «¿por qué se perdió?» llegue con algo puesto.
 *
 * Falla en silencio: es una ayuda para no dejar el campo vacío, no una
 * función que el usuario pidió. Si el despliegue no tiene clasificador, si la
 * oportunidad no tiene notas o si la API falla, vuelve `null` y el desplegable
 * se queda como siempre.
 */
export interface MotivoSugerido {
  loss_reason: string | null;
  /** De 0 a 1; se muestra para que se pueda desconfiar de una propuesta floja. */
  confianza: number | null;
}

export const useMotivoSugerido = (dealId: Identifier | null) => {
  const [sugerido, setSugerido] = useState<MotivoSugerido | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (dealId == null) {
      setSugerido(null);
      return;
    }
    // Si se cierra el diálogo y se abre otro antes de que llegue la
    // respuesta, la vieja no debe pisar la nueva.
    let vigente = true;
    setSugerido(null);
    setCargando(true);
    llamarApi<MotivoSugerido>("/api/ia/oportunidades/motivo-de-perdida", {
      method: "POST",
      body: JSON.stringify({ dealId }),
    })
      .then((respuesta) => {
        if (vigente) setSugerido(respuesta);
      })
      .catch(() => {})
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [dealId]);

  return { sugerido, cargando };
};
