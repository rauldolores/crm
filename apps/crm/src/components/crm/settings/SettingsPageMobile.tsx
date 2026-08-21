import { env } from "@/lib/env";
import { useOrganizaciones } from "../layout/SelectorDeOrganizacion";
import { useTheme } from "@/components/admin/use-theme";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, Copy, LogOut, Moon, Smartphone, Sun } from "lucide-react";
import {
  Form,
  Translate,
  useAuthProvider,
  useDataProvider,
  useGetIdentity,
  useGetOne,
  useLogout,
  useNotify,
  useTranslate,
} from "ra-core";
import { useCallback, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { MobileContent } from "../layout/MobileContent";
import MobileHeader from "../layout/MobileHeader";
import ImageEditorField from "../misc/ImageEditorField";
import type { CrmDataProvider } from "../providers/types";
import type { SalesFormData } from "../types";

export const SettingsPageMobile = () => {
  const translate = useTranslate();
  const authProvider = useAuthProvider();
  const logout = useLogout();

  if (!authProvider) return null;

  return (
    <>
      <MobileHeader>
        <h1 className="text-xl font-semibold">
          {translate("crm.settings.title")}
        </h1>
      </MobileHeader>
      <MobileContent>
        <div className="flex flex-col min-h-[calc(100dvh-3.5rem-4.5rem)]">
          <div className="space-y-6">
            <ProfileSection />
            <PreferencesSection />
            <InboundEmailSection />
            <McpServerSection />
          </div>

          <div className="mt-auto pt-6 space-y-3 mb-4">
            <Button
              variant="destructive"
              className="w-full text-base h-auto"
              onClick={() => logout()}
            >
              <LogOut className="size-5 mr-3" />
              <Translate i18nKey="ra.auth.logout">Log out</Translate>
            </Button>
          </div>
        </div>
      </MobileContent>
    </>
  );
};

SettingsPageMobile.path = "/settings";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
    {children}
  </p>
);

const ProfileSection = () => {
  const { identity, refetch: refetchIdentity } = useGetIdentity();
  const { data, refetch: refetchUser } = useGetOne("sales", {
    id: identity?.id,
  });
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const handleAvatarUpdate = useCallback(
    async (values: SalesFormData) => {
      if (!data) return;
      try {
        await dataProvider.salesUpdate(data.id, values);
        refetchIdentity();
        refetchUser();
        notify("crm.profile.updated", {
          messageArgs: { _: "Your profile has been updated" },
        });
      } catch {
        notify("crm.profile.update_error", {
          type: "error",
          messageArgs: { _: "An error occurred. Please try again." },
        });
      }
    },
    [data, dataProvider, refetchIdentity, refetchUser, notify],
  );

  if (!identity || !data) return null;

  return (
    <div>
      <SectionLabel>
        {translate("crm.profile.title", { _: "Profile" })}
      </SectionLabel>
      <ItemGroup className="rounded-lg border overflow-hidden">
        <Form record={data}>
          <Item size="sm">
            <ItemContent>
              <ImageEditorField
                source="avatar"
                type="avatar"
                onSave={handleAvatarUpdate}
                linkPosition="right"
              />
            </ItemContent>
          </Item>
        </Form>

        <ItemSeparator />

        <ReadOnlyRow
          label={translate("resources.sales.fields.first_name")}
          value={data.first_name ?? ""}
        />

        <ItemSeparator />

        <ReadOnlyRow
          label={translate("resources.sales.fields.last_name")}
          value={data.last_name ?? ""}
        />

        <ItemSeparator />

        <ReadOnlyRow
          label={translate("resources.sales.fields.email")}
          value={data.email ?? ""}
        />
      </ItemGroup>
    </div>
  );
};

/**
 * Nombre y correo son de solo lectura: la identidad vive en KontrolIA Auth,
 * no en el CRM. Editarlos aquí solo desincronizaría la ficha del comercial
 * de la cuenta real.
 */
const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => (
  <Item size="sm">
    <ItemContent>
      <ItemTitle className="font-normal text-muted-foreground">
        {label}
      </ItemTitle>
    </ItemContent>
    <ItemActions>
      <span className="text-base">{value}</span>
    </ItemActions>
  </Item>
);

