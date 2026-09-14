import { CircleX, Send, UserPlus } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  invitarATuOrganizacion,
  listarRolesDisponibles,
  organizacionActivaId,
  type RolDisponible,
} from "@/lib/kontrolia-auth/equipo";

/**
 * Invitación de equipo contra KontrolIA Auth: abre un diálogo con el correo
 * y el rol a asignar, y llama a invitarATuOrganizacion() (POST
 * /api/invitations con el token de quien tiene la sesión). El botón que
 * abre este diálogo ya se muestra solo a Owner/Admin — ver SalesList.tsx.
 */
export const InvitarUsuarioButton = () => {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlus />
        {translate("crm.team.invite_action")}
      </Button>
      <InvitarUsuarioDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const InvitarUsuarioDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<RolDisponible[] | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    (async () => {
      try {
        const organizationId = await organizacionActivaId();
        if (!organizationId) {
          if (!cancelado) {
            notify("crm.team.no_organization", { type: "error" });
            onClose();
          }
          return;
        }
        const disponibles = await listarRolesDisponibles(organizationId);
        if (!cancelado) setRoles(disponibles);
      } catch {
        if (!cancelado) {
          notify("crm.team.error_loading_roles", { type: "error" });
        }
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    setEmail("");
    setRoleId("");
    setRoles(null);
    onClose();
  };

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      const organizationId = await organizacionActivaId();
      if (!organizationId) {
        notify("crm.team.no_organization", { type: "error" });
        return;
      }
      await invitarATuOrganizacion({ organizationId, email, roleId });
      notify("crm.team.success", { type: "success" });
      handleClose();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : translate("crm.team.error"),
        { type: "error" },
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(abierto) => !abierto && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("crm.team.dialog_title")}</DialogTitle>
          <DialogDescription>
            {translate("crm.team.dialog_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-invitacion">
              {translate("crm.team.email_field")}
            </Label>
            <Input
              id="email-invitacion"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rol-invitacion">
              {translate("crm.team.role_field")}
            </Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="rol-invitacion" className="w-full">
                <SelectValue
                  placeholder={
                    roles === null
                      ? translate("crm.team.loading_roles")
                      : translate("crm.team.role_placeholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {roles?.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {translate("crm.team.no_roles")}
                  </div>
                )}
                {roles?.map((rol) => (
                  <SelectItem key={rol.id} value={rol.id}>
                    {rol.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={enviando}>
            <CircleX />
            {translate("crm.team.cancel")}
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={!email.trim() || !roleId || enviando}
          >
            <Send />
            {enviando
              ? translate("crm.team.sending")
              : translate("crm.team.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
