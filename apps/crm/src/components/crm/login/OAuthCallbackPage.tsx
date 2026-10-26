import { ErrorDeAcceso, PasoDeAcceso } from "./PantallaDeAcceso";
import { useEffect, useState } from "react";

import { getKontroliaClient } from "@/lib/kontrolia-auth/client";
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
 *
 * Usa el cliente singleton (getKontroliaClient) en lugar de <AuthProvider>:
 * ese componente crea SU PROPIA instancia de @kontrolia/auth sobre la misma
 * cookie de sesión que usa el resto de la app, algo que GoTrueClient advierte
 * explícitamente como riesgoso ("Multiple GoTrueClient instances detected in
 * the same browser context... under the same storage key"). Aquí no hace
 * falta: exchangeOAuthServerCode es autosuficiente.
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

      const cliente = getKontroliaClient();
      if (!cliente) {
        setError("KontrolIA Auth no está configurado en esta instalación.");
        return;
      }

      try {
        await cliente.exchangeOAuthServerCode({
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
  }, []);

  if (error) {
    return (
      <ErrorDeAcceso mensaje={error}>
        <a
          className="text-sm font-semibold underline hover:no-underline"
          href="/"
        >
          Volver a intentarlo
        </a>
      </ErrorDeAcceso>
    );
  }

  return <PasoDeAcceso texto="Completando el acceso…" />;
};

export const OAuthCallbackPage = () => <Contenido />;

OAuthCallbackPage.path = "/oauth/callback";
