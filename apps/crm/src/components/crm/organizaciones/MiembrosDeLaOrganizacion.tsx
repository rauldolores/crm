import { Loader2, UserMinus, X } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type Invitacion,
  listarInvitaciones,
  listarMiembros,
  type Miembro,
  quitarMiembro,
  revocarInvitacion,
} from "@/lib/kontrolia-auth/equipo";

import { fechaLarga } from "../facturacion/formato";
import { InvitarUsuarioButton } from "../sales/InvitarUsuarioButton";

interface MiembrosDeLaOrganizacionProps {
  organizacionId: string;
  /** Id de usuario de quien mira, para no ofrecerle quitarse a sí mismo. */
  usuarioId: string | null;
  /** Owner/Admin de esta organización: puede invitar y quitar. */
  puedeAdministrar: boolean;
}

/**
 * Miembros e invitaciones de una organización, contra la API de KontrolIA
 * Auth con el token de quien mira. Las acciones (invitar, quitar, revocar)
 * solo se ofrecen a Owner/Admin; el servidor lo exige igual por RLS.
 */
export const MiembrosDeLaOrganizacion = ({
  organizacionId,
  usuarioId,
  puedeAdministrar,
}: MiembrosDeLaOrganizacionProps) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [miembros, setMiembros] = useState<Miembro[] | null>(null);
  const [invitaciones, setInvitaciones] = useState<Invitacion[] | null>(null);
  const [aQuitar, setAQuitar] = useState<Miembro | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const [m, i] = await Promise.all([
      listarMiembros(organizacionId).catch((e: unknown) => {
        notify(e instanceof Error ? e.message : "crm.team.error", {
          type: "error",
        });
        return [] as Miembro[];
      }),
      listarInvitaciones(organizacionId).catch(() => [] as Invitacion[]),
    ]);
    setMiembros(m);
    setInvitaciones(i.filter((inv) => !inv.accepted_at));
  }, [organizacionId, notify]);

  useEffect(() => {
    setMiembros(null);
    setInvitaciones(null);
    void cargar();
  }, [cargar]);

  const confirmarQuitar = async () => {
    if (!aQuitar) return;
    setOcupado(aQuitar.membershipId);
    try {
      await quitarMiembro(aQuitar.membershipId);
      notify("crm.team.member_removed", { type: "success" });
      setAQuitar(null);
      await cargar();
    } catch (e) {
      notify(e instanceof Error ? e.message : "crm.team.error", {
        type: "error",
      });
    } finally {
      setOcupado(null);
    }
  };

  const revocar = async (invitacion: Invitacion) => {
    setOcupado(invitacion.id);
    try {
      await revocarInvitacion(invitacion.id);
      notify("crm.team.invitation_revoked", { type: "success" });
      await cargar();
    } catch (e) {
      notify(e instanceof Error ? e.message : "crm.team.error", {
        type: "error",
      });
    } finally {
      setOcupado(null);
    }
  };

  const etiquetaDeRol = (rol: Miembro["roles"][number]) =>
    rol.slug === "owner"
      ? translate("crm.organizations.role_owner")
      : rol.slug === "admin"
        ? translate("crm.organizations.role_admin")
        : rol.name;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">
              {translate("crm.team.members_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {puedeAdministrar
                ? translate("crm.team.members_intro")
                : translate("crm.team.only_admins")}
            </p>
          </div>
          {puedeAdministrar && <InvitarUsuarioButton onInvitado={cargar} />}
        </div>

        {miembros === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {translate("crm.team.loading")}
          </p>
        ) : miembros.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {translate("crm.team.no_members")}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {miembros.map((miembro) => {
              const esYo = miembro.userId === usuarioId;
              return (
                <li
                  key={miembro.membershipId}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {miembro.name || miembro.email}
                      {esYo && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({translate("crm.team.you")})
                        </span>
                      )}
                    </p>
                    {miembro.name && (
                      <p className="truncate text-xs text-muted-foreground">
                        {miembro.email}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {miembro.roles.map((rol) => (
                      <Badge key={rol.id} variant="outline">
                        {etiquetaDeRol(rol)}
                      </Badge>
                    ))}
                    {miembro.status !== "active" && (
                      <Badge
                        variant="outline"
                        className="border-orange-300 dark:border-orange-700"
                      >
                        {translate("crm.team.member_status_suspended")}
                      </Badge>
                    )}
                    {puedeAdministrar && !esYo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={ocupado === miembro.membershipId}
                        onClick={() => setAQuitar(miembro)}
                      >
                        <UserMinus className="size-4" />
                        {translate("crm.team.remove_member")}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {puedeAdministrar && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            {translate("crm.team.invitations_title")}
          </h2>
          {invitaciones === null ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {translate("crm.team.loading")}
            </p>
          ) : invitaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {translate("crm.team.no_invitations")}
            </p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {invitaciones.map((invitacion) => (
                <li
                  key={invitacion.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {invitacion.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invitacion.role?.name ?? ""}
                      {invitacion.role ? " · " : ""}
                      {translate("crm.team.invitation_expires", {
                        date: fechaLarga(invitacion.expires_at),
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={ocupado === invitacion.id}
                    onClick={() => revocar(invitacion)}
                  >
                    <X className="size-4" />
                    {translate("crm.team.revoke_invitation")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Dialog
        open={aQuitar !== null}
        onOpenChange={(abierto) => !abierto && setAQuitar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("crm.team.remove_member")}</DialogTitle>
            <DialogDescription>
              {translate("crm.team.remove_member_confirm", {
                email: aQuitar?.email ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAQuitar(null)}
              disabled={ocupado !== null}
            >
              {translate("crm.team.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarQuitar}
              disabled={ocupado !== null}
            >
              {translate("crm.team.remove_member")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
