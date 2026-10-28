import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { urlDeAcceso } from "@/lib/kontrolia-auth/oauth";

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
    window.location.replace(urlDeAcceso());
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
