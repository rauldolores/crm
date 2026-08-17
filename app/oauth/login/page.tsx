"use client";

import { OAuthLoginPage } from "@/components/crm/login/OAuthLoginPage";

/**
 * Inicio del acceso. Con Next hay enrutado por ruta real, así que ya no hace
 * falta interceptar el pathname en el punto de entrada como con Vite, cuyo
 * enrutado por hash nunca habría visto esta URL.
 */
export default function Pagina() {
  return <OAuthLoginPage />;
}
