import { useGetOne, type Identifier } from "ra-core";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company, Contact, Deal, Project } from "../types";

/**
 * Desde qué proyecto escribir, cuando hay que preguntarlo: la empresa del
 * destinatario tiene varios y nada más lo decide (una oportunidad con
 * proyecto ya lo decide). Con uno o ninguno, el servidor elige solo
 * (ver lib/server/correo/proyectos.ts) y aquí no se pinta nada.
 */
export const useProyectosParaElegir = ({
  companyId,
  contactId,
  dealId,
}: {
  companyId?: Identifier | null;
  contactId?: Identifier | null;
  dealId?: Identifier | null;
}): Project[] => {
  const { projects } = useConfigurationContext();
  const conProyectos = projects.length > 0;

  const { data: contacto } = useGetOne<Contact>(
    "contacts",
    { id: contactId as Identifier },
    { enabled: conProyectos && companyId == null && contactId != null },
  );
  const empresaId = companyId ?? contacto?.company_id ?? null;
  const { data: empresa } = useGetOne<Company>(
    "companies",
    { id: empresaId as Identifier },
    { enabled: conProyectos && empresaId != null },
  );
  const { data: oportunidad } = useGetOne<Deal>(
    "deals",
    { id: dealId as Identifier },
    { enabled: conProyectos && dealId != null },
  );

  if (oportunidad?.project) return [];
  const opciones = projects.filter((p) =>
    (empresa?.projects ?? []).includes(p.value),
  );
  return opciones.length > 1 ? opciones : [];
};
