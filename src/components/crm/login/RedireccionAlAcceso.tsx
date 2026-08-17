import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { OAUTH_LOGIN_PATH } from "@/lib/kontrolia-auth/oauth";

/**
 * Pantalla de acceso del CRM: no muestra ningún formulario, redirige.
 *
 * Vinqulia no pide credenciales ni registra usuarios. Todo eso vive en
 * KontrolIA Auth, así que quien llega sin sesión sale hacia allí.
 *
 * Se usa `window.location` y no el enrutador porque `/oauth/login` es una ruta
 * de Next, fuera del enrutado interno que gestiona ra-core.
 */
export const RedireccionAlAcceso = () => {
  useEffect(() => {
    // Nunca se vuelve a una ruta de acceso. Guardar `#/login` como destino
    // creaba un ciclo: al volver de KontrolIA Auth el CRM aterrizaba otra vez
    // en la pantalla de acceso, que redirigia de nuevo.
    const hash = window.location.hash;
    const esRutaDeAcceso =
      /#\/(login|sign-up|set-password|forgot-password)/.test(hash);
    const destino = esRutaDeAcceso ? "/" : `${window.location.pathname}${hash}`;

    window.location.replace(
      `${OAUTH_LOGIN_PATH}?destino=${encodeURIComponent(destino)}`,
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Redirigiendo a KontrolIA Auth…
      </p>
    </div>
  );
};
