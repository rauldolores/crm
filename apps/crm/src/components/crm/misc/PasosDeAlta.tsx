import { CircleHelp, X } from "lucide-react";
import { useTranslate } from "ra-core";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Cómo dar de alta algo que no se crea desde su propia pantalla (un cliente
 * o un afiliado nacen de una empresa y una oportunidad). Se puede cerrar, y
 * se recuerda cerrado en este navegador: quien ya lo sabe no tiene por qué
 * verlo siempre.
 */
export const PasosDeAlta = ({
  id,
  titulo,
  pasos,
}: {
  /** Clave para recordar que se cerró. */
  id: string;
  titulo: ReactNode;
  pasos: ReactNode[];
}) => {
  const translate = useTranslate();
  const clave = `vinqulia.pasos-de-alta.${id}`;
  const [cerrado, setCerrado] = useState(() => {
    try {
      return localStorage.getItem(clave) === "cerrado";
    } catch {
      return false;
    }
  });

  if (cerrado) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground"
        onClick={() => {
          setCerrado(false);
          try {
            localStorage.removeItem(clave);
          } catch {
            // Sin almacenamiento solo se pierde el recuerdo, no la ayuda.
          }
        }}
      >
        <CircleHelp className="h-4 w-4 mr-1" />
        {titulo}
      </Button>
    );
  }

  return (
    <div className="relative rounded-lg border bg-muted/40 p-4 text-sm">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7"
        aria-label={translate("ra.action.close")}
        onClick={() => {
          setCerrado(true);
          try {
            localStorage.setItem(clave, "cerrado");
          } catch {
            // Igual que arriba.
          }
        }}
      >
        <X className="h-4 w-4" />
      </Button>
      <p className="mb-2 flex items-center gap-2 font-medium">
        <CircleHelp className="h-4 w-4 text-primary" />
        {titulo}
      </p>
      <ol className="ml-6 list-decimal space-y-1 text-muted-foreground">
        {pasos.map((paso, indice) => (
          <li key={indice}>{paso}</li>
        ))}
      </ol>
    </div>
  );
};
