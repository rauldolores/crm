/**
 * PostgREST corta cada respuesta en `max_rows` (1000 en este proyecto,
 * supabase/config.toml), así que una sola consulta nunca trae una tabla
 * entera. Esto pide páginas consecutivas hasta que una llega incompleta.
 *
 * `pedir` debe ordenar por una columna única (el id): sin orden estable,
 * dos páginas pueden repetir o saltarse filas.
 */
export const TAMANO_DE_PAGINA = 1000;

interface Respuesta<T> {
  data: T[] | null;
  error: { message: string } | null;
}

export async function leerPorPaginas<T>(
  pedir: (desde: number, hasta: number) => PromiseLike<Respuesta<T>>,
): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += TAMANO_DE_PAGINA) {
    const { data, error } = await pedir(desde, desde + TAMANO_DE_PAGINA - 1);
    if (error) throw new Error(error.message);
    const pagina = data ?? [];
    filas.push(...pagina);
    if (pagina.length < TAMANO_DE_PAGINA) return filas;
  }
}
