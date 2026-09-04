/* eslint-disable react-refresh/only-export-components */
import { memoryStore, type AuthProvider } from "ra-core";
import { useEffect, useMemo, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import cloneDeep from "lodash/cloneDeep";
import { Notification } from "@/components/admin/notification";
import { createDataProvider } from "@/components/crm/providers/fakerest";
import { DEFAULT_USER } from "@/components/crm/providers/fakerest/authProvider";
import type { Db } from "@/components/crm/providers/fakerest/dataGenerator/types";
import type { Contact, Sale } from "@/components/crm/types";
import { CRM } from "@/components/crm/root/CRM";
import {
  CONFIGURATION_STORE_KEY,
  type ConfigurationContextValue,
} from "@/components/crm/root/ConfigurationContext";
import { defaultConfiguration } from "@/components/crm/root/defaultConfiguration";
import { testI18nProvider } from "@/components/crm/providers/commons/i18nProvider";

export const createTestAuthProvider = (): AuthProvider => ({
  canAccess: async () => true,
  checkAuth: async () => undefined,
  checkError: async () => undefined,
  getIdentity: async () => ({
    avatar: DEFAULT_USER.avatar.src,
    fullName: `${DEFAULT_USER.first_name} ${DEFAULT_USER.last_name}`,
    id: DEFAULT_USER.id,
  }),
  login: async () => undefined,
  logout: async () => undefined,
});

const baseSale: Sale = {
  administrator: true,
  avatar: DEFAULT_USER.avatar as Sale["avatar"],
  disabled: false,
  email: DEFAULT_USER.email,
  first_name: DEFAULT_USER.first_name,
  id: DEFAULT_USER.id,
  last_name: DEFAULT_USER.last_name,
  password: DEFAULT_USER.password,
  user_id: DEFAULT_USER.id.toString(),
};

// Provide a minimal FakeRest database shape so tests can override only the records
// that matter for each scenario.
export const createCrmDb = (overrides: Partial<Db> = {}): Db =>
  ({
    companies: [],
    configuration: [{ config: {}, id: 1 }],
    contact_notes: [],
    contacts: [],
    deal_notes: [],
    deals: [],
    sales: [baseSale],
    tags: [],
    tasks: [],
    ...overrides,
  }) as Db;

// Build a valid contact record with sensible defaults to keep tests and stories terse.
export const buildContact = (overrides: Partial<Contact> = {}): Contact => ({
  background: "",
  company_id: null,
  company_name: undefined,
  email_jsonb: [{ email: "ada@example.com", type: "Work" }],
  first_name: "Ada",
  first_seen: "2025-01-01T09:00:00.000Z",
  gender: "female",
  has_newsletter: false,
  id: 1,
  last_name: "Lovelace",
  last_seen: "2025-01-02T10:00:00.000Z",
  linkedin_url: null,
  nb_tasks: 0,
  phone_jsonb: [],
  sales_id: 0,
  status: "warm",
  tags: [],
  title: "CTO",
  ...overrides,
});

export const StoryWrapper = ({
  children,
  configuration,
  data,
  dataProvider: dataProviderOverrides,
  initialEntries,
  silent = process.env.NODE_ENV === "test",
}: {
  children: ReactNode;
  /**
   * Configuración de la organización (embudos, monedas, módulos…). Se siembra
   * en el store porque `useConfigurationLoader`, que es quien la traería de la
   * base, vive en el layout real y aquí se reemplaza por uno de prueba.
   */
  configuration?: Partial<ConfigurationContextValue>;
  data?: Partial<Db>;
  dataProvider?: Partial<ReturnType<typeof createDataProvider>>;
  initialEntries?: string[];
  silent?: boolean;
}) => {
  const authProvider = useMemo(() => createTestAuthProvider(), []);
  const dataProvider = useMemo(
    () => ({
      ...createDataProvider({ db: createCrmDb(cloneDeep(data)), silent }),
      ...dataProviderOverrides,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // Va como valor INICIAL del store, no con un setItem posterior: memoryStore
  // reinicia su contenido a `initialStorage` dentro de setup(), así que
  // cualquier escritura previa se perdería. Sembrada aquí, <CRM> ve el store
  // ya lleno y no la pisa con la configuración por defecto.
  const store = useMemo(
    () =>
      memoryStore(
        configuration
          ? {
              [CONFIGURATION_STORE_KEY]: {
                ...defaultConfiguration,
                ...configuration,
              },
            }
          : undefined,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    // Clear localStorage on mount to prevent data pollution from previous story / test, since we persist react-query cache in localStorage.
    localStorage.clear();
  }, []);

  return (
    <MemoryRouter initialEntries={initialEntries}>
      <CRM
        authProvider={authProvider}
        dataProvider={dataProvider}
        i18nProvider={testI18nProvider}
        dashboard={() => <>{children}</>}
        store={store}
        layout={({ children }) => (
          <>
            {children}
            <Notification />
          </>
        )}
      />
    </MemoryRouter>
  );
};
