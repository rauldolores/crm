import { useConfigurationContext } from "../root/ConfigurationContext";

/** Índice de urgencia según el orden de la lista configurada (0 = la menor). */
export const useIndiceDePrioridad = () => {
  const { ticketPriorities } = useConfigurationContext();
  return (value?: string | null) =>
    Math.max(
      0,
      ticketPriorities.findIndex((p) => p.value === value),
    );
};