const PreferencesSection = () => {
  const translate = useTranslate();

  return (
    <div>
      <SectionLabel>
        {translate("crm.settings.preferences", { _: "Preferences" })}
      </SectionLabel>
      <ItemGroup className="rounded-lg border overflow-hidden">
        <OrganizacionRow />
        <ThemeRow />
      </ItemGroup>
    </div>
  );
};

/**
 * Equivalente movil del selector de la cabecera. Comparte el mismo hook para
 * que ambas vistas se comporten igual, y vive junto al tema porque es su
 * vecino en el escritorio.
 */
const OrganizacionRow = () => {
  const { organizaciones, activa, cambiando, cambiar } = useOrganizaciones();

  if (organizaciones.length <= 1) return null;

  return (
    <Item size="sm">
      <ItemContent>
        <ItemTitle className="font-normal text-muted-foreground">
          Organización
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        <ToggleGroup
          type="single"
          value={activa ?? undefined}
          onValueChange={(valor) => valor && cambiar(valor)}
          disabled={cambiando}
          className="flex-wrap justify-end"
        >
          {organizaciones.map((organizacion) => (
            <ToggleGroupItem
              key={organizacion.id}
              value={organizacion.id}
              className="text-xs"
            >
              {organizacion.nombre}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ItemActions>
    </Item>
  );
};

const ThemeRow = () => {
  const translate = useTranslate();
  const { theme, setTheme } = useTheme();

  return (
    <Item size="sm" className="flex-col items-stretch gap-2">
      <ItemTitle className="font-normal text-muted-foreground">
        {translate("crm.theme.label", { _: "Theme" })}
      </ItemTitle>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) =>
          value && setTheme(value as "light" | "dark" | "system")
        }
        size="lg"
        variant="outline"
        className="w-full"
      >
        <ToggleGroupItem
          value="system"
          aria-label={translate("crm.theme.system")}
          className="flex-1 gap-2"
        >
          <Smartphone className="size-4" />
          {translate("crm.theme.system")}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="light"
          aria-label={translate("crm.theme.light")}
          className="flex-1 gap-2"
        >
          <Sun className="size-4" />
          {translate("crm.theme.light")}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="dark"
          aria-label={translate("crm.theme.dark")}
          className="flex-1 gap-2"
        >
          <Moon className="size-4" />
          {translate("crm.theme.dark")}
        </ToggleGroupItem>
      </ToggleGroup>
    </Item>
  );
};

const InboundEmailSection = () => {
  const translate = useTranslate();

  if (!env.inboundEmail) return null;

  return (
    <div>
      <SectionLabel>{translate("crm.profile.inbound.title")}</SectionLabel>
      <p className="text-sm text-muted-foreground mb-2 px-1">
        {translate("crm.profile.inbound.description", {
          _: "You can start sending emails to your server's inbound email address, e.g. by adding it to the Cc: field. Vinqulia will process the emails and add notes to the corresponding contacts.",
          field: "Cc:",
        })}
      </p>
      <ItemGroup className="rounded-lg border overflow-hidden">
        <CopyPasteRow value={env.inboundEmail} />
      </ItemGroup>
    </div>
  );
};

const McpServerSection = () => {
  const translate = useTranslate();

  return (
    <div>
      <SectionLabel>
        {translate("crm.profile.mcp.title", { _: "MCP Server" })}
      </SectionLabel>
      <p className="text-sm text-muted-foreground mb-2 px-1">
        {translate("crm.profile.mcp.description", {
          _: "Use this URL to connect your AI assistant to your CRM data via the Model Context Protocol (MCP).",
        })}
      </p>
      <ItemGroup className="rounded-lg border overflow-hidden">
        <CopyPasteRow value={`${env.supabaseUrl}/functions/v1/mcp`} />
      </ItemGroup>
    </div>
  );
};

const CopyPasteRow = ({ value }: { value: string }) => {
  const translate = useTranslate();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(value);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Item
            size="sm"
            className="cursor-pointer flex-nowrap"
            onClick={handleCopy}
          >
            <ItemContent className="overflow-hidden">
              <ItemTitle className="font-normal truncate">{value}</ItemTitle>
            </ItemContent>
            <ItemActions className="shrink-0">
              {copied ? (
                <Check className="size-4 text-muted-foreground" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </ItemActions>
          </Item>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {copied
              ? translate("crm.common.copied")
              : translate("crm.common.copy")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
