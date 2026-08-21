import { CRM } from "@/components/crm/root/CRM";
import { OAuthCallbackPage } from "@/components/crm/login/OAuthCallbackPage";
import { OAuthLoginPage } from "@/components/crm/login/OAuthLoginPage";

/**
 * Application entry point
 *
 * Customize Vinqulia by passing props to the CRM component:
 *  - companySectors
 *  - darkTheme
 *  - dealCategories
 *  - dealPipelineStatuses
 *  - dealStages
 *  - lightTheme
 *  - darkModeLogo / lightModeLogo
 *  - noteStatuses
 *  - taskTypes
 *  - title
 * ... as well as all the props accepted by shadcn-admin-kit's <Admin> component.
 *
 * Logos must be an imported asset, an absolute URL, or a data URI — never a
 * route-relative path like "./img/logo.png", which breaks on nested routes.
 *
 * @example
 * import logoDark from "./logo-dark.svg";
 * import logoLight from "./logo-light.svg";
 *
 * const App = () => (
 *    <CRM
 *       darkModeLogo={logoDark}
 *       lightModeLogo={logoLight}
 *       title="Acme CRM"
 *    />
 * );
 */
/**
 * El retorno de KontrolIA Auth llega a una ruta normal (`/oauth/callback`),
 * mientras que el CRM enruta por hash: el router interno nunca la vería. Por
 * eso se intercepta aquí, antes de montarlo.
 */
const RUTAS_OAUTH = [OAuthLoginPage, OAuthCallbackPage];

const App = () => {
  // Mayuscula inicial obligatoria: JSX trata las minusculas como etiquetas HTML.
  const RutaOAuth = RUTAS_OAUTH.find(
    (ruta) => window.location.pathname === ruta.path,
  );

  return RutaOAuth ? <RutaOAuth /> : <CRM />;
};

export default App;
