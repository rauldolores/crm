import { AlertTriangle } from "lucide-react";
import { useTranslate } from "ra-core";
import { useWatch } from "react-hook-form";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { EmailAndType } from "../types";
import { useContactDuplicates } from "./useContactDuplicates";

/**
 * Aviso de posibles duplicados mientras se crea un contacto: si ya existe
 * alguien con el mismo correo o un nombre parecido, se muestra aquí con un
 * enlace a su ficha — la persona decide si sigue creando uno nuevo o va a
 * fusionar. Debe ir dentro de un <Form>, porque lee sus valores en vivo.
 */
export const PosiblesDuplicados = () => {
  const translate = useTranslate();
  const firstName: string | undefined = useWatch({ name: "first_name" });
  const lastName: string | undefined = useWatch({ name: "last_name" });
  const emailJsonb: EmailAndType[] | undefined = useWatch({
    name: "email_jsonb",
  });

  const duplicados = useContactDuplicates({
    firstName,
    lastName,
    emails: (emailJsonb ?? []).map((e) => e.email),
  });

  if (duplicados.length === 0) return null;

  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {translate("resources.contacts.duplicates.title", {
          _: "Ya existe un contacto parecido",
        })}
      </AlertTitle>
      <AlertDescription>
        <ul className="flex flex-col gap-1 mt-1">
          {duplicados.map(({ contacto, motivo }) => (
            <li key={contacto.id}>
              <Link
                to={`/contacts/${contacto.id}/show`}
                target="_blank"
                className="underline"
              >
                {contacto.first_name} {contacto.last_name}
              </Link>{" "}
              <span className="text-muted-foreground">
                {translate(
                  motivo === "correo"
                    ? "resources.contacts.duplicates.same_email"
                    : "resources.contacts.duplicates.same_name",
                )}
              </span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
