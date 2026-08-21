import { cn } from "@/lib/utils";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { NoteStatus } from "../types";

export const Status = ({
  status,
  statuses,
  className,
}: {
  status: string;
  /** Lista de estados a resolver contra; por defecto la de contactos. */
  statuses?: NoteStatus[];
  className?: string;
}) => {
  const { noteStatuses } = useConfigurationContext();
  const listaDeEstados = statuses ?? noteStatuses;
  if (!status || !listaDeEstados) return null;
  const statusObject = listaDeEstados.find((s: any) => s.value === status);

  if (!statusObject) return null;
  return (
    <div className={cn("group relative inline-block mr-2", className)}>
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: statusObject.color }}
      />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {statusObject.label}
      </div>
    </div>
  );
};
