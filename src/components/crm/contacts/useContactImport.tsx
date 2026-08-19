import { useDataProvider, useGetIdentity, type DataProvider } from "ra-core";
import { useCallback, useMemo, useRef, useState } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { leerCamposPersonalizadosDeFila } from "../misc/camposPersonalizadosCsv";
import type { Company, Contact, Tag } from "../types";

export interface ContactoDuplicadoDetectado {
  fila: { first_name: string; last_name: string; email?: string };
  existente: Contact;
}

export type ContactImportSchema = {
  first_name: string;
  last_name: string;
  gender: string;
  title: string;
  company: string;
  email_work: string;
  email_home: string;
  email_other: string;
  phone_work: string;
  phone_home: string;
  phone_other: string;
  background: string;
  avatar: string;
  first_seen: string;
  last_seen: string;
  has_newsletter: string;
  status: string;
  tags: string;
  linkedin_url: string;
};

export function useContactImport() {
  const today = new Date().toISOString();
  const user = useGetIdentity();
  const dataProvider = useDataProvider();
  const { contactCustomFields } = useConfigurationContext();

  // company cache to avoid creating the same company multiple times and costly roundtrips
  // Cache is dependent of dataProvider, so it's safe to use it as a dependency
  const companiesCache = useMemo(
    () => new Map<string, Company>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataProvider],
  );
  const getCompanies = useCallback(
    async (names: string[]) =>
      fetchRecordsWithCache<Company>(
        "companies",
        companiesCache,
        names,
        (name) => ({
          name,
          created_at: new Date().toISOString(),
          sales_id: user?.identity?.id,
        }),
        dataProvider,
      ),
    [companiesCache, user?.identity?.id, dataProvider],
  );

  // Tags cache to avoid creating the same tag multiple times and costly roundtrips
  // Cache is dependent of dataProvider, so it's safe to use it as a dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tagsCache = useMemo(() => new Map<string, Tag>(), [dataProvider]);
  const getTags = useCallback(
    async (names: string[]) =>
      fetchRecordsWithCache<Tag>(
        "tags",
        tagsCache,
        names,
        (name) => ({
          name,
          color: "#f9f9f9",
        }),
        dataProvider,
      ),
    [tagsCache, dataProvider],
  );

  // Contactos existentes por correo y por "nombre apellidos", para detectar
  // duplicados sin una consulta por fila: se carga una sola vez por
  // importación (hasta un límite razonable para una pyme) y se completa con
  // cada fila nueva, así también atrapa duplicados dentro del mismo CSV.
  const duplicateIndexRef = useRef<{
    byEmail: Map<string, Contact>;
    byName: Map<string, Contact>;
  } | null>(null);
  const [duplicatesFound, setDuplicatesFound] = useState<
    ContactoDuplicadoDetectado[]
  >([]);

  const claveDeNombre = (first: string, last: string) =>
    `${first} ${last}`.trim().toLowerCase();

  const cargarIndiceDeDuplicados = useCallback(async () => {
    if (duplicateIndexRef.current) return duplicateIndexRef.current;
    const { data } = await dataProvider.getList<Contact>("contacts", {
      pagination: { page: 1, perPage: 2000 },
      sort: { field: "id", order: "ASC" },
    });
    const byEmail = new Map<string, Contact>();
    const byName = new Map<string, Contact>();
    data.forEach((contacto) => {
      contacto.email_jsonb?.forEach((e) => {
        if (e.email) byEmail.set(e.email.trim().toLowerCase(), contacto);
      });
      const clave = claveDeNombre(contacto.first_name, contacto.last_name);
      if (clave) byName.set(clave, contacto);
    });
    duplicateIndexRef.current = { byEmail, byName };
    return duplicateIndexRef.current;
  }, [dataProvider]);

  const processBatch = useCallback(
    async (batch: ContactImportSchema[]) => {
      const [companies, tags, indice] = await Promise.all([
        getCompanies(
          batch
            .map((contact) => contact.company?.trim())
            .filter((name) => name),
        ),
        getTags(batch.flatMap((batch) => parseTags(batch.tags))),
        cargarIndiceDeDuplicados(),
      ]);

      // Secuencial y no en paralelo: cada fila puede registrarse en el
      // índice y hacer de "duplicado dentro del propio archivo" para la
      // siguiente, lo que con Promise.all no se vería.
      for (const fila of batch) {
        const {
          first_name,
          last_name,
          gender,
          title,
          email_work,
          email_home,
          email_other,
          phone_work,
          phone_home,
          phone_other,
          background,
          first_seen,
          last_seen,
          has_newsletter,
          status,
          company: companyName,
          tags: tagNames,
          linkedin_url,
        } = fila;
        const email_jsonb = [
          { email: email_work, type: "Work" },
          { email: email_home, type: "Home" },
          { email: email_other, type: "Other" },
        ].filter(({ email }) => email);
        const phone_jsonb = [
          { number: phone_work, type: "Work" },
          { number: phone_home, type: "Home" },
          { number: phone_other, type: "Other" },
        ].filter(({ number }) => number);
        const company = companyName?.trim()
          ? companies.get(companyName.trim())
          : undefined;
        const tagList = parseTags(tagNames)
          .map((name) => tags.get(name))
          .filter((tag): tag is Tag => !!tag);

        const coincidenciaPorCorreo = email_jsonb
          .map(({ email }) => indice.byEmail.get(email.trim().toLowerCase()))
          .find((contacto): contacto is Contact => !!contacto);
        const coincidenciaPorNombre = indice.byName.get(
          claveDeNombre(first_name, last_name),
        );
        const existente = coincidenciaPorCorreo ?? coincidenciaPorNombre;
        if (existente) {
          setDuplicatesFound((previos) => [
            ...previos,
            {
              fila: { first_name, last_name, email: email_jsonb[0]?.email },
              existente,
            },
          ]);
        }

        const { data: creado } = await dataProvider.create<Contact>(
          "contacts",
          {
            data: {
              first_name,
              last_name,
              gender,
              title,
              email_jsonb,
              phone_jsonb,
              background,
              first_seen: first_seen
                ? new Date(first_seen).toISOString()
                : today,
              last_seen: last_seen ? new Date(last_seen).toISOString() : today,
              has_newsletter,
              status,
              company_id: company?.id,
              tags: tagList.map((tag) => tag.id),
              sales_id: user?.identity?.id,
              linkedin_url,
              // Columnas adicionales del CSV que coinciden con los campos
              // personalizados definidos (por etiqueta o por clave).
              custom_fields: leerCamposPersonalizadosDeFila(
                contactCustomFields,
                fila as unknown as Record<string, unknown>,
              ),
            },
          },
        );

        // Se registra en el índice para detectar duplicados dentro del
        // mismo archivo (dos filas para la misma persona).
        email_jsonb.forEach(({ email }) =>
          indice.byEmail.set(email.trim().toLowerCase(), creado),
        );
        indice.byName.set(claveDeNombre(first_name, last_name), creado);
      }
    },
    [
      dataProvider,
      getCompanies,
      getTags,
      cargarIndiceDeDuplicados,
      user?.identity?.id,
      today,
      contactCustomFields,
    ],
  );

  const reset = useCallback(() => {
    duplicateIndexRef.current = null;
    setDuplicatesFound([]);
  }, []);

  return { processBatch, duplicatesFound, reset };
}

