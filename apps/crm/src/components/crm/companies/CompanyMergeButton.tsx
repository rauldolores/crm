import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowDown, CircleX, Merge } from "lucide-react";
import {
  Form,
  required,
  useDataProvider,
  useGetList,
  useNotify,
  useRecordContext,
  useRedirect,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useEffect, useState } from "react";

import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CrmDataProvider } from "../providers/supabase/dataProvider";
import type { Company } from "../types";

/**
 * Fusiona la empresa de la ficha (que se elimina) con otra (que se
 * conserva). Los duplicados salen solos con los años: la misma empresa dada
 * de alta dos veces con nombres distintos, cada una con sus contactos y
 * oportunidades. Calcado del de contactos.
 */
export const CompanyMergeButton = () => {
  const translate = useTranslate();
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="h-6 cursor-pointer"
        size="sm"
        onClick={() => setAbierto(true)}
      >
        <Merge className="w-4 h-4" />
        {translate("resources.companies.merge.action")}
      </Button>
      <CompanyMergeDialog open={abierto} onClose={() => setAbierto(false)} />
    </>
  );
};

/** Cuántas filas de `recurso` apuntan a la empresa (solo el total). */
const useCuenta = (
  recurso: string,
  companyId: Identifier | undefined,
  enabled: boolean,
) =>
  useGetList(
    recurso,
    {
      filter: { company_id: companyId },
      pagination: { page: 1, perPage: 1 },
    },
    { enabled },
  ).total;

const CompanyMergeDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const perdedora = useRecordContext<Company>();
  const notify = useNotify();
  const redirect = useRedirect();
  const translate = useTranslate();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [ganadoraId, setGanadoraId] = useState<Identifier | null>(null);
  const [sugerida, setSugerida] = useState<Identifier | null>(null);

  const { mutateAsync, isPending: fusionando } = useMutation({
    mutationKey: ["companies", "merge", { loserId: perdedora?.id, ganadoraId }],
    mutationFn: async () => {
      if (!perdedora || !ganadoraId) return;
      return dataProvider.mergeCompanies(perdedora.id, ganadoraId);
    },
  });

  // Sugerencia: la empresa con el nombre más parecido (búsqueda de texto).
  const { data: parecidas } = useGetList<Company>(
    "companies",
    {
      filter: { q: perdedora?.name, "id@neq": `${perdedora?.id}` },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "name", order: "ASC" },
    },
    { enabled: open && !!perdedora?.name },
  );
  useEffect(() => {
    if (parecidas?.length) {
      setSugerida(parecidas[0].id);
      setGanadoraId(parecidas[0].id);
    }
  }, [parecidas]);

  const listo = open && !!perdedora && !!ganadoraId;
  const contactos = useCuenta("contacts", perdedora?.id, listo);
  const oportunidades = useCuenta("deals", perdedora?.id, listo);
  const tickets = useCuenta("tickets", perdedora?.id, listo);

  const fusionar = async () => {
    if (!ganadoraId || !perdedora) {
      notify("resources.companies.merge.select_target", { type: "warning" });
      return;
    }
    try {
      await mutateAsync();
      notify("resources.companies.merge.success", { type: "success" });
      redirect(`/companies/${ganadoraId}/show`);
      onClose();
    } catch {
      notify("resources.companies.merge.error", { type: "error" });
    }
  };

  if (!perdedora) return null;

  const cantidades = [
    { clave: "contacts", n: contactos },
    { clave: "deals", n: oportunidades },
    { clave: "tickets", n: tickets },
  ].filter((c): c is { clave: string; n: number } => !!c.n);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="md:min-w-lg max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.companies.merge.title")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.companies.merge.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="font-medium text-sm">
              {translate("resources.companies.merge.current_company")}
            </p>
            <p className="font-medium text-sm mt-2">{perdedora.name}</p>

            <div className="flex justify-center my-4">
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="font-medium text-sm mb-2">
              {translate("resources.companies.merge.target_company")}
            </p>
            <Form>
              <ReferenceInput
                source="winner_id"
                reference="companies"
                filter={{ "id@neq": perdedora.id }}
              >
                <AutocompleteInput
                  label=""
                  optionText="name"
                  validate={required()}
                  onChange={setGanadoraId}
                  defaultValue={sugerida}
                  helperText={false}
                />
              </ReferenceInput>
            </Form>
          </div>

          {ganadoraId && (
            <>
              <div className="space-y-2">
                <p className="font-medium text-sm">
                  {translate("resources.companies.merge.what_will_be_merged")}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  {cantidades.map(({ clave, n }) => (
                    <li key={clave}>
                      •{" "}
                      {translate(`resources.companies.merge.${clave}`, {
                        smart_count: n,
                      })}
                    </li>
                  ))}
                  <li>• {translate("resources.companies.merge.data")}</li>
                </ul>
              </div>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {translate("resources.companies.merge.warning_title")}
                </AlertTitle>
                <AlertDescription>
                  {translate("resources.companies.merge.warning_description")}
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={fusionando}>
            <CircleX />
            {translate("ra.action.cancel")}
          </Button>
          <Button onClick={fusionar} disabled={!ganadoraId || fusionando}>
            <Merge />
            {fusionando
              ? translate("resources.companies.merge.merging")
              : translate("resources.companies.merge.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
