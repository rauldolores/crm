import { Package } from "lucide-react";
import {
  useGetList,
  useSimpleFormIterator,
  useSimpleFormIteratorItem,
  useTranslate,
} from "ra-core";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Product } from "../types";

/**
 * Botón por línea de cotización que abre el catálogo conectado (Shopify…):
 * al elegir un producto, rellena concepto, precio y referencia de esa
 * misma línea. El resto se sigue pudiendo escribir a mano. Sin el módulo
 * de productos activo no pinta nada.
 */
export const SelectorDeProducto = () => {
  const { modules } = useConfigurationContext();
  const conCatalogo = modules.products?.active ?? false;
  const translate = useTranslate();
  const { setValue } = useFormContext();
  const { source } = useSimpleFormIterator();
  const { index } = useSimpleFormIteratorItem();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const { data: productos } = useGetList<Product>(
    "products",
    {
      filter: {
        active: true,
        ...(busqueda.trim() ? { q: busqueda.trim() } : {}),
      },
      pagination: { page: 1, perPage: 10 },
      sort: { field: "name", order: "ASC" },
    },
    { enabled: abierto && conCatalogo },
  );

  if (!conCatalogo) return null;

  const elegir = (producto: Product) => {
    const campo = (nombre: string) => `${source}.${index}.${nombre}`;
    setValue(campo("description"), producto.name, { shouldDirty: true });
    setValue(campo("unit_price"), Number(producto.unit_price), {
      shouldDirty: true,
    });
    setValue(campo("product_ref"), producto.sku ?? producto.external_id, {
      shouldDirty: true,
    });
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="mt-auto shrink-0"
          aria-label={translate("crm.quotes.pick_product")}
          title={translate("crm.quotes.pick_product")}
        >
          <Package className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <Input
          autoFocus
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder={translate("crm.quotes.search_product")}
        />
        <ul className="mt-2 max-h-64 overflow-y-auto">
          {(productos ?? []).length === 0 ? (
            <li className="px-2 py-3 text-sm text-muted-foreground">
              {translate("crm.quotes.no_products")}
            </li>
          ) : (
            (productos ?? []).map((producto) => (
              <li key={producto.id}>
                <button
                  type="button"
                  onClick={() => elegir(producto)}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{producto.name}</span>
                    {producto.sku && (
                      <span className="block text-xs text-muted-foreground">
                        {producto.sku}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {Number(producto.unit_price).toLocaleString("es-MX", {
                      style: "currency",
                      currency: producto.currency || "MXN",
                    })}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
