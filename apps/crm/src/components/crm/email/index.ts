import { Mail } from "lucide-react";

import { PlantillaCreate } from "./PlantillaCreate";
import { PlantillaEdit } from "./PlantillaEdit";
import { PlantillaList } from "./PlantillaList";

/**
 * Plantillas de correo, como recurso normal del CRM: son contenido de la
 * organización, no configuración con secretos (eso vive en /correo y /ia).
 */
export default {
  list: PlantillaList,
  create: PlantillaCreate,
  edit: PlantillaEdit,
  icon: Mail,
  recordRepresentation: (registro: { name?: string }) => registro.name ?? "",
};
