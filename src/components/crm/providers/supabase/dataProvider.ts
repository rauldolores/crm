import { env } from "@/lib/env";
import { supabaseDataProvider } from "ra-supabase-core";
import {
  fetchUtils,
  withLifecycleCallbacks,
  type DataProvider,
  type GetListParams,
  type Identifier,
  type ResourceCallbacks,
} from "ra-core";
import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";
import type {
  ContactNote,
  Deal,
  DealNote,
  RAFile,
  Sale,
  SalesFormData,
  SignUpData,
} from "../../types";
import type { ConfigurationContextValue } from "../../root/ConfigurationContext";
import { ATTACHMENTS_BUCKET } from "../commons/attachments";
import { getIsInitialized } from "./authProvider";
import { getSupabaseClient, getUrlDeDatos } from "./supabase";

/**
 * Cliente HTTP del data provider.
 *
 * ra-supabase trae uno por defecto que saca el token de la sesion de Supabase
 * Auth, que ya no se usa: las peticiones salian sin cabecera Authorization y
 * el puente las rechazaba con 401. Tampoco bastaba interceptar el `fetch` del
 * cliente de Supabase, porque estas peticiones las hace ra-data-postgrest por
 * su cuenta y no pasan por ahi.
 */
const clienteHttp = async (url: string, opciones: fetchUtils.Options = {}) => {
  const token = await getKontroliaAccessToken();
  const cabeceras = new Headers(
    (opciones.headers as Headers | undefined) ?? { Accept: "application/json" },
  );
  cabeceras.set("apikey", env.supabasePublishableKey);
  if (token) cabeceras.set("Authorization", `Bearer ${token}`);

  return fetchUtils.fetchJson(url, { ...opciones, headers: cabeceras });
};

const getBaseDataProvider = () =>
  supabaseDataProvider({
    httpClient: clienteHttp,
    // Tiene que ser la misma direccion a la que apunta el cliente. ra-supabase
    // construye parte de sus peticiones a partir de `instanceUrl`, asi que
    // dejarlo en la URL real de la base hacia que esas fueran directas a
    // Supabase, saltandose el puente y llegando como usuario anonimo.
    instanceUrl: getUrlDeDatos(),
    apiKey: env.supabasePublishableKey,
    supabaseClient: getSupabaseClient(),
    sortOrder: "asc,desc.nullslast" as any,
  });

const processCompanyLogo = async (params: any) => {
  const logo = params.data.logo;

  if (logo?.rawFile instanceof File) {
    await uploadToBucket(logo);
  }

  return {
    ...params,
    data: {
      ...params.data,
      logo,
    },
  };
};

/**
 * Búsquedas ya sincronizadas con el directorio en esta carga de página. Los
 * miembros de una organización cambian poco: repetir la sincronización en
 * cada tecleo solo sumaría latencia al selector.
 */
const sincronizacionesHechas = new Set<string>();

/**
 * Pide al servidor que dé de alta en `sales` a los miembros de la
 * organización que aún no tienen ficha (ver /api/crm/comerciales/sincronizar).
 *
 * Sin esto, "responsable de venta" solo podía ofrecer a quienes ya habían
 * iniciado sesión en el CRM al menos una vez, porque la ficha de `sales` se
 * crea al primer acceso. KontrolIA Auth conoce a todos los miembros desde el
 * alta. Es tolerante a fallos: si la sincronización no responde, el selector
 * sigue funcionando con las fichas locales.
 */
const sincronizarComerciales = async (texto: string) => {
  if (sincronizacionesHechas.has(texto)) return;

  const token = await getKontroliaAccessToken();
  if (!token) return;

  const respuesta = await fetch("/api/crm/comerciales/sincronizar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ buscar: texto || undefined }),
  }).catch(() => null);

  if (respuesta?.ok) sincronizacionesHechas.add(texto);
};

/**
 * Lista de comerciales para el selector de "responsable de venta": primero se
 * sincroniza el directorio de KontrolIA Auth hacia `sales`, y después se
 * consulta la base local como cualquier otro recurso, conservando filtros,
 * orden y paginación nativos.
 */
