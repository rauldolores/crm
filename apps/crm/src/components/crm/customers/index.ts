import { Users } from "lucide-react";

import { CustomerList } from "./CustomerList";

/**
 * Módulo Clientes: la lista sale de la vista `customer_summary`. No hay
 * alta ni edición aquí — un cliente ES una empresa, así que se edita en su
 * ficha (pestaña «Cliente»). Crear una entidad aparte duplicaría la empresa.
 */
export default {
  list: CustomerList,
  icon: Users,
};
