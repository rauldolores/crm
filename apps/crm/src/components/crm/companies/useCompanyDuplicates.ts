import type { Identifier } from "ra-core";
import { useDataProvider } from "ra-core";
import { useEffect, useState } from "react";

import {
  confirmarDuplicados,
  UMBRAL_DE_DUPLICADO,
} from "../misc/confirmarDuplicados";
import type { Company } from "../types";

export interface EmpresaDuplicada {
  empresa: Company;
  /** `empresa` cuando el modelo de decisión lo confirma; si no, `nombre`. */
  motivo: "nombre" | "empresa";
}

/**
 * Empresas que podrían ser la misma que se está dando de alta.
 *
 * El nombre completo no sirve para buscar: «Panadería Lola S.A. de C.V.» no
 * encuentra a «Panadería Lola», porque `ilike` busca el valor entero dentro
 * del otro. Así que se busca por la palabra más larga del nombre, que es la
 * que de verdad identifica a la empresa, y la forma jurídica (S.A., S.L.,
 * C.V.) se cae sola al exigir cuatro letras.
 *
 * Eso trae parecidos de sobra, y ahí entra el modelo de decisión: descarta
 * lo que solo comparte una palabra. Sin modelo se enseñan todos, que es
 * ruido asumible para un aviso que no bloquea nada.
 *
 * Lo que no alcanza ninguno de los dos son las tildes: la base no tiene
 * `unaccent`, así que «Panaderia Lola» no encuentra a «Panadería Lola».
 */
export function useCompanyDuplicates({
  name,
  excludeId,
}: {
  name?: string;
  excludeId?: Identifier;
}): EmpresaDuplicada[] {
  const dataProvider = useDataProvider();
  const [duplicadas, setDuplicadas] = useState<EmpresaDuplicada[]>([]);

  const nombre = (name ?? "").trim();
  const clave = `${nombre}|${excludeId ?? ""}`;

  useEffect(() => {
    const busqueda = palabraMasLarga(nombre);
    if (!busqueda) {
      setDuplicadas([]);
      return;
    }

    let cancelado = false;
    const temporizador = setTimeout(async () => {
      const { data } = await dataProvider
        .getList<Company>("companies", {
          filter: {
            "name@ilike": busqueda,
            ...(excludeId ? { "id@neq": excludeId } : {}),
          },
          pagination: { page: 1, perPage: 5 },
          sort: { field: "id", order: "ASC" },
        })
        .catch(() => ({ data: [] as Company[] }));

      // Una empresa con el nombre idéntico no necesita que nadie opine.
      const candidatas = data.filter(
        (empresa) =>
          empresa.name?.trim().toLowerCase() !== nombre.toLowerCase(),
      );
      const veredicto = candidatas.length
        ? await confirmarDuplicados(
            "companies",
            { nombre },
            candidatas.map((empresa) => Number(empresa.id)),
          )
        : {};

      const visibles = data.flatMap((empresa): EmpresaDuplicada[] => {
        if (empresa.name?.trim().toLowerCase() === nombre.toLowerCase()) {
          return [{ empresa, motivo: "empresa" as const }];
        }
        const probabilidad = veredicto[Number(empresa.id)];
        if (probabilidad === undefined) {
          return [{ empresa, motivo: "nombre" as const }];
        }
        return probabilidad >= UMBRAL_DE_DUPLICADO
          ? [{ empresa, motivo: "empresa" as const }]
          : [];
      });

      if (!cancelado) setDuplicadas(visibles);
    }, 500);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return duplicadas;
}

/**
 * La palabra con más letras del nombre, sin puntuación y de cuatro letras
 * para arriba. Cadena vacía si no hay ninguna: con menos no se busca, porque
 * «Lola» dentro de un nombre de tres letras encontraría medio fichero.
 */
export function palabraMasLarga(nombre: string): string {
  return (
    nombre
      .split(/\s+/)
      .map((palabra) => palabra.replace(/[.,;:()"']/g, ""))
      .filter((palabra) => palabra.length >= 4)
      .sort((a, b) => b.length - a.length)[0] ?? ""
  );
}
