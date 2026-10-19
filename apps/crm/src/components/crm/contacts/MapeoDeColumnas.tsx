import { Loader2, Sparkles } from "lucide-react";
import { useTranslate } from "ra-core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CAMPOS_DE_CONTACTO,
  SIN_COLUMNA,
} from "@/lib/importacion/camposDeContacto";

/**
 * El paso de «a qué corresponde cada columna», que aparece solo cuando el
 * archivo trae cabeceras que no reconocemos.
 *
 * Llega con una propuesta de la IA ya puesta, y lo que hace esta pantalla es
 * darle a alguien la última palabra: importar mal mil contactos se arregla a
 * mano, uno por uno. Las columnas que el modelo no supo encajar se marcan,
 * porque son las que hay que mirar.
 */

export interface MapeoDeColumnasProps {
  /** Cabeceras del archivo que no son nuestras. */
  cabeceras: string[];
  /** Cabecera → campo del CRM, o `SIN_COLUMNA` para no importarla. */
  valor: Record<string, string>;
  alCambiar(cabecera: string, campo: string): void;
  cargando: boolean;
  /** Cabeceras que la IA no supo encajar: se señalan para revisarlas. */
  sinProponer: string[];
}

export const MapeoDeColumnas = ({
  cabeceras,
  valor,
  alCambiar,
  cargando,
  sinProponer,
}: MapeoDeColumnasProps) => {
  const translate = useTranslate();

  // Un campo ya usado por otra columna no se ofrece dos veces: dos columnas
  // al mismo campo harían que una pisara a la otra en silencio.
  const usados = new Set(
    Object.entries(valor)
      .filter(([, campo]) => campo && campo !== SIN_COLUMNA)
      .map(([, campo]) => campo),
  );

  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <AlertDescription className="flex flex-row items-center gap-2">
          {cargando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {translate(
            cargando
              ? "resources.contacts.import.mapping.loading"
              : "resources.contacts.import.mapping.intro",
            { smart_count: cabeceras.length },
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-2">
        {cabeceras.map((cabecera) => {
          const elegido = valor[cabecera] ?? SIN_COLUMNA;
          const dudosa = sinProponer.includes(cabecera);
          return (
            <div key={cabecera} className="flex items-center gap-3">
              <div className="w-1/2 min-w-0">
                <p className="truncate text-sm font-medium" title={cabecera}>
                  {cabecera}
                </p>
                {dudosa && (
                  <p className="text-xs text-muted-foreground">
                    {translate("resources.contacts.import.mapping.unknown")}
                  </p>
                )}
              </div>
              <Select
                value={elegido}
                onValueChange={(campo) => alCambiar(cabecera, campo)}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_COLUMNA}>
                    {translate("resources.contacts.import.mapping.skip")}
                  </SelectItem>
                  {CAMPOS_DE_CONTACTO.filter(
                    (campo) =>
                      campo.value === elegido || !usados.has(campo.value),
                  ).map((campo) => (
                    <SelectItem key={campo.value} value={campo.value}>
                      {campo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
