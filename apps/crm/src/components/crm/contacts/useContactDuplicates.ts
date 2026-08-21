import { useDataProvider } from "ra-core";
import type { Identifier } from "ra-core";
import { useEffect, useState } from "react";

import type { Contact } from "../types";

export interface ContactoDuplicado {
  contacto: Contact;
  motivo: "correo" | "nombre";
}

/**
 * Contactos existentes que podrían ser el mismo que se está capturando: por
 * correo exacto o por nombre y apellidos parecidos. Se consulta con una
 * espera corta tras dejar de escribir, para no lanzar una petición por cada
 * tecla.
 *
 * `ilike` ya envuelve el valor con comodines (`*valor*`), así que un nombre
 * parcial también encuentra coincidencias — «Juan» encuentra a «Juan Carlos».
 */
export function useContactDuplicates({
  firstName,
  lastName,
  emails,
  excludeId,
}: {
  firstName?: string;
  lastName?: string;
  // Un valor de formulario recién iniciado trae filas con email en null
  // (ver defaultEmailJsonb), así que se filtran aquí, no se asume string.
  emails?: (string | null | undefined)[];
  excludeId?: Identifier;
}): ContactoDuplicado[] {
  const dataProvider = useDataProvider();
  const [duplicados, setDuplicados] = useState<ContactoDuplicado[]>([]);

  const nombre = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  const correos = [
    ...new Set(
      (emails ?? [])
        .filter((email): email is string => Boolean(email?.trim()))
        .map((email) => email.trim()),
    ),
  ];
  // Clave estable para el efecto: solo se vuelve a consultar cuando el
  // nombre o los correos realmente cambian, no en cada render del formulario.
  const clave = `${nombre}|${correos.join(",")}|${excludeId ?? ""}`;

  useEffect(() => {
    if (nombre.length < 3 && correos.length === 0) {
      setDuplicados([]);
      return;
    }

    let cancelado = false;
    const temporizador = setTimeout(async () => {
      const encontrados = new Map<Identifier, ContactoDuplicado>();
      const excluir = excludeId ? { "id@neq": excludeId } : {};

      const consultas: Promise<void>[] = [];

      if (firstName?.trim() && lastName?.trim()) {
        consultas.push(
          dataProvider
            .getList<Contact>("contacts", {
              filter: {
                "first_name@ilike": firstName.trim(),
                "last_name@ilike": lastName.trim(),
                ...excluir,
              },
              pagination: { page: 1, perPage: 5 },
              sort: { field: "id", order: "ASC" },
            })
            .then(({ data }) => {
              data.forEach((contacto) =>
                encontrados.set(contacto.id, { contacto, motivo: "nombre" }),
              );
            }),
        );
      }

      for (const correo of correos) {
        consultas.push(
          dataProvider
            // `q` (no "email_fts@ilike" directo): es el mismo buscador de
            // texto completo que ya usa la lista de contactos, y funciona
            // igual contra Supabase que contra los datos de demostración —
            // "email_fts" es una columna calculada que solo existe en la
            // base real.
            .getList<Contact>("contacts", {
              filter: { q: correo, ...excluir },
              pagination: { page: 1, perPage: 5 },
              sort: { field: "id", order: "ASC" },
            })
            .then(({ data }) => {
              // `q` busca en varias columnas a la vez (nombre, puesto,
              // teléfono…); se confirma aquí que el correo realmente
              // coincide, para no avisar de un duplicado por casualidad.
              data
                .filter((contacto) =>
                  contacto.email_jsonb?.some(
                    (e) => e.email?.toLowerCase() === correo.toLowerCase(),
                  ),
                )
                .forEach((contacto) =>
                  encontrados.set(contacto.id, { contacto, motivo: "correo" }),
                );
            }),
        );
      }

      await Promise.all(consultas).catch(() => {
        // Sin conexión o error puntual: no bloquea la creación, solo no
        // avisa de duplicados esta vez.
      });

      if (!cancelado) setDuplicados([...encontrados.values()]);
    }, 500);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return duplicados;
}
