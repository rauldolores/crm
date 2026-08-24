import type { AuthProvider } from "ra-core";
import { supabaseAuthProvider } from "ra-supabase-core";

import {
  getKontroliaAccessToken,
  getKontroliaClient,
  logoutKontroliaAuth,
} from "@/lib/kontrolia-auth/client";
import { OAUTH_LOGIN_PATH } from "@/lib/kontrolia-auth/oauth";
import { isKontroliaAuthConfigured } from "@/lib/kontrolia-auth/config";
import { canAccess } from "../commons/canAccess";
import { getSupabaseClient } from "./supabase";

const getIdentityFromSale = async () => {
  const sale = await getSale();

  if (sale != null) {
    return {
      id: sale.id,
      fullName: `${sale.first_name} ${sale.last_name}`,
      avatar: sale.avatar?.src,
    };
  }

  // Con acceso centralizado, no encontrar ficha de comercial no significa
  // que no haya sesion: puede ser que el usuario aun no este aprovisionado
  // en esta organizacion, o que la consulta a la base fallara. Lanzar aqui
  // hacia que ra-core lo tomara por sesion invalida y devolviera al login,
  // reabriendo el ciclo con KontrolIA Auth.
  if (isKontroliaAuthConfigured()) {
    const usuario = await getKontroliaClient()?.getUser();
    if (usuario) {
      return {
        id: usuario.id,
        fullName: usuario.email ?? "",
      };
    }
  }

  throw new Error();
};

const getBaseAuthProvider = () =>
  // Cast: supabaseAuthProvider solo usa client.auth (sesión), que no depende
  // del esquema de datos, pero su tipo asume el esquema "public" por defecto.
  supabaseAuthProvider(getSupabaseClient() as any, {
    getIdentity: getIdentityFromSale,
  });

// To speed up checks, we cache the initialization state
// and the current sale in the local storage. They are cleared on logout.
const IS_INITIALIZED_CACHE_KEY = "RaStore.auth.is_initialized";
const CURRENT_SALE_CACHE_KEY = "RaStore.auth.current_sale";

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export async function getIsInitialized() {
  const storage = getLocalStorage();
  const cachedValue = storage?.getItem(IS_INITIALIZED_CACHE_KEY);
  if (cachedValue != null) {
    return cachedValue === "true";
  }

  const { data } = await getSupabaseClient()
    .from("init_state")
    .select("is_initialized");
  const isInitialized = data?.at(0)?.is_initialized > 0;

  if (isInitialized) {
    storage?.setItem(IS_INITIALIZED_CACHE_KEY, "true");
  }

  return isInitialized;
}

let peticionDeFichaEnVuelo: Promise<any> | null = null;

/**
 * ra-core llama a esto desde varios sitios independientes casi al mismo
 * tiempo: una vez por getIdentity (menú de usuario) y una vez por cada
 * `<CanAccess>` del sidebar (5 recursos). Sin compartir la llamada en curso,
 * los primeros en llegar veían el caché de localStorage todavía frío y cada
 * uno disparaba su propia consulta a KontrolIA Auth — con el token por
 * vencer, eso eran varios refrescos simultáneos con el mismo refresh token,
 * que KontrolIA Auth rechazaba con 429 en cascada. Se comparte una sola
 * promesa en vuelo por eso.
 */
const getSale = async () => {
  if (peticionDeFichaEnVuelo) return peticionDeFichaEnVuelo;
  peticionDeFichaEnVuelo = (async () => {
    try {
      const storage = getLocalStorage();
      const cachedValue = storage?.getItem(CURRENT_SALE_CACHE_KEY);
      if (cachedValue != null) {
        return JSON.parse(cachedValue);
      }

      // La identidad viene de KontrolIA Auth. No se usa supabase.auth porque, al
      // configurar el cliente con `accessToken`, supabase-js lo deshabilita.
      const usuario = await getKontroliaClient()?.getUser();
      if (usuario == null) {
        return undefined;
      }

      // Da de alta al usuario en el CRM la primera vez que entra, y con el la
      // configuracion de su organizacion. Se hace en el servidor porque es quien
      // conoce la organizacion del token: dentro de la base, consultando con la
      // clave de servicio, ese dato no esta disponible.
      const token = await getKontroliaAccessToken();
      const respuesta = await fetch("/api/crm/aprovisionar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // KontrolIA Auth guarda el nombre completo en un solo campo; el CRM lo
        // separa en dos. Se parte por el primer espacio, que es lo razonable sin
        // inventar reglas por idioma.
        body: JSON.stringify({
          email: usuario.email ?? "",
          first_name: (usuario.fullName ?? "").split(" ")[0] ?? "",
          last_name: (usuario.fullName ?? "").split(" ").slice(1).join(" "),
        }),
      }).catch(() => null);

      if (respuesta?.ok) {
        const { sale } = await respuesta.json();
        if (sale) {
          storage?.setItem(CURRENT_SALE_CACHE_KEY, JSON.stringify(sale));
          return sale;
        }
      }

      // maybeSingle y no single: sin ficha todavía (el aprovisionamiento falló o
      // va en camino) single responde 406 y ensucia la consola en cada intento.
      const { data: dataSale, error: errorSale } = await getSupabaseClient()
        .from("sales")
        .select("id, first_name, last_name, avatar, administrator")
        .match({ user_id: usuario.id })
        .maybeSingle();

      if (dataSale == null || errorSale) {
        return undefined;
      }

      storage?.setItem(CURRENT_SALE_CACHE_KEY, JSON.stringify(dataSale));
      return dataSale;
    } finally {
      peticionDeFichaEnVuelo = null;
    }
  })();
  return peticionDeFichaEnVuelo;
};

