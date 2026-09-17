import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";
import { MemoryRouter } from "react-router";

vi.mock("@/lib/kontrolia-auth/organizaciones", () => ({
  listarMisOrganizaciones: vi.fn(),
  crearOrganizacion: vi.fn(),
  renombrarOrganizacion: vi.fn(),
  usuarioActivoId: vi.fn().mockResolvedValue("yo"),
  esAdministradorDe: (roles: string[]) =>
    roles.includes("owner") || roles.includes("admin"),
}));
vi.mock("@/lib/kontrolia-auth/equipo", () => ({
  organizacionActivaId: vi.fn().mockResolvedValue("org-1"),
  listarMiembros: vi.fn().mockResolvedValue([]),
  listarInvitaciones: vi.fn().mockResolvedValue([]),
  listarRolesDisponibles: vi.fn().mockResolvedValue([]),
  invitarATuOrganizacion: vi.fn(),
  quitarMiembro: vi.fn(),
  revocarInvitacion: vi.fn(),
}));
vi.mock("@/lib/kontrolia-auth/client", () => ({
  switchKontroliaOrganization: vi.fn().mockResolvedValue(undefined),
  getKontroliaClient: () => null,
  getKontroliaAccessToken: vi.fn().mockResolvedValue(null),
  getKontroliaMemberships: vi.fn().mockResolvedValue([]),
  logoutKontroliaAuth: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/kontrolia-auth/config", () => ({
  isKontroliaAuthConfigured: () => false,
}));
vi.mock("./navegacion", () => ({ recargarEnLaRaiz: vi.fn() }));
vi.mock("../root/ConfigurationContext", () => ({
  useConfigurationContext: () => ({ title: "Vinqulia", darkModeLogo: "" }),
}));

import { switchKontroliaOrganization } from "@/lib/kontrolia-auth/client";
import {
  crearOrganizacion,
  listarMisOrganizaciones,
} from "@/lib/kontrolia-auth/organizaciones";
import { OrganizacionesPage } from "./OrganizacionesPage";

const listarMock = vi.mocked(listarMisOrganizaciones);
const crearMock = vi.mocked(crearOrganizacion);
const switchMock = vi.mocked(switchKontroliaOrganization);

const traducciones: Record<string, string> = {
  "crm.organizations.title": "Organizaciones",
  "crm.organizations.yours_title": "Tus organizaciones",
  "crm.organizations.active": "Activa",
  "crm.organizations.switch": "Cambiar",
  "crm.organizations.rename": "Renombrar",
  "crm.organizations.role_owner": "Owner",
  "crm.organizations.role_member": "Miembro",
  "crm.organizations.new_action": "Nueva organización",
  "crm.organizations.new_dialog_title": "Nueva organización",
  "crm.organizations.name_field": "Nombre de la organización",
  "crm.organizations.create": "Crear",
  "crm.organizations.creating": "Creando…",
  "crm.team.members_title": "Miembros",
  "crm.team.no_members": "Todavía no hay miembros.",
  "crm.team.invitations_title": "Invitaciones",
  "crm.team.no_invitations": "No hay invitaciones pendientes.",
  "crm.team.invite_action": "Invitar",
  "crm.team.only_admins": "Solo un Owner o Admin puede invitar.",
};

const authProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getIdentity: () => Promise.resolve({ id: "1", fullName: "Raúl" }),
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <CoreAdminContext
      dataProvider={fakeDataProvider({})}
      authProvider={authProvider}
      i18nProvider={{
        translate: (key, options) => traducciones[key] ?? options?._ ?? key,
        changeLocale: () => Promise.resolve(),
        getLocale: () => "es",
      }}
    >
      {children}
    </CoreAdminContext>
  </MemoryRouter>
);

const membresias = [
  {
    membershipId: "m1",
    organizacion: { id: "org-1", nombre: "Kontrolia", slug: "kontrolia" },
    roles: ["owner"],
    estado: "active",
  },
  {
    membershipId: "m2",
    organizacion: { id: "org-2", nombre: "Prueba", slug: "prueba" },
    roles: [],
    estado: "active",
  },
];

describe("OrganizacionesPage", () => {
  beforeEach(() => {
    listarMock.mockReset().mockResolvedValue(membresias);
    crearMock.mockReset();
    switchMock.mockClear();
  });

  it("lista las organizaciones, marca la activa y ofrece cambiar a las demás", async () => {
    // Arrange & Act
    const screen = await render(<OrganizacionesPage />, { wrapper: Wrapper });

    // Assert
    await expect.element(screen.getByText("Kontrolia")).toBeInTheDocument();
    await expect.element(screen.getByText("Activa")).toBeInTheDocument();
    await expect.element(screen.getByText("Prueba")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Cambiar" }))
      .toBeInTheDocument();
  });

  it("como Owner de la activa ofrece invitar; el equipo se muestra para la organización activa", async () => {
    const screen = await render(<OrganizacionesPage />, { wrapper: Wrapper });

    await expect
      .element(screen.getByRole("heading", { name: "Miembros" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Invitar" }))
      .toBeInTheDocument();
  });

  it("crea una organización nueva y cambia a ella", async () => {
    crearMock.mockResolvedValue({
      organizacion: { id: "org-3", nombre: "Mi empresa", slug: "mi-empresa-1" },
    });
    const screen = await render(<OrganizacionesPage />, { wrapper: Wrapper });

    await screen.getByRole("button", { name: "Nueva organización" }).click();
    await screen.getByLabelText("Nombre de la organización").fill("Mi empresa");
    await screen.getByRole("button", { name: "Crear" }).click();

    await vi.waitFor(() => {
      expect(crearMock).toHaveBeenCalledWith("Mi empresa");
      expect(switchMock).toHaveBeenCalledWith("org-3");
    });
  });
});
