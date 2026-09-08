import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";

/**
 * Llama a una ruta propia del CRM (no PostgREST) con el token de sesión.
 * Lanza con el mensaje del servidor si la respuesta no es 2xx.
 *
 * Lo usan las pantallas cuya operación no es «una fila más» y por eso no pasa
 * por el data provider: crear una clave de API, configurar el correo
 * saliente… todas hablan con /api/<algo> y necesitan el mismo token.
 */
export const llamarApi = async <T = Record<string, unknown>>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> => {
  const token = await getKontroliaAccessToken();
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(
      (cuerpo as { message?: string }).message ??
        "Ocurrió un error inesperado.",
    );
  }
  return cuerpo as T;
};
