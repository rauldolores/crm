import { AuthProvider, useAuth } from "@kontrolia/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { kontroliaAuthConfig } from "@/lib/kontrolia-auth/config";
import {
  OAUTH_CLIENT_ID,
  OAUTH_CODE_VERIFIER_STORAGE_KEY,
  oauthRedirectUri,
} from "@/lib/kontrolia-auth/oauth";

/**
 * Inicio del flujo OAuth 2.1 (Authorization Code + PKCE).
 *
 * Vinqulia no pide credenciales nunca: solo construye la URL de
 * autorización y redirige a KontrolIA Auth, que es la única pantalla de acceso
 * del ecosistema. El registro, los usuarios, los roles y las organizaciones
 * viven allí, no aquí.
 */
const Contenido = () => {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const yaSeInicio = useRef(false);

  useEffect(() => {
    if (auth.isLoading || yaSeInicio.current) return;

    if (!OAUTH_CLIENT_ID) {
      setError(
        "Falta configurar VITE_KONTROLIA_OAUTH_CLIENT_ID. Ejecuta el instalador para registrar esta aplicación en KontrolIA Auth.",
      );
      return;
    }

    yaSeInicio.current = true;

    (async () => {
      try {
        const { url, codeVerifier } = await auth.buildOAuthServerAuthorizeUrl({
          clientId: OAUTH_CLIENT_ID,
          redirectUri: oauthRedirectUri(),
          state:
            new URLSearchParams(window.location.search).get("destino") || "/",
        });
        sessionStorage.setItem(OAUTH_CODE_VERIFIER_STORAGE_KEY, codeVerifier);
        window.location.href = url;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo contactar con KontrolIA Auth.",
        );
      }
    })();
  }, [auth, auth.isLoading]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h1 className="text-xl font-semibold mb-2">
            No se pudo iniciar sesión
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Redirigiendo a KontrolIA Auth…
      </p>
    </div>
  );
};

export const OAuthLoginPage = () => (
  <AuthProvider config={kontroliaAuthConfig}>
    <Contenido />
  </AuthProvider>
);

OAuthLoginPage.path = "/oauth/login";
