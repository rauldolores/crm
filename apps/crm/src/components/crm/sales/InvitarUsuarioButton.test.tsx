import React from "react";
import { render } from "vitest-browser-react";
import { CoreAdminContext } from "ra-core";
import fakeDataProvider from "ra-data-fakerest";

vi.mock("@/lib/kontrolia-auth/equipo", () => ({
  organizacionActivaId: vi.fn(),
  listarRolesDisponibles: vi.fn(),
  invitarATuOrganizacion: vi.fn(),
}));

import {
  invitarATuOrganizacion,
  listarRolesDisponibles,
  organizacionActivaId,
} from "@/lib/kontrolia-auth/equipo";
import { InvitarUsuarioButton } from "./InvitarUsuarioButton";

const organizacionActivaIdMock = vi.mocked(organizacionActivaId);
const listarRolesDisponiblesMock = vi.mocked(listarRolesDisponibles);
const invitarATuOrganizacionMock = vi.mocked(invitarATuOrganizacion);

const traducciones: Record<string, string> = {
  "crm.team.invite_action": "Invitar",
  "crm.team.dialog_title": "Invitar a tu organización",
  "crm.team.dialog_description":
    "Se le enviará un correo de invitación con el rol que elijas.",
  "crm.team.email_field": "Correo electrónico",
  "crm.team.role_field": "Rol",
  "crm.team.role_placeholder": "Elige un rol",
  "crm.team.loading_roles": "Cargando roles…",
  "crm.team.no_roles": "Tu organización todavía no tiene roles para invitar.",
  "crm.team.cancel": "Cancelar",
  "crm.team.send": "Enviar invitación",
  "crm.team.sending": "Enviando…",
  "crm.team.success": "Invitación enviada",
  "crm.team.error": "No se pudo enviar la invitación",
  "crm.team.error_loading_roles":
    "No se pudieron cargar los roles de tu organización",
  "crm.team.no_organization": "Tu cuenta no tiene una organización activa.",
};

const authProvider = {
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  checkError: () => Promise.resolve(),
  getIdentity: () => Promise.resolve({ id: "1", fullName: "Raúl Dolores" }),
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
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
);

describe("InvitarUsuarioButton", () => {
  beforeEach(() => {
    organizacionActivaIdMock.mockReset().mockResolvedValue("org-1");
    listarRolesDisponiblesMock.mockReset().mockResolvedValue([
      { id: "r1", name: "Administrador", slug: "admin", application_id: null },
      { id: "r2", name: "Usuario", slug: "usuario", application_id: null },
    ]);
    invitarATuOrganizacionMock.mockReset().mockResolvedValue(undefined);
  });

  it("carga los roles de la organización activa al abrir el diálogo", async () => {
    // Arrange & Act
    const screen = await render(<InvitarUsuarioButton />, {
      wrapper: Wrapper,
    });
    await screen.getByText("Invitar").click();
    await screen.getByLabelText("Rol").click();

    // Assert
    await expect
      .element(screen.getByRole("option", { name: "Administrador" }))
      .toBeInTheDocument();
    expect(listarRolesDisponiblesMock).toHaveBeenCalledWith("org-1");
  });

  it("no deja enviar sin correo ni rol elegido", async () => {
    const screen = await render(<InvitarUsuarioButton />, {
      wrapper: Wrapper,
    });
    await screen.getByText("Invitar").click();

    await expect.element(screen.getByText("Enviar invitación")).toBeDisabled();
  });

  it("invita con el correo y el rol elegidos, y cierra el diálogo", async () => {
    const screen = await render(<InvitarUsuarioButton />, {
      wrapper: Wrapper,
    });
    await screen.getByText("Invitar").click();
    await screen.getByLabelText("Correo electrónico").fill("nuevo@empresa.com");
    await screen.getByLabelText("Rol").click();
    await screen.getByRole("option", { name: "Usuario" }).click();
    await screen.getByText("Enviar invitación").click();

    await expect
      .element(screen.getByLabelText("Correo electrónico"))
      .not.toBeInTheDocument();
    expect(invitarATuOrganizacionMock).toHaveBeenCalledWith({
      organizationId: "org-1",
      email: "nuevo@empresa.com",
      roleId: "r2",
    });
  });

  it("cierra el diálogo sin consultar roles cuando no hay organización activa", async () => {
    organizacionActivaIdMock.mockResolvedValue(null);
    const screen = await render(<InvitarUsuarioButton />, {
      wrapper: Wrapper,
    });

    await screen.getByText("Invitar").click();

    await expect
      .element(screen.getByText("Invitar a tu organización"))
      .not.toBeInTheDocument();
    expect(listarRolesDisponiblesMock).not.toHaveBeenCalled();
  });
});