const fetchRecordsWithCache = async function <T>(
  resource: string,
  cache: Map<string, T>,
  names: string[],
  getCreateData: (name: string) => Partial<T>,
  dataProvider: DataProvider,
) {
  const trimmedNames = [...new Set(names.map((name) => name.trim()))];
  const uncachedRecordNames = trimmedNames.filter((name) => !cache.has(name));

  // check the backend for existing records
  if (uncachedRecordNames.length > 0) {
    const response = await dataProvider.getList(resource, {
      filter: {
        "name@in": `(${uncachedRecordNames
          .map((name) => `"${name}"`)
          .join(",")})`,
      },
      pagination: { page: 1, perPage: trimmedNames.length },
      sort: { field: "id", order: "ASC" },
    });
    for (const record of response.data) {
      cache.set(record.name.trim(), record);
    }
  }

  // create missing records in parallel
  await Promise.all(
    uncachedRecordNames.map(async (name) => {
      if (cache.has(name)) return;
      const response = await dataProvider.create(resource, {
        data: getCreateData(name),
      });
      cache.set(name, response.data);
    }),
  );

  // now all records are in cache, return a map of all records
  return trimmedNames.reduce((acc, name) => {
    acc.set(name, cache.get(name) as T);
    return acc;
  }, new Map<string, T>());
};

const parseTags = (tags: string) =>
  tags
    ?.split(",")
    ?.map((tag: string) => tag.trim())
    ?.filter((tag: string) => tag) ?? [];
