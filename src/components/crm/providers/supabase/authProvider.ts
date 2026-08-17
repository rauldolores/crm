import type { AuthProvider } from "ra-core";
import { supabaseAuthProvider } from "ra-supabase-core";

import {
  getKontroliaAccessToken,
  getKontroliaClient,
} from "@/lib/kontrolia-auth/client";
import { isKontroliaAuthConfigured } from "@/lib/kontrolia-auth/config";
import { canAccess } from "../commons/canAccess";
import { getSupabaseClient } from "./supabase";

const getBaseAuthProvider = () =>
  supabaseAuthProvider(getSupabaseClient(), {
    getIdentity: async () => {
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
    },
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

const getSale = async () => {
  const storage = getLocalStorage();
  const cachedValue = storage?.getItem(CURRENT_SALE_CACHE_KEY);
  if (cachedValue != null) {
    return JSON.parse(cachedValue);
  }

  const { data: dataSession, error: errorSession } =
    await getSupabaseClient().auth.getSession();

  // Shouldn't happen after login but just in case
  if (dataSession?.session?.user == null || errorSession) {
    return undefined;
  }

  // Da de alta al usuario como comercial de su organización activa, y crea la
  // configuración de esa organización si aún no existe. Es idempotente y solo
  // se llega aquí cuando la caché está vacía, o sea una vez por sesión.
  //
  // Sustituye a los triggers que había sobre auth.users: esa tabla es compartida
  // con el resto del ecosistema KontrolIA, y en el momento del alta todavía no
  // hay sesión, así que un trigger no puede saber a qué organización asignarlo.
  const { error: errorProvision } = await getSupabaseClient().rpc(
    "provision_crm_access",
  );

  if (errorProvision) {
    console.error("provision_crm_access.error", errorProvision);
  }

  const { data: dataSale, error: errorSale } = await getSupabaseClient()
    .from("sales")
    .select("id, first_name, last_name, avatar, administrator")
    .match({ user_id: dataSession?.session?.user.id })
    .single();

  // Shouldn't happen either as all users are sales but just in case
  if (dataSale == null || errorSale) {
    return undefined;
  }

  storage?.setItem(CURRENT_SALE_CACHE_KEY, JSON.stringify(dataSale));
  return dataSale;
};

function clearCache() {
  const storage = getLocalStorage();
  storage?.removeItem(IS_INITIALIZED_CACHE_KEY);
  storage?.removeItem(CURRENT_SALE_CACHE_KEY);
}

export const getAuthProvider = (): AuthProvider => {
  const baseAuthProvider = getBaseAuthProvider();
  return {
    ...baseAuthProvider,
    login: async (params) => {
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
      clearCache();
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
