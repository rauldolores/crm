import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { getActivityTypeIcon } from "./noteModel";

/**
 * Qué tipo de actividad es esta nota: llamada, reunión, WhatsApp, correo, o
 * una nota simple. Va siempre visible (no detrás de "Mostrar opciones"):
 * tipificar es lo primero que se decide al registrar un contacto con el
 * cliente, no un detalle opcional.
 */
export const ActivityTypeSelector = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (type: string) => void;
}) => {
  const { noteTypes } = useConfigurationContext();

  return (
    <TooltipProvider>
      <div className="flex gap-1" role="radiogroup">
        {noteTypes.map((tipo) => {
          const Icono = getActivityTypeIcon(tipo.value);
          const activo = tipo.value === value;
          return (
            <Tooltip key={tipo.value}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  role="radio"
                  aria-checked={activo}
                  aria-label={tipo.label}
                  onClick={() => onChange(tipo.value)}
                  className={cn(
                    "size-8 cursor-pointer text-muted-foreground",
                    activo && "bg-accent text-accent-foreground",
                  )}
                >
                  <Icono className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tipo.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
