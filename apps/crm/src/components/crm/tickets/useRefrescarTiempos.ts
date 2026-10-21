import { useQueryClient } from "@tanstack/react-query";

/**
 * Vuelve a pedir los tiempos del ticket y la bolsa del mes tras registrar o
 * corregir: las dos consultas cuelgan de la clave «soporte_tiempos».
 */
export const useRefrescarTiempos = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["soporte_tiempos"] });
};
