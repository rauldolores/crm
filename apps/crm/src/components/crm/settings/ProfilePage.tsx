import { env } from "@/lib/env";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import {
  Form,
  useDataProvider,
  useGetIdentity,
  useGetOne,
  useNotify,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { useState } from "react";
import { RecordField } from "@/components/admin/record-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import ImageEditorField from "../misc/ImageEditorField";
import type { CrmDataProvider } from "../providers/types";
import type { Sale, SalesFormData } from "../types";

export const ProfilePage = () => {
  const { identity } = useGetIdentity();
  const { data, refetch: refetchUser } = useGetOne("sales", {
    id: identity?.id,
  });

  if (!identity) return null;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Form record={data}>
        <ProfileForm refetchUser={refetchUser} />
      </Form>
    </div>
  );
};

/**
 * Nombre, apellido y correo son de solo lectura: la identidad vive en
 * KontrolIA Auth, no en el CRM, y ahí es donde también se cambia la
 * contraseña (el CRM nunca la recibe ni la gestiona). Solo el avatar, que es
 * una preferencia propia del CRM, se puede editar aquí.
 */
const ProfileForm = ({ refetchUser }: { refetchUser: () => void }) => {
  const notify = useNotify();
  const translate = useTranslate();
  const record = useRecordContext<Sale>();
  const { identity, refetch } = useGetIdentity();
  const dataProvider = useDataProvider<CrmDataProvider>();

  const { mutate: mutateSale } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: SalesFormData) => {
      if (!record) {
        throw new Error(
          translate("crm.profile.record_not_found", {
            _: "Record not found",
          }),
        );
      }
      return dataProvider.salesUpdate(record.id, data);
    },
    onSuccess: () => {
      refetch();
      refetchUser();
      notify("crm.profile.updated", {
        messageArgs: {
          _: "Your profile has been updated",
        },
      });
    },
    onError: () => {
      notify("crm.profile.update_error", {
        type: "error",
        messageArgs: {
          _: "An error occurred. Please try again.",
        },
      });
    },
  });
  if (!identity) return null;

  const handleAvatarUpdate = async (values: any) => {
    mutateSale(values);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <div className="mb-4 flex flex-row justify-between">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.profile.title")}
            </h2>
          </div>

          <div className="space-y-4 mb-4">
            <ImageEditorField
              source="avatar"
              type="avatar"
              onSave={handleAvatarUpdate}
              linkPosition="right"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextRender source="first_name" />
              <TextRender source="last_name" />
            </div>
            <TextRender source="email" />
          </div>
        </CardContent>
      </Card>
      {env.inboundEmail && (
        <Card>
          <CardContent>
            <div className="space-y-4 justify-between">
              <h2 className="text-xl font-semibold text-muted-foreground">
                {translate("crm.profile.inbound.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {translate("crm.profile.inbound.description", {
                  _: "You can start sending emails to your server's inbound email address, e.g. by adding it to the Cc: field. Vinqulia will process the emails and add notes to the corresponding contacts.",
                  field: "Cc:",
                })}
              </p>
              <CopyPaste value={env.inboundEmail} />
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          <div className="space-y-4 justify-between">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.profile.mcp.title", {
                _: "MCP Server",
              })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {translate("crm.profile.mcp.description", {
                _: "Use this URL to connect your AI assistant to your CRM data via the Model Context Protocol (MCP).",
              })}
            </p>
            <CopyPaste
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}/api/mcp`
                  : "/api/mcp"
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TextRender = ({
  source,
  className,
}: {
  source: string;
  className?: string;
}) => {
  const label = `resources.sales.fields.${source}`;
  return (
    <div className={className}>
      <RecordField source={source} label={label} />
    </div>
  );
};

const CopyPaste = ({ value }: { value: string }) => {
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
          <Button
            type="button"
            onClick={handleCopy}
            variant="ghost"
            className="normal-case justify-between w-full"
          >
            <span className="overflow-hidden text-ellipsis">{value}</span>
            {copied ? (
              <Check className="h-4 w-4 ml-2" />
            ) : (
              <Copy className="h-4 w-4 ml-2" />
            )}
          </Button>
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

ProfilePage.path = "/profile";
