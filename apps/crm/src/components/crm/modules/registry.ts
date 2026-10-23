import {
  HandCoins,
  Handshake,
  Inbox,
  Package,
  Mail,
  ReceiptText,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import { ContadorDeBandeja } from "../bandeja/ContadorDeBandeja";

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
  /** Número junto al nombre en el menú (lo pendiente), si el módulo tiene. */
  Contador?: ComponentType;
  /** Más entradas del menú lateral que aparecen con el módulo activo. */
  extraLinks?: { nameKey: string; path: string; icon: LucideIcon }[];
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: "inbox",
    nameKey: "crm.modules.inbox.name",
    descriptionKey: "crm.modules.inbox.description",
    icon: Mail,
    path: "/bandeja",
    Contador: ContadorDeBandeja,
  },
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
    // La bandeja del módulo de facturación: lo que falta timbrar.
    extraLinks: [
      {
        nameKey: "crm.customer_billing.inbox.title",
        path: "/por-facturar",
        icon: Inbox,
      },
      // Lo que ya se facturó y falta cobrar.
      {
        nameKey: "crm.customer_billing.collections.title",
        path: "/cobranza",
        icon: HandCoins,
      },
    ],
  },
];
