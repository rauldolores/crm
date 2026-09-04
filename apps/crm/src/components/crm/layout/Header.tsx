import {
  Blocks,
  Globe,
  Import,
  Settings,
  User,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import { CanAccess, useTranslate, useUserMenu } from "ra-core";
import { Link } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { SelectorDeOrganizacion } from "./SelectorDeOrganizacion";
import { UserMenu } from "@/components/admin/user-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { ImportPage } from "../misc/ImportPage";
import { ApiPage } from "../misc/ApiPage";
import { AutomatizacionesPage } from "../misc/AutomatizacionesPage";
import { FormulariosPage } from "../misc/FormulariosPage";
import { CatalogoPage } from "../modules/CatalogoPage";

/**
 * Cabecera superior del escritorio.
 *
 * No lleva logo ni nombre: eso vive en la barra lateral y duplicarlo aquí era
 * ruido. A la izquierda queda el destino `#breadcrumb`, donde cada página
 * proyecta su rastro de navegación (el componente Breadcrumb usa un portal);
 * a la derecha, lo contextual: organización, tema, refresco y perfil.
 *
 * Ojo con envolverla en un contenedor con `grow`: dentro de la columna flex
 * del layout absorbía todo el alto libre y dejaba un hueco enorme sobre el
 * contenido de todas las pantallas.
 */
const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between gap-4 px-4">
        <div
          id="breadcrumb"
          className="flex min-w-0 items-center [&>[data-orientation=vertical]:first-child]:hidden"
        />
        <div className="flex items-center">
          <SelectorDeOrganizacion />
          <ThemeModeToggle />
          <RefreshButton />
          <UserMenu>
            <ProfileMenu />
            <CanAccess resource="sales" action="list">
              <UsersMenu />
            </CanAccess>
            <CanAccess resource="configuration" action="edit">
              <SettingsMenu />
            </CanAccess>
            <CanAccess resource="configuration" action="edit">
              <AutomatizacionesMenu />
            </CanAccess>
            <CanAccess resource="configuration" action="edit">
              <FormulariosMenu />
            </CanAccess>
            <CanAccess resource="configuration" action="edit">
              <ApiMenu />
            </CanAccess>
            <CanAccess resource="configuration" action="edit">
              <ModulosMenu />
            </CanAccess>
            <ImportFromJsonMenuItem />
          </UserMenu>
        </div>
      </div>
    </header>
  );
};

const UsersMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<UsersMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/sales" className="flex items-center gap-2">
        <Users />
        {translate("resources.sales.name", { smart_count: 2 })}
      </Link>
    </DropdownMenuItem>
  );
};

const ProfileMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ProfileMenu> must be used inside <UserMenu?");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/profile" className="flex items-center gap-2">
        <User />
        {translate("crm.profile.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const SettingsMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<SettingsMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to="/settings" className="flex items-center gap-2">
        <Settings />
        {translate("crm.settings.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const AutomatizacionesMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<AutomatizacionesMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={AutomatizacionesPage.path} className="flex items-center gap-2">
        <Zap />
        {translate("crm.automations.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const FormulariosMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<FormulariosMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={FormulariosPage.path} className="flex items-center gap-2">
        <Globe />
        {translate("crm.public_forms.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const ApiMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ApiMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={ApiPage.path} className="flex items-center gap-2">
        <Webhook />
        {translate("crm.api.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const ModulosMenu = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ModulosMenu> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={CatalogoPage.path} className="flex items-center gap-2">
        <Blocks />
        {translate("crm.modules.title")}
      </Link>
    </DropdownMenuItem>
  );
};

const ImportFromJsonMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (!userMenuContext) {
    throw new Error("<ImportFromJsonMenuItem> must be used inside <UserMenu>");
  }
  return (
    <DropdownMenuItem asChild onClick={userMenuContext.onClose}>
      <Link to={ImportPage.path} className="flex items-center gap-2">
        <Import />
        {translate("crm.header.import_data")}
      </Link>
    </DropdownMenuItem>
  );
};

export default Header;
