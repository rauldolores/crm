import {
  ArrowLeft,
  Building2,
  Check,
  Loader2,
  LogOut,
  Pencil,
  Plus,
} from "lucide-react";
import { useLogout, useNotify, useTranslate } from "ra-core";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { switchKontroliaOrganization } from "@/lib/kontrolia-auth/client";
import { organizacionActivaId } from "@/lib/kontrolia-auth/equipo";
import {
  crearOrganizacion,
  esAdministradorDe,
  listarMisOrganizaciones,
  type MembresiaConOrganizacion,
  type Organizacion,
  renombrarOrganizacion,
  usuarioActivoId,
} from "@/lib/kontrolia-auth/organizaciones";

import { olvidarDerechos } from "../facturacion/useDerechos";
import { SelectorDeOrganizacion } from "../layout/SelectorDeOrganizacion";
import { clearAuthCache } from "../providers/supabase/authProvider";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { MiembrosDeLaOrganizacion } from "./MiembrosDeLaOrganizacion";
import { recargarEnLaRaiz } from "./navegacion";
import { RUTA_ORGANIZACIONES } from "./rutas";

/**
 * Gestión de organizaciones: las de quien tiene la sesión (cambiar,
 * renombrar, crear una nueva) y el equipo de la activa (miembros e
 * invitaciones). Todo contra KontrolIA Auth con el token del usuario.
 *
 * Fuera del layout, como «elige tu plan»: tiene que poder entrarse SIN
 * plan y sin permisos de la app, porque justamente es la puerta para crear
 * una organización nueva de la que ser Owner y contratarle un plan.
 */
