import { useDataProvider } from "ra-core";
import type { Identifier } from "ra-core";
import { useEffect, useState } from "react";

import {
  confirmarDuplicados,
  UMBRAL_DE_DUPLICADO,
} from "../misc/confirmarDuplicados";
import type { Contact } from "../types";

export interface ContactoDuplicado {
  contacto: Contact;
  /**
   * `correo` es certeza y no se discute. `nombre` es un parecido a secas;
   * pasa a `persona` cuando el modelo de decisión confirma que, con la
   * empresa y el puesto delante, se trata de la misma persona.
   */
  motivo: "correo" | "nombre" | "persona";
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
  title,
  companyId,
  excludeId,
}: {
  firstName?: string;
  lastName?: string;
  /** Puesto y empresa no se buscan: solo ayudan a decidir si es la misma persona. */
  title?: string;
  companyId?: Identifier;
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
  const clave = `${nombre}|${correos.join(",")}|${title ?? ""}|${companyId ?? ""}|${excludeId ?? ""}`;

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

      // Los parecidos de nombre se confirman antes de enseñarlos: dos
      // homónimos en empresas distintas no son un duplicado, y un aviso que
      // salta de más deja de leerse. El del correo no se pregunta — ahí no
      // hay nada que juzgar.
      const lista = [...encontrados.values()];
      const porNombre = lista.filter(({ motivo }) => motivo === "nombre");
      const veredicto = porNombre.length
        ? await confirmarDuplicados(
            "contacts",
            {
              nombre: firstName?.trim() ?? "",
              apellidos: lastName?.trim() ?? "",
              correos,
              ...(title?.trim() ? { puesto: title.trim() } : {}),
              ...(companyId ? { empresa_id: String(companyId) } : {}),
            },
            porNombre.map(({ contacto }) => Number(contacto.id)),
          )
        : {};

      const visibles = lista.flatMap((duplicado) => {
        if (duplicado.motivo !== "nombre") return [duplicado];
        const probabilidad = veredicto[Number(duplicado.contacto.id)];
        // Sin opinión sobre este candidato se queda como estaba: ante la
        // duda, mejor un aviso de más que perder un duplicado real.
        if (probabilidad === undefined) return [duplicado];
        return probabilidad >= UMBRAL_DE_DUPLICADO
          ? [{ ...duplicado, motivo: "persona" as const }]
          : [];
      });

      if (!cancelado) setDuplicados(visibles);
    }, 500);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return duplicados;
}
