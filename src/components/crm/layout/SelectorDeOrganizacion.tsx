import { Building2, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getKontroliaClient,
  getKontroliaMemberships,
  switchKontroliaOrganization,
} from "@/lib/kontrolia-auth/client";
import { isKontroliaAuthConfigured } from "@/lib/kontrolia-auth/config";

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
      window.location.reload();
    } catch {
      setCambiando(false);
    }
  };

  const nombreActivo =
    organizaciones.find((o) => o.id === activa)?.nombre ?? "Organización";

  return { organizaciones, activa, cambiando, cambiar, nombreActivo };
};

export const SelectorDeOrganizacion = () => {
  const { organizaciones, activa, cambiando, cambiar, nombreActivo } =
    useOrganizaciones();

  if (organizaciones.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={cambiando}
        >
          {cambiando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Building2 className="size-4" />
          )}
          <span className="max-w-40 truncate">{nombreActivo}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {organizaciones.map((organizacion) => (
          <DropdownMenuItem
            key={organizacion.id}
            onClick={() => cambiar(organizacion.id)}
            className="cursor-pointer gap-2"
          >
            <Check
              className={
                organizacion.id === activa ? "size-4" : "size-4 opacity-0"
              }
            />
            {organizacion.nombre}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
