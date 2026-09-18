import { Handshake, Package, ReceiptText, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Catálogo de módulos activables por organización. Agregar un módulo nuevo
 * es agregar una entrada aquí (más su propia carpeta bajo src/components/crm)
 * — el mecanismo de activación (config.modules en crm.configuration) no
 * cambia. Ver CatalogoPage para dónde se prenden y apagan, y
 * BarraLateral.tsx para cómo un módulo activo aparece en la navegación.
 */
export interface ModuleDefinition {
  /** Clave estable: es la que se guarda en config.modules y no debe cambiar. */
  key: string;
  nameKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  /** Ruta a la que navega el ítem de esta sección en el menú lateral. */
  path: string;
  /**
   * Módulo que funciona con un proveedor externo conectado (Ajustes →
   * Conectores). Se activa solo al conectarlo y se apaga al desconectarlo.
   */
  connector?: "products" | "invoicing";
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: "customers",
    nameKey: "crm.modules.customers.name",
    descriptionKey: "crm.modules.customers.description",
    icon: Users,
    path: "/customer_summary",
  },
  {
    key: "affiliates",
    nameKey: "crm.modules.affiliates.name",
    descriptionKey: "crm.modules.affiliates.description",
    icon: Handshake,
    path: "/affiliates",
  },
  {
    key: "products",
    nameKey: "crm.modules.products.name",
    descriptionKey: "crm.modules.products.description",
    icon: Package,
    path: "/products",
    connector: "products",
  },
  {
    key: "invoicing",
    nameKey: "crm.modules.invoicing.name",
    descriptionKey: "crm.modules.invoicing.description",
    icon: ReceiptText,
    path: "/invoices",
    connector: "invoicing",
  },
];