const getSalesList = async (
  baseDataProvider: DataProvider,
  params: GetListParams,
) => {
  const { q, ...filtro } = params.filter ?? {};
  const texto = typeof q === "string" ? q.trim() : "";

  await sincronizarComerciales(texto);

  // El buscador del selector manda `q`, que en la tabla sales no tiene una
  // columna de texto completo: se traduce a un OR sobre nombre y correo.
  const filtroConBusqueda = texto
    ? {
        ...filtro,
        "@or": {
          "first_name@ilike": texto,
          "last_name@ilike": texto,
          "email@ilike": texto,
        },
      }
    : filtro;

  return baseDataProvider.getList("sales", {
    ...params,
    filter: filtroConBusqueda,
  });
};

// La configuración es una fila por organización, y el RLS ya limita la tabla
// a la organización activa. Por eso no se pide por id (antes era el singleton
// `id: 1`): se pide la única fila visible, y así el frontend no necesita
// conocer el identificador de la organización.
const leerConfiguracion = async (): Promise<ConfigurationContextValue> => {
  const { data, error } = await getSupabaseClient()
    .from("configuration")
    .select("config")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.config as ConfigurationContextValue) ?? {};
};

const guardarConfiguracion = async (
  config: ConfigurationContextValue,
): Promise<ConfigurationContextValue> => {
  // Los logos se procesan aquí y no en un callback de ciclo de vida del
  // data provider: al escribir con el cliente de Supabase directamente,
  // esos callbacks no se ejecutan.
  const configConLogos: ConfigurationContextValue = {
    ...config,
    lightModeLogo: await processConfigLogo(config.lightModeLogo),
    darkModeLogo: await processConfigLogo(config.darkModeLogo),
  };

  // Se usa upsert sin indicar organization_id: lo rellena el valor por
  // defecto de la columna a partir del token, de modo que un cliente no
  // puede escribir en la configuración de otra organización.
  const { data, error } = await getSupabaseClient()
    .from("configuration")
    .upsert({ config: configConLogos }, { onConflict: "organization_id" })
    .select("config")
    .single();

  if (error) {
    throw error;
  }

  return data.config as ConfigurationContextValue;
};

