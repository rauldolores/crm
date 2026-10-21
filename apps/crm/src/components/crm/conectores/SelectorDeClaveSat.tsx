import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useTranslate } from "ra-core";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { llamarApi } from "../misc/llamarApi";

/**
 * Elige una clave del SAT buscándola, en vez de escribirla de memoria.
 *
 * El catálogo de claves de producto tiene más de 52.000 filas: cargarlo entero
 * no es una opción, y pedir que alguien recuerde «81112100» tampoco — la
 * ayuda del campo llegaba a decir «si no la sabes, tu contador la tiene». Así
 * que se busca al teclear contra el proveedor conectado y se eligen de una
 * lista corta.
 *
 * Si todavía no hay conector guardado no hay catálogo que consultar, y
 * entonces esto se comporta como el campo de texto de siempre: se guarda la
 * conexión con la clave por defecto y se afina al volver a entrar. Bloquear el
 * formulario sería peor, porque la clave de API se pega en esta misma
 * pantalla.
 */

export interface ClaveDelSat {
  clave: string;
  descripcion: string;
  simbolo?: string | null;
}

export interface SelectorDeClaveSatProps {
  id?: string;
  catalogo: "productos-servicios" | "unidades";
  valor: string;
  onChange: (clave: string) => void;
  placeholder?: string;
}

/** Lo que se tarda en dejar de teclear antes de preguntar. */
const ESPERA_MS = 300;

const etiqueta = (c: ClaveDelSat) =>
  [c.clave, c.descripcion].filter(Boolean).join(" — ") +
  (c.simbolo ? ` (${c.simbolo})` : "");

export const SelectorDeClaveSat = ({
  id,
  catalogo,
  valor,
  onChange,
  placeholder,
}: SelectorDeClaveSatProps) => {
  const translate = useTranslate();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [claves, setClaves] = useState<ClaveDelSat[]>([]);
  const [cargando, setCargando] = useState(false);
  const [sinConector, setSinConector] = useState(false);
  // Lo que se enseña del valor ya elegido, para no mostrar un código pelado.
  const [elegida, setElegida] = useState<ClaveDelSat | null>(null);

  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    const reloj = setTimeout(async () => {
      setCargando(true);
      try {
        const r = await llamarApi<{
          sin_conector: boolean;
          claves: ClaveDelSat[];
        }>(
          `/api/conectores/facturacion/catalogo?catalogo=${catalogo}&q=${encodeURIComponent(texto)}`,
        );
        if (!vigente) return;
        setSinConector(r.sin_conector);
        setClaves(r.claves);
      } catch {
        // Sin resultados y sin aviso: la lista vacía ya lo dice, y el campo
        // sigue aceptando la clave escrita a mano.
        if (vigente) setClaves([]);
      } finally {
        if (vigente) setCargando(false);
      }
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(reloj);
    };
  }, [abierto, texto, catalogo]);

  // Sin conector, el campo es el de siempre. Se descubre al abrir, así que
  // solo se cae aquí después del primer intento de búsqueda.
  if (sinConector) {
    return (
      <div className="space-y-1.5">
        <Input
          id={id}
          value={valor}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(evento) => onChange(evento.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {translate("crm.connectors.sat.needs_connector")}
        </p>
      </div>
    );
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !valor && "text-muted-foreground")}>
            {elegida && elegida.clave === valor
              ? etiqueta(elegida)
              : valor || translate("crm.connectors.sat.choose")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        {/* `shouldFilter={false}`: filtra el servidor, que es el único que ve
            las 52.000 filas. Filtrar otra vez aquí escondería resultados. */}
        <Command shouldFilter={false}>
          <CommandInput
            value={texto}
            onValueChange={setTexto}
            placeholder={translate("crm.connectors.sat.search_placeholder")}
          />
          <CommandList>
            {cargando && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {translate("crm.connectors.sat.searching")}
              </div>
            )}
            {!cargando && (
              <CommandEmpty>
                {translate("crm.connectors.sat.no_results")}
              </CommandEmpty>
            )}
            <CommandGroup>
              {claves.map((c) => (
                <CommandItem
                  key={c.clave}
                  value={c.clave}
                  onSelect={() => {
                    onChange(c.clave);
                    setElegida(c);
                    setAbierto(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      c.clave === valor ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{etiqueta(c)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
