import type { Sale } from "../types";
import { SalesList } from "./SalesList";

/**
 * El equipo comercial se consulta, no se administra desde aquí.
 *
 * Dar de alta personas, asignarles roles o desactivarlas es competencia de
 * KontrolIA Auth: es donde viven los usuarios, las membresías y los permisos.
 * El CRM solo necesita leer la lista para poder asignar responsables de cuenta
 * a contactos, empresas y oportunidades.
 *
 * Por eso el recurso conserva `list` pero no `create` ni `edit`.
 */
export default {
  list: SalesList,
  recordRepresentation: (record: Sale) =>
    `${record.first_name} ${record.last_name}`,
};
