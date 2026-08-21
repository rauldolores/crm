import { AuthProvider, useAuth } from "@kontrolia/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { kontroliaAuthConfig } from "@/lib/kontrolia-auth/config";
import {
  OAUTH_CLIENT_ID,
  OAUTH_CODE_VERIFIER_STORAGE_KEY,
  oauthRedirectUri,
} from "@/lib/kontrolia-auth/oauth";

/**
 * Cierre del flujo OAuth: recibe el código de autorización de KontrolIA Auth
 * y lo canjea por una sesión.
 *
 * Se monta desde el punto de entrada de la aplicación en lugar de como una
 * ruta más, porque el CRM enruta por hash y el `redirect_uri` de OAuth es una
 * ruta normal: el router de ra-core nunca llegaría a verla.
 */
/**
 * Marca a nivel de modulo, no `useRef`.
 *
 * En desarrollo, el modo estricto de React monta, desmonta y vuelve a montar
 * cada componente, y las referencias se reinician en ese remontaje. El codigo
 * de autorizacion se canjeaba entonces dos veces, y como un codigo OAuth es de
 * un solo uso, el segundo intento fallaba y el acceso no llegaba a completarse.
 */
let codigoYaCanjeado = false;

const Contenido = () => {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (codigoYaCanjeado) return;
    codigoYaCanjeado = true;

    const procesar = async () => {
      const params = new URLSearchParams(window.location.search);

      const errorDevuelto = params.get("error");
      if (errorDevuelto) {
        setError(params.get("error_description") || errorDevuelto);
        return;
      }

      const code = params.get("code");
      if (!code) {
        setError("No se recibió un código de autorización válido.");
        return;
      }

      const codeVerifier = sessionStorage.getItem(
        OAUTH_CODE_VERIFIER_STORAGE_KEY,
      );
      if (!codeVerifier) {
        setError(
          "No se encontró el verificador de esta sesión de acceso. Vuelve a intentarlo.",
        );
        return;
      }

      try {
        await auth.exchangeOAuthServerCode({
          clientId: OAUTH_CLIENT_ID,
          redirectUri: oauthRedirectUri(),
          code,
          codeVerifier,
        });
        sessionStorage.removeItem(OAUTH_CODE_VERIFIER_STORAGE_KEY);

        // Se vuelve a la raíz con enrutado por hash, descartando el `code` de
        // la barra de direcciones para que no quede en el historial.
        const destino = params.get("state");
        window.location.replace(
          destino && destino.startsWith("/") ? `/#${destino}` : "/",
        );
      } catch (e) {
        // Se permite reintentar: si el canje fallo, el codigo se consumio y
        // hace falta empezar el flujo de nuevo, no repetir este paso.
        codigoYaCanjeado = false;
        console.error("oauth.callback.error", e);
        setError(
          e instanceof Error ? e.message : "No se pudo completar el acceso.",
        );
      }
    };

    procesar();
  }, [auth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h1 className="text-xl font-semibold mb-2">
            No se pudo iniciar sesión
          </h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <a className="text-sm underline hover:no-underline" href="/">
            Volver a intentarlo
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completando el acceso…</p>
    </div>
  );
};

export const OAuthCallbackPage = () => (
  <AuthProvider config={kontroliaAuthConfig}>
    <Contenido />
  </AuthProvider>
);

OAuthCallbackPage.path = "/oauth/callback";