export const OrganizacionesPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const logout = useLogout();
  const { title, darkModeLogo } = useConfigurationContext();

  const [membresias, setMembresias] = useState<
    MembresiaConOrganizacion[] | null
  >(null);
  const [activaId, setActivaId] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [cambiandoA, setCambiandoA] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [renombrando, setRenombrando] = useState<Organizacion | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, activa, usuario] = await Promise.all([
        listarMisOrganizaciones(),
        organizacionActivaId(),
        usuarioActivoId(),
      ]);
      setMembresias(lista);
      setActivaId(activa);
      setUsuarioId(usuario);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiarA = async (id: string) => {
    setCambiandoA(id);
    try {
      await switchKontroliaOrganization(id);
    } finally {
      olvidarDerechos();
      clearAuthCache();
      // Igual que el selector: se vuelve a la raíz, que decide si hay plan.
      recargarEnLaRaiz();
    }
  };

  const activa = membresias?.find((m) => m.organizacion.id === activaId);
  const puedeAdministrarLaActiva = activa
    ? esAdministradorDe(activa.roles)
    : false;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={darkModeLogo} alt={title} className="size-8 rounded-lg" />
            <span className="font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <SelectorDeOrganizacion />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                olvidarDerechos();
                logout();
              }}
            >
              <LogOut className="h-4 w-4" />
              {translate("ra.auth.logout")}
            </Button>
          </div>
        </header>

        <div className="flex flex-col gap-2">
          <Link
            to="/"
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {translate("crm.organizations.back")}
          </Link>
          <h1 className="text-2xl font-semibold">
            {translate("crm.organizations.title")}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            {translate("crm.organizations.intro")}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {translate("crm.organizations.yours_title")}
            </h2>
            <Button size="sm" onClick={() => setCreando(true)}>
              <Plus className="size-4" />
              {translate("crm.organizations.new_action")}
            </Button>
          </div>

          {error ? (
            <p className="text-sm text-destructive">
              {translate("crm.organizations.error_loading")}
            </p>
          ) : membresias === null ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {translate("crm.team.loading")}
            </p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {membresias.map((membresia) => {
                const { organizacion, roles } = membresia;
                const esActiva = organizacion.id === activaId;
                return (
                  <li
                    key={organizacion.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                        <Building2 className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {organizacion.nombre}
                        </p>
                        <p className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          {roles.includes("owner")
                            ? translate("crm.organizations.role_owner")
                            : roles.includes("admin")
                              ? translate("crm.organizations.role_admin")
                              : translate("crm.organizations.role_member")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {esActiva ? (
                        <Badge variant="secondary">
                          <Check className="size-3" />
                          {translate("crm.organizations.active")}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cambiandoA !== null}
                          onClick={() => cambiarA(organizacion.id)}
                        >
                          {cambiandoA === organizacion.id && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          {translate("crm.organizations.switch")}
                        </Button>
                      )}
                      {esAdministradorDe(roles) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRenombrando(organizacion)}
                        >
                          <Pencil className="size-4" />
                          {translate("crm.organizations.rename")}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {activaId && membresias && (
          <MiembrosDeLaOrganizacion
            organizacionId={activaId}
            usuarioId={usuarioId}
            puedeAdministrar={puedeAdministrarLaActiva}
          />
        )}
      </div>

      <NuevaOrganizacionDialog
        open={creando}
        onClose={() => setCreando(false)}
        onCreada={(organizacion) => {
          notify("crm.organizations.created", { type: "success" });
          void cambiarA(organizacion.id);
        }}
      />
      <RenombrarOrganizacionDialog
        organizacion={renombrando}
        onClose={() => setRenombrando(null)}
        onRenombrada={() => {
          setRenombrando(null);
          void cargar();
        }}
      />
    </div>
  );
};

OrganizacionesPage.path = RUTA_ORGANIZACIONES;

const NuevaOrganizacionDialog = ({
  open,
  onClose,
  onCreada,
}: {
  open: boolean;
  onClose: () => void;
  onCreada: (organizacion: Organizacion) => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { title } = useConfigurationContext();
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleClose = () => {
    setNombre("");
    onClose();
  };

  const crear = async () => {
    setEnviando(true);
    try {
      const { organizacion, aviso } = await crearOrganizacion(nombre.trim());
      if (aviso) {
        notify(
          translate("crm.organizations.created_with_warning", {
            detail: aviso,
          }),
          { type: "warning" },
        );
      }
      handleClose();
      onCreada(organizacion);
    } catch (e) {
      notify(e instanceof Error ? e.message : "crm.team.error", {
        type: "error",
      });
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(abierto) => !abierto && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {translate("crm.organizations.new_dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {translate("crm.organizations.new_dialog_description", {
              app: title,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="nombre-organizacion">
            {translate("crm.organizations.name_field")}
          </Label>
          <Input
            id="nombre-organizacion"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={translate("crm.organizations.name_placeholder")}
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nombre.trim() && !enviando) void crear();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={enviando}>
            {translate("crm.organizations.cancel")}
          </Button>
          <Button onClick={crear} disabled={!nombre.trim() || enviando}>
            {enviando && <Loader2 className="size-4 animate-spin" />}
            {enviando
              ? translate("crm.organizations.creating")
              : translate("crm.organizations.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RenombrarOrganizacionDialog = ({
  organizacion,
  onClose,
  onRenombrada,
}: {
  organizacion: Organizacion | null;
  onClose: () => void;
  onRenombrada: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setNombre(organizacion?.nombre ?? "");
  }, [organizacion]);

  const guardar = async () => {
    if (!organizacion) return;
    setEnviando(true);
    try {
      await renombrarOrganizacion(organizacion.id, nombre.trim());
      notify("crm.organizations.renamed", { type: "success" });
      onRenombrada();
    } catch (e) {
      notify(e instanceof Error ? e.message : "crm.team.error", {
        type: "error",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog
      open={organizacion !== null}
      onOpenChange={(abierto) => !abierto && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {translate("crm.organizations.rename_dialog_title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="renombrar-organizacion">
            {translate("crm.organizations.name_field")}
          </Label>
          <Input
            id="renombrar-organizacion"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={120}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={enviando}>
            {translate("crm.organizations.cancel")}
          </Button>
          <Button
            onClick={guardar}
            disabled={
              !nombre.trim() ||
              nombre.trim() === organizacion?.nombre ||
              enviando
            }
          >
            {enviando
              ? translate("crm.organizations.saving")
              : translate("crm.organizations.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
