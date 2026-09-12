import { User } from "lucide-react";
import { useTranslate, useUserMenu } from "ra-core";
import { Link } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { SelectorDeOrganizacion } from "./SelectorDeOrganizacion";
import { UserMenu } from "@/components/admin/user-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { BotonDeAyuda } from "../ayuda/BotonDeAyuda";

/**
 * Cabecera superior del escritorio.
 *
 * No lleva logo ni nombre: eso vive en la barra lateral y duplicarlo aquí era
 * ruido. A la izquierda queda el destino `#breadcrumb`, donde cada página
 * proyecta su rastro de navegación (el componente Breadcrumb usa un portal);
 * a la derecha, lo contextual: organización, tema, refresco y perfil.
 *
 * El menú del avatar solo lleva Perfil (y Cerrar sesión, que pone
 * <UserMenu> solo): es lo único que es sobre LA PERSONA que inició sesión.
 * Antes vivían aquí también Usuarios, Ajustes, Automatizaciones, Formularios,
 * API, Módulos, Correo, Plantillas, IA, Plan y facturación e Importar — una
 * lista plana de 11 destinos casi todos sobre LA ORGANIZACIÓN, no sobre la
 * persona, mezclados con lo personal y sin ningún orden. Usuarios y
 * Plantillas ya estaban duplicados con la barra lateral. Ahora cada uno vive
 * donde corresponde: Usuarios, Plantillas e Importar en la barra lateral
 * junto a los demás recursos; Automatizaciones, Formularios, API, Módulos,
 * Correo e IA dentro de Ajustes (un solo destino de la barra lateral); Plan y
 * facturación en el pie de la barra lateral, junto al consumo del plan. Ver
 * BarraLateral.tsx y HerramientasDeAdministracion.tsx.
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
          <BotonDeAyuda />
          <ThemeModeToggle />
          <RefreshButton />
          <UserMenu>
            <ProfileMenu />
          </UserMenu>
        </div>
      </div>
    </header>
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

export default Header;
