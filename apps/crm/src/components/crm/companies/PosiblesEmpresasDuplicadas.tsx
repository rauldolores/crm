import { AlertTriangle } from "lucide-react";
import { useTranslate } from "ra-core";
import { useWatch } from "react-hook-form";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { EmpresaDuplicada } from "./useCompanyDuplicates";
import { useCompanyDuplicates } from "./useCompanyDuplicates";

const MOTIVOS: Record<EmpresaDuplicada["motivo"], string> = {
  nombre: "same_name",
  empresa: "same_company",
};

/**
 * Aviso de posibles duplicados mientras se da de alta una empresa: la misma
 * empresa escrita de otra forma acaba partiendo en dos sus contactos, sus
 * oportunidades y su facturación, y eso no se nota hasta que alguien busca
 * un dato y lo encuentra a medias. Quien captura decide: ir a la ficha que
 * ya existe o seguir creando. Debe ir dentro de un <Form>.
 */
export const PosiblesEmpresasDuplicadas = () => {
  const translate = useTranslate();
  const name: string | undefined = useWatch({ name: "name" });
  const duplicadas = useCompanyDuplicates({ name });

  if (duplicadas.length === 0) return null;

  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {translate("resources.companies.duplicates.title", {
          _: "Ya existe una empresa parecida",
        })}
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1 mt-1">
          {duplicadas.map(({ empresa, motivo }) => (
            <li key={empresa.id}>
              <Link
                to={`/companies/${empresa.id}/show`}
                target="_blank"
                className="underline"
              >
                {empresa.name}
              </Link>{" "}
              <span className="text-muted-foreground">
                {translate(`resources.companies.duplicates.${MOTIVOS[motivo]}`)}
              </span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