const getDataProviderWithCustomMethods = () => {
  const baseDataProvider = getBaseDataProvider();

  return {
    ...baseDataProvider,
    async getList(resource: string, params: GetListParams) {
      if (resource === "companies") {
        return baseDataProvider.getList("companies_summary", params);
      }
      if (resource === "contacts") {
        return baseDataProvider.getList("contacts_summary", params);
      }
      if (resource === "sales") {
        return getSalesList(baseDataProvider, params);
      }
      if (resource === "activity_log") {
        const { data, total } = await baseDataProvider.getList(
          "activity_log",
          params,
        );
        // Rename snake_case view columns to camelCase to match Activity type
        return {
          data: data.map((row: any) => ({
            ...row,
            contactNote: row.contact_note ?? undefined,
            dealNote: row.deal_note ?? undefined,
            contact_note: undefined,
            deal_note: undefined,
          })),
          total,
        };
      }

      return baseDataProvider.getList(resource, params);
    },
    async getOne(resource: string, params: any) {
      if (resource === "companies") {
        return baseDataProvider.getOne("companies_summary", params);
      }
      if (resource === "contacts") {
        return baseDataProvider.getOne("contacts_summary", params);
      }
      // La configuración es una fila por organización SIN columna id (su
      // clave es organization_id, que impone el RLS/puente). La página de
      // Ajustes edita con un id sintético; pedir `id=eq.1` a la base
      // devolvía 400 desde la multi-tenencia.
      if (resource === "configuration") {
        const config = await leerConfiguracion();
        return { data: { id: params.id, config } as any };
      }

      return baseDataProvider.getOne(resource, params);
    },
    async update(resource: string, params: any) {
      if (resource === "configuration") {
        const config = await guardarConfiguracion(params.data.config);
        return { data: { id: params.id, config } as any };
      }
      return baseDataProvider.update(resource, params);
    },

    async signUp({ email, password, first_name, last_name }: SignUpData) {
      const response = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
          },
        },
      });

      if (!response.data?.user || response.error) {
        console.error("signUp.error", response.error);
        throw new Error(response?.error?.message || "Failed to create account");
      }

      // Update the is initialized cache
      (getIsInitialized as any)._is_initialized_cache = true;

      return {
        id: response.data.user.id,
        email,
        password,
      };
    },
    /**
     * Actualiza la ficha del comercial.
     *
     * Antes pasaba por la edge function `users`, que ademas creaba y
     * desactivaba cuentas. Eso es competencia de KontrolIA Auth, asi que la
     * funcion desaparecio y aqui solo queda lo que si es del CRM: el avatar y
     * los datos de la ficha. El puente impone la organizacion, de modo que no
     * se puede tocar la ficha de otra empresa.
     */
    async salesUpdate(
      id: Identifier,
      data: Partial<Omit<SalesFormData, "password">>,
    ) {
      const { first_name, last_name, avatar } = data;

      const { data: actualizado, error } = await getSupabaseClient()
        .from("sales")
        .update({ first_name, last_name, avatar })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("salesUpdate.error", error);
        throw new Error("No se pudo actualizar la ficha.");
      }

      return actualizado as Sale;
    },
    async unarchiveDeal(deal: Deal) {
      // get all deals where stage is the same as the deal to unarchive
      const { data: deals } = await baseDataProvider.getList<Deal>("deals", {
        filter: { stage: deal.stage, pipeline: deal.pipeline },
        pagination: { page: 1, perPage: 1000 },
        sort: { field: "index", order: "ASC" },
      });

      // set index for each deal starting from 1, if the deal to unarchive is found, set its index to the last one
      const updatedDeals = deals.map((d, index) => ({
        ...d,
        index: d.id === deal.id ? 0 : index + 1,
        archived_at: d.id === deal.id ? null : d.archived_at,
      }));

      return await Promise.all(
        updatedDeals.map((updatedDeal) =>
          baseDataProvider.update("deals", {
            id: updatedDeal.id,
            data: updatedDeal,
            previousData: deals.find((d) => d.id === updatedDeal.id),
          }),
        ),
      );
    },
    async isInitialized() {
      return getIsInitialized();
    },
    async mergeContacts(sourceId: Identifier, targetId: Identifier) {
      const { data, error } = await getSupabaseClient().functions.invoke(
        "merge_contacts",
        {
          method: "POST",
          body: { loserId: sourceId, winnerId: targetId },
        },
      );

      if (error) {
        console.error("merge_contacts.error", error);
        throw new Error("Failed to merge contacts");
      }

      return data;
    },
    async getConfiguration(): Promise<ConfigurationContextValue> {
      return leerConfiguracion();
    },
    async updateConfiguration(
      config: ConfigurationContextValue,
    ): Promise<ConfigurationContextValue> {
      return guardarConfiguracion(config);
    },
  } satisfies DataProvider;
};

export type CrmDataProvider = ReturnType<
  typeof getDataProviderWithCustomMethods
>;

const processConfigLogo = async (logo: any): Promise<string> => {
  if (typeof logo === "string") return logo;
  if (logo?.rawFile instanceof File) {
    await uploadToBucket(logo);
    return logo.src;
  }
  return logo?.src ?? "";
};

