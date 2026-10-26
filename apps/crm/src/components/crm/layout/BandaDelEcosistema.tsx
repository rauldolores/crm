import { KontroliaBand } from "@kontrolia/react";
import { env } from "@/lib/env";
import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";

/**
 * Banda compartida del ecosistema KontrolIA (logo y color del cliente,
 * lanzador de sus apps), igual que en el resto de las apps del ecosistema.
 *
 * Solo se monta dentro del layout autenticado (escritorio y móvil), nunca en
 * las pantallas de acceso. El script `band.v1.js` de auth-server la pinta en
 * su propio Shadow DOM como primer hijo de `<body>` y falla en silencio: sin
 * token o sin respuesta no pinta nada, y sin servidor central configurado
 * (instalaciones autohospedadas) ni siquiera se carga.
 *
 * Cuando aparece fija `--kontrolia-band-height` en `:root`; el layout la usa
 * para correr hacia abajo la cabecera y la barra lateral pegadas, y el
 * contenedor de la banda se fija arriba en `index.css`.
 *
 * El token es el de la sesión de KontrolIA Auth (el mismo que usa el data
 * provider), refrescado si está por caducar.
 */
export const BandaDelEcosistema = () => (
  <KontroliaBand
    getToken={getKontroliaAccessToken}
    authServerUrl={env.kontroliaAuthServerUrl}
  />
);
