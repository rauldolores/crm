import { Loader2 } from "lucide-react";
import { useGetList, useGetMany, useTranslate, type Identifier } from "ra-core";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Company, Contact, Deal } from "../types";
import { useFiltroEnProceso } from "./useAfiliadosEnProceso";

/**
 * Pestaña «En proceso»: quien está en camino de ser afiliado. Aparecen aquí
 * desde que se crea su oportunidad en el embudo de afiliados; al llegar a la
 * etapa de afiliación completa pasan a la pestaña «Afiliados».
 */
export const AfiliadosEnProceso = () => {
  const translate = useTranslate();
  const { listo, embudo, filtro } = useFiltroEnProceso();
  const { data, isPending } = useGetList<Deal>(
    "deals",
    {
      filter: filtro,
      sort: { field: "updated_at", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: listo },
  );
  const oportunidades = data ?? [];
  const { data: empresas } = useGetMany<Company>("companies", {
    ids: [...new Set(oportunidades.map((o) => o.company_id))],
  });
  const { data: contactos } = useGetMany<Contact>("contacts", {
    ids: [
      ...new Set(
        oportunidades
          .map((o) => o.contact_ids?.[0])
          .filter((id): id is Identifier => id != null),
      ),
    ],
  });

  if (!listo) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("crm.affiliates.in_progress.not_configured")}
      </p>
    );
  }
  if (isPending) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (!oportunidades.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("crm.affiliates.in_progress.empty")}
      </p>
    );
  }

  const nombreDeEtapa = (valor: string) =>
    embudo?.stages.find((etapa) => etapa.value === valor)?.label ?? valor;
  const nombreDe = (lista: { id: Identifier }[] | undefined, id?: Identifier) =>
    lista?.find((elemento) => elemento.id === id);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{translate("crm.affiliates.in_progress.deal")}</TableHead>
          <TableHead>{translate("crm.affiliates.fields.company_id")}</TableHead>
          <TableHead>{translate("crm.affiliates.fields.contact_id")}</TableHead>
          <TableHead>{translate("crm.affiliates.in_progress.stage")}</TableHead>
          <TableHead>
            {translate("crm.affiliates.in_progress.updated")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {oportunidades.map((oportunidad) => {
          const empresa = nombreDe(empresas, oportunidad.company_id) as
            | Company
            | undefined;
          const contacto = nombreDe(contactos, oportunidad.contact_ids?.[0]) as
            | Contact
            | undefined;
          return (
            <TableRow key={oportunidad.id}>
              <TableCell>
                <Link
                  className="font-medium hover:underline"
                  to={`/deals/${oportunidad.id}/show`}
                >
                  {oportunidad.name}
                </Link>
              </TableCell>
              <TableCell>
                {empresa ? (
                  <Link
                    className="hover:underline"
                    to={`/companies/${empresa.id}/show`}
                  >
                    {empresa.name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {contacto
                  ? `${contacto.first_name ?? ""} ${contacto.last_name ?? ""}`.trim()
                  : translate("crm.affiliates.in_progress.no_contact")}
              </TableCell>
              <TableCell>{nombreDeEtapa(oportunidad.stage)}</TableCell>
              <TableCell>
                {new Date(oportunidad.updated_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
