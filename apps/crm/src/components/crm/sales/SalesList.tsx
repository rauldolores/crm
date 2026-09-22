import {
  useGetIdentity,
  useListContext,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { useEffect, useState } from "react";
import { BulkDeleteButton } from "@/components/admin/bulk-delete-button";
import { BulkExportButton } from "@/components/admin/bulk-export-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { esAdministradorDeLaOrganizacion } from "@/lib/kontrolia-auth/facturacion";

import { TopToolbar } from "../layout/TopToolbar";
import { InvitarUsuarioButton } from "./InvitarUsuarioButton";

/**
 * El botón de invitar solo se ofrece a Owner/Admin: auth-server ya lo exige
 * del lado del servidor en /api/invitations (igual que con Stripe en
 * facturación), así que esto solo evita mostrar un botón que iba a
 * responder 403.
 */
const SalesListActions = () => {
  const [puedeInvitar, setPuedeInvitar] = useState(false);

  useEffect(() => {
    let cancelado = false;
    void esAdministradorDeLaOrganizacion().then((puede) => {
      if (!cancelado) setPuedeInvitar(puede);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <TopToolbar>
      {puedeInvitar && <InvitarUsuarioButton />}
      <ExportButton />
    </TopToolbar>
  );
};

const filters = [<SearchInput source="q" alwaysOn />];

/**
 * Borrar en bloque, menos a uno mismo.
 *
 * Quien se borra se queda con la sesión abierta y sin ficha: sin responsable
 * asignable, sin poder crear nada y —si era el único administrador— con la
 * organización sin quien la administre. El puente lo rechaza igualmente
 * (ver borradoDeUsuarios.ts); aquí se explica antes de intentarlo.
 */
const AccionesDeEquipo = () => {
  const translate = useTranslate();
  const { selectedIds } = useListContext();
  const { identity } = useGetIdentity();
  const meIncluye =
    identity?.id != null &&
    (selectedIds ?? []).some((id) => String(id) === String(identity.id));

  return (
    <>
      <BulkExportButton />
      {meIncluye ? (
        <span className="text-sm text-muted-foreground">
          {translate("resources.sales.cannot_delete_self")}
        </span>
      ) : (
        <BulkDeleteButton />
      )}
    </>
  );
};

const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  const translate = useTranslate();
  if (!record) return null;
  return (
    <div className="flex flex-row gap-1">
      {record.administrator && (
        <Badge
          variant="outline"
          className="border-blue-300 dark:border-blue-700"
        >
          {translate("resources.sales.fields.administrator")}
        </Badge>
      )}
      {record.disabled && (
        <Badge
          variant="outline"
          className="border-orange-300 dark:border-orange-700"
        >
          {translate("resources.sales.fields.disabled")}
        </Badge>
      )}
    </div>
  );
};

export function SalesList() {
  return (
    <List
      filters={filters}
      actions={<SalesListActions />}
      sort={{ field: "first_name", order: "ASC" }}
    >
      <DataTable bulkActionButtons={<AccionesDeEquipo />}>
        <DataTable.Col source="first_name" />
        <DataTable.Col source="last_name" />
        <DataTable.Col source="email" />
        <DataTable.Col label={false}>
          <OptionsField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
}