const lifeCycleCallbacks: ResourceCallbacks[] = [
  {
    resource: "contact_notes",
    beforeSave: async (data: ContactNote, _, __) => {
      if (data.attachments) {
        data.attachments = await Promise.all(
          data.attachments.map((fi) => uploadToBucket(fi)),
        );
      }
      return data;
    },
  },
  {
    resource: "deal_notes",
    beforeSave: async (data: DealNote, _, __) => {
      if (data.attachments) {
        data.attachments = await Promise.all(
          data.attachments.map((fi) => uploadToBucket(fi)),
        );
      }
      return data;
    },
  },
  {
    resource: "sales",
    beforeSave: async (data: Sale, _, __) => {
      if (data.avatar) {
        await uploadToBucket(data.avatar);
      }
      return data;
    },
  },
  {
    resource: "contacts",
    beforeGetList: async (params) => {
      return applyFullTextSearch([
        "first_name",
        "last_name",
        "company_name",
        "title",
        "email",
        "phone",
        "background",
      ])(params);
    },
  },
  {
    resource: "companies",
    beforeGetList: async (params) => {
      return applyFullTextSearch([
        "name",
        "phone_number",
        "website",
        "zipcode",
        "city",
        "state_abbr",
      ])(params);
    },
    beforeCreate: async (params) => {
      const createParams = await processCompanyLogo(params);

      return {
        ...createParams,
        data: {
          created_at: new Date().toISOString(),
          ...createParams.data,
        },
      };
    },
    beforeUpdate: async (params) => {
      return await processCompanyLogo(params);
    },
  },
  {
    resource: "contacts_summary",
    beforeGetList: async (params) => {
      return applyFullTextSearch(["first_name", "last_name"])(params);
    },
  },
  {
    resource: "deals",
    beforeGetList: async (params) => {
      return applyFullTextSearch(["name", "category", "description"])(params);
    },
  },
];

export const getDataProvider = () => {
  // Comprobación por valor vacío y no por `undefined`: la configuración
  // devuelve cadena vacía cuando la variable no está definida.
  if (!env.supabaseUrl) {
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL. Ejecuta el instalador para configurar la base de datos.",
    );
  }
  if (!env.supabasePublishableKey) {
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SB_PUBLISHABLE_KEY. Ejecuta el instalador para configurar la base de datos.",
    );
  }
  return withLifecycleCallbacks(
    getDataProviderWithCustomMethods(),
    lifeCycleCallbacks,
  ) as CrmDataProvider;
};

const applyFullTextSearch = (columns: string[]) => (params: GetListParams) => {
  if (!params.filter?.q) {
    return params;
  }
  const { q, ...filter } = params.filter;
  return {
    ...params,
    filter: {
      ...filter,
      "@or": columns.reduce((acc, column) => {
        if (column === "email")
          return {
            ...acc,
            [`email_fts@ilike`]: q,
          };
        if (column === "phone")
          return {
            ...acc,
            [`phone_fts@ilike`]: q,
          };
        else
          return {
            ...acc,
            [`${column}@ilike`]: q,
          };
      }, {}),
    },
  };
};

const uploadToBucket = async (fi: RAFile) => {
  if (!fi.src.startsWith("blob:") && !fi.src.startsWith("data:")) {
    // Sign URL check if path exists in the bucket
    if (fi.path) {
      const { error } = await getSupabaseClient()
        .storage.from(ATTACHMENTS_BUCKET)
        .createSignedUrl(fi.path, 60);

      if (!error) {
        return fi;
      }
    }
  }

  const dataContent = fi.src
    ? await fetch(fi.src)
        .then((res) => {
          if (res.status !== 200) {
            return null;
          }
          return res.blob();
        })
        .catch(() => null)
    : fi.rawFile;

  if (dataContent == null) {
    // We weren't able to download the file from its src (e.g. user must be signed in on another website to access it)
    // or the file has no content (not probable)
    // In that case, just return it as is: when trying to download it, users should be redirected to the other website
    // and see they need to be signed in. It will then be their responsibility to upload the file back to the note.
    return fi;
  }

  const file = fi.rawFile;
  const fileParts = file.name.split(".");
  const fileExt = fileParts.length > 1 ? `.${file.name.split(".").pop()}` : "";
  const fileName = `${Math.random()}${fileExt}`;
  const filePath = `${fileName}`;
  const { error: uploadError } = await getSupabaseClient()
    .storage.from(ATTACHMENTS_BUCKET)
    .upload(filePath, dataContent);

  if (uploadError) {
    console.error("uploadError", uploadError);
    throw new Error("Failed to upload attachment");
  }

  const { data } = getSupabaseClient()
    .storage.from(ATTACHMENTS_BUCKET)
    .getPublicUrl(filePath);

  fi.path = filePath;
  fi.src = data.publicUrl;

  // save MIME type
  const mimeType = file.type;
  fi.type = mimeType;

  return fi;
};
