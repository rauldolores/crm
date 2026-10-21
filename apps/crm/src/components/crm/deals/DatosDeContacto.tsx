import { Building2, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useGetList, useGetMany, useGetOne, useTranslate } from "ra-core";
import { Link as RouterLink } from "react-router";

import { Avatar } from "../contacts/Avatar";
import type { Company, Contact, Deal } from "../types";

/** Cuántos contactos de la empresa se muestran como mucho en la ficha. */
const MAXIMO_DE_CONTACTOS = 10;

/**
 * A quién llamar o escribir para darle seguimiento a la oportunidad, sin
 * salir de la ficha: la empresa (con enlace a su ficha, teléfono, web y
 * ciudad) y sus contactos con correo y teléfono que se pueden pulsar.
 *
 * Si la oportunidad tiene contactos ligados, se muestran esos; si no —lo
 * normal en oportunidades importadas, que solo traen la empresa—, los de
 * la empresa.
 */
export const DatosDeContacto = ({ deal }: { deal: Deal }) => {
  const translate = useTranslate();
  const t = (clave: string) =>
    translate(`resources.deals.contact_info.${clave}`);

  const { data: empresa } = useGetOne<Company>(
    "companies",
    { id: deal.company_id },
    { enabled: deal.company_id != null },
  );

  const conContactosPropios = (deal.contact_ids ?? []).length > 0;
  const { data: contactosPropios } = useGetMany<Contact>(
    "contacts_summary",
    { ids: deal.contact_ids ?? [] },
    { enabled: conContactosPropios },
  );
  const { data: contactosDeLaEmpresa } = useGetList<Contact>(
    "contacts_summary",
    {
      filter: { company_id: deal.company_id },
      pagination: { page: 1, perPage: MAXIMO_DE_CONTACTOS },
      sort: { field: "last_seen", order: "DESC" },
    },
    { enabled: !conContactosPropios && deal.company_id != null },
  );
  const contactos = conContactosPropios
    ? contactosPropios
    : contactosDeLaEmpresa;

  if (!empresa && !conContactosPropios) return null;

  const ubicacion = empresa
    ? [empresa.city, empresa.state_abbr].filter(Boolean).join(", ")
    : "";

  return (
    <section className="rounded-lg border p-4 flex flex-col gap-4">
      <h3 className="text-sm font-medium">{t("title")}</h3>

      {empresa && (
        <div className="flex flex-col gap-1.5 text-sm">
          <RouterLink
            to={`/companies/${empresa.id}/show`}
            className="flex items-center gap-2 font-medium hover:underline w-fit"
            title={t("view_company")}
          >
            <Building2 className="size-4 text-muted-foreground" />
            {empresa.name}
          </RouterLink>
          {empresa.phone_number && (
            <Dato icono={Phone}>
              <a
                href={`tel:${empresa.phone_number.replace(/\s+/g, "")}`}
                className="hover:underline"
              >
                {empresa.phone_number}
              </a>
            </Dato>
          )}
          {empresa.website && (
            <Dato icono={Globe}>
              <a
                href={
                  /^https?:\/\//.test(empresa.website)
                    ? empresa.website
                    : `https://${empresa.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {empresa.website.replace(/^https?:\/\//, "")}
              </a>
            </Dato>
          )}
          {ubicacion && <Dato icono={MapPin}>{ubicacion}</Dato>}
          {!empresa.phone_number && !empresa.website && (
            <p className="text-xs text-muted-foreground">
              {t("no_company_data")}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground tracking-wide">
          {conContactosPropios ? t("deal_contacts") : t("company_contacts")}
        </span>
        {contactos && contactos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_contacts")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(contactos ?? []).map((contacto) => (
              <FilaDeContacto key={contacto.id} contacto={contacto} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

const FilaDeContacto = ({ contacto }: { contacto: Contact }) => {
  const correos = (contacto.email_jsonb ?? []).filter((c) => c.email);
  const telefonos = (contacto.phone_jsonb ?? []).filter((t) => t.number);

  return (
    <li className="flex gap-3 min-w-0">
      <Avatar record={contacto} />
      <div className="flex flex-col min-w-0 text-sm">
        <RouterLink
          to={`/contacts/${contacto.id}/show`}
          className="font-medium hover:underline truncate"
        >
          {contacto.first_name} {contacto.last_name}
        </RouterLink>
        {contacto.title && (
          <span className="text-xs text-muted-foreground truncate">
            {contacto.title}
          </span>
        )}
        {correos.map(({ email }) => (
          <Dato key={email} icono={Mail}>
            <a href={`mailto:${email}`} className="hover:underline truncate">
              {email}
            </a>
          </Dato>
        ))}
        {telefonos.map(({ number }) => (
          <Dato key={number} icono={Phone}>
            <a
              href={`tel:${number.replace(/\s+/g, "")}`}
              className="hover:underline"
            >
              {number}
            </a>
          </Dato>
        ))}
      </div>
    </li>
  );
};

const Dato = ({
  icono: Icono,
  children,
}: {
  icono: typeof Phone;
  children: React.ReactNode;
}) => (
  <span className="flex items-center gap-2 min-w-0">
    <Icono className="size-3.5 shrink-0 text-muted-foreground" />
    {children}
  </span>
);
