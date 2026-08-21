import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getKontroliaClient,
  getKontroliaMemberships,
  switchKontroliaOrganization,
} from "@/lib/kontrolia-auth/client";
import { isKontroliaAuthConfigured } from "@/lib/kontrolia-auth/config";
import { clearAuthCache } from "../providers/supabase/authProvider";

interface Organizacion {
  id: string;
  nombre: string;
}

/**
 * Permite cambiar de organización a quien pertenece a varias.
 *
 * Al cambiar se refresca el token, de modo que `organization_id` pasa a ser la
 * nueva y el servidor empieza a devolver los datos de esa empresa. Como el
 * cambio afecta a todo lo que hay cargado en pantalla, se recarga la página en
 * lugar de intentar invalidar cada consulta: es más simple y no deja restos de
 * la organización anterior a la vista.
 *
 * No se muestra si la persona pertenece a una sola organización, que es el caso
 * habitual.
 */
/**
 * Datos y cambio de organizacion, separados de la presentacion para que el
 * escritorio y el movil compartan comportamiento y no se desincronicen.
 */
export const useOrganizaciones = () => {
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [activa, setActiva] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    if (!isKontroliaAuthConfigured()) return;
    let vigente = true;

    (async () => {
      const [membresias, organizacionActiva] = await Promise.all([
        getKontroliaMemberships(),
        getKontroliaClient()?.getOrganization() ?? null,
      ]);
      if (!vigente) return;

      setOrganizaciones(
        membresias.map((m) => ({
          id: m.organization.id,
          nombre: m.organization.name,
        })),
      );
      setActiva(organizacionActiva?.id ?? null);
    })();

    return () => {
      vigente = false;
    };
  }, []);

  const cambiar = async (id: string) => {
    if (id === activa || cambiando) return;
    setCambiando(true);
    try {
      await switchKontroliaOrganization(id);
    } finally {
      // La recarga va en finally: si el refresco del token falla con el
      // contexto ya cambiado, quedarse sin recargar dejaba la interfaz
      // "muerta" hasta un F5 manual. Antes se limpia la caché de la sesión,
      // porque la ficha de comercial cacheada es de la organización anterior.
      clearAuthCache();
      window.location.reload();
    }
  };

  const nombreActivo =
    organizaciones.find((o) => o.id === activa)?.nombre ?? "Organización";

  return { organizaciones, activa, cambiando, cambiar, nombreActivo };
};

export const SelectorDeOrganizacion = () => {
  const { organizaciones, activa, cambiando, cambiar, nombreActivo } =
    useOrganizaciones();
  const [abierto, setAbierto] = useState(false);

  if (organizaciones.length <= 1) return null;

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={cambiando}
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            {cambiando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Building2 className="size-3.5" />
            )}
          </span>
          <span className="max-w-40 truncate">{nombreActivo}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Buscar organización..." />
          <CommandList>
            <CommandEmpty>No se encontró la organización.</CommandEmpty>
            <CommandGroup>
              {organizaciones.map((organizacion) => (
                <CommandItem
                  key={organizacion.id}
                  value={organizacion.nombre}
                  onSelect={() => {
                    cambiar(organizacion.id);
                    setAbierto(false);
                  }}
                  className="cursor-pointer justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Check
                      className={
                        organizacion.id === activa
                          ? "size-4"
                          : "size-4 opacity-0"
                      }
                    />
                    <span className="truncate">{organizacion.nombre}</span>
                  </span>
                  {organizacion.id === activa && (
                    <Badge variant="secondary" className="shrink-0">
                      Activa
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
