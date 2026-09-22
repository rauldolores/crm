/**
 * Nadie puede borrarse a sí mismo de la lista del equipo.
 *
 * Quien lo hace se queda sin fila en `crm.sales` pero con su sesión abierta:
 * a partir de ahí no tiene responsable asignable, el puente no puede sellar
 * sus altas y —si era el único administrador— la organización se queda sin
 * quien la administre. Es un error del que no se vuelve desde la propia
 * aplicación, así que se corta antes de llegar a la base.
 *
 * Se comprueba sobre los parámetros de la petición, que es lo que el puente
 * tiene a mano: el proveedor de datos borra siempre por identificador
 * (`id=eq.7` una fila, `id=in.(7,9)` varias).
 */

/** Los identificadores que un filtro `id` de PostgREST señala, si se pueden leer. */
export const idsDelFiltro = (filtro: string | null): string[] | null => {
  if (!filtro) return null;
  const uno = /^eq\.(.+)$/.exec(filtro);
  if (uno) return [uno[1]];
  const varios = /^in\.\((.*)\)$/.exec(filtro);
  if (varios) {
    return varios[1]
      .split(",")
      .map((id) => id.trim().replace(/^"(.*)"$/, "$1"))
      .filter(Boolean);
  }
  return null;
};

/**
 * true si este borrado alcanza a la fila propia. También cuando el filtro no
 * es legible o no hay filtro: un DELETE sin `id` sobre `sales` borraría al
 * equipo entero —y a quien lo pide con él—, así que se trata igual.
 */
export const borraAlUsuarioDeLaSesion = (
  parametros: URLSearchParams,
  idPropio: number | string | null,
): boolean => {
  if (idPropio == null) return false;
  const ids = idsDelFiltro(parametros.get("id"));
  if (ids == null) return true;
  return ids.includes(String(idPropio));
};
