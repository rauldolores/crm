import { CircleHelp } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { AyudaPage } from "./AyudaPage";
import { seccionParaRuta } from "./contenido";

/**
 * El «?» de la cabecera: abre la ayuda en la sección de la pantalla actual,
 * no en la portada. Quien pulsa ayuda en Oportunidades quiere saber de
 * oportunidades.
 */
export const BotonDeAyuda = () => {
  const { pathname } = useLocation();
  const seccion = seccionParaRuta(pathname);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ayuda y documentación"
            asChild
          >
            <Link to={`${AyudaPage.path}?seccion=${seccion}`}>
              <CircleHelp className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ayuda sobre esta pantalla</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