/**
 * Vacía lo cacheado de la sesión (ficha de comercial e inicialización).
 * Exportada porque el selector de organización debe llamarla al cambiar: la
 * ficha cacheada pertenece a la organización anterior y, sin limpiarla, la
 * identidad y los permisos seguirían siendo los de la otra empresa.
 */
export function clearAuthCache() {
  const storage = getLocalStorage();
  storage?.removeItem(IS_INITIALIZED_CACHE_KEY);
  storage?.removeItem(CURRENT_SALE_CACHE_KEY);
}

export const getAuthProvider = (): AuthProvider => {
  const baseAuthProvider = getBaseAuthProvider();
  return {
    ...baseAuthProvider,
    // Con acceso centralizado hay que saltarse el envoltorio de
    // ra-supabase-core: antes de delegar en el getIdentity configurado,
    // consulta client.auth.getUser() contra Supabase Auth, donde ya no hay
    // sesion, asi que lanzaba siempre. Sin identidad, las listas (ContactList
    // y companeras) devuelven null y la pantalla queda en blanco sin error.
    getIdentity: async () => {
      if (!isKontroliaAuthConfigured()) {
        return baseAuthProvider.getIdentity!();
      }
      return getIdentityFromSale();
    },
    login: async (params) => {
      // Con acceso centralizado el CRM no recibe credenciales: la pantalla de
      // acceso redirige a KontrolIA Auth antes de llegar aqui.
      if (isKontroliaAuthConfigured()) {
        window.location.replace(OAUTH_LOGIN_PATH);
        return;
      }
      if (params.ssoDomain) {
        const { error } = await getSupabaseClient().auth.signInWithSSO({
          domain: params.ssoDomain,
        });
        if (error) {
          throw error;
        }
        return;
      }
      return baseAuthProvider.login(params);
    },
    logout: async (params) => {
      clearAuthCache();
      if (isKontroliaAuthConfigured()) {
        await logoutKontroliaAuth();
        return;
      }
      return baseAuthProvider.logout(params);
    },
    checkError: async (error) => {
      // Un fallo de permisos de la base de datos del CRM no es un fallo de
      // sesion contra KontrolIA Auth, y confundirlos producia un ciclo: la
      // consulta devolvia 401, ra-core cerraba sesion, la pantalla de acceso
      // redirigia al proveedor, se volvia a entrar y la consulta fallaba otra
      // vez. La sesion la valida checkAuth; aqui solo se deja pasar el error
      // para que la interfaz lo muestre.
      if (isKontroliaAuthConfigured()) {
        return;
      }
      return baseAuthProvider.checkError?.(error);
    },
    checkAuth: async (params) => {
      // Con el acceso centralizado, la sesion vive en KontrolIA Auth y no en
      // Supabase Auth. Comprobarla contra Supabase daba siempre "sin sesion",
      // asi que tras un acceso correcto el CRM volvia a mandar al login y se
      // producia un ciclo infinito entre el CRM y auth.kontrolia.io.
      if (isKontroliaAuthConfigured()) {
        const token = await getKontroliaAccessToken();
        if (!token) throw new Error("Sin sesion");
        return;
      }

      // Users are on the set-password page, nothing to do
      if (
        window.location.pathname === "/set-password" ||
        window.location.hash.includes("#/set-password")
      ) {
        return;
      }
      // Users are on the forgot-password page, nothing to do
      if (
        window.location.pathname === "/forgot-password" ||
        window.location.hash.includes("#/forgot-password")
      ) {
        return;
      }
      // Users are on the sign-up page, nothing to do
      if (
        window.location.pathname === "/sign-up" ||
        window.location.hash.includes("#/sign-up")
      ) {
        return;
      }

      // Ya no se comprueba si la instalación "está inicializada" para mandar
      // a una pantalla de alta: crear cuentas es competencia de KontrolIA
      // Auth. Sin sesión, ra-core lleva a la pantalla de acceso, que redirige
      // allí.
      return baseAuthProvider.checkAuth(params);
    },
    canAccess: async (params) => {
      // La puerta de "instalacion sin inicializar" consultaba init_state, que
      // sin sesion de Supabase devuelve falso y denegaba toda la aplicacion.
      // Con acceso centralizado esa comprobacion ya no aplica.
      if (!isKontroliaAuthConfigured()) {
        const isInitialized = await getIsInitialized();
        if (!isInitialized) return false;
      }

      // Get the current user
      const sale = await getSale();

      // Sin ficha de comercial se concede el rol basico en lugar de denegar
      // todo: el aislamiento real lo aplica el RLS de la base de datos, no
      // esta comprobacion de interfaz.
      if (sale == null) {
        return isKontroliaAuthConfigured() ? canAccess("user", params) : false;
      }

      // Compute access rights from the sale role
      const role = sale.administrator ? "admin" : "user";
      return canAccess(role, params);
    },
    getAuthorizationDetails(authorizationId: string) {
      return getSupabaseClient().auth.oauth.getAuthorizationDetails(
        authorizationId,
      );
    },
    approveAuthorization(authorizationId: string) {
      return getSupabaseClient().auth.oauth.approveAuthorization(
        authorizationId,
      );
    },
    denyAuthorization(authorizationId: string) {
      return getSupabaseClient().auth.oauth.denyAuthorization(authorizationId);
    },
  };
};
