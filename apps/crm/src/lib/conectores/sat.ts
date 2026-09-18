/**
 * Catálogos del SAT que hacen falta para pedir una factura: los que el
 * receptor tiene que elegir. Solo las claves que una pyme se encuentra;
 * el catálogo completo lo tiene el proveedor de facturación.
 */

export const REGIMENES_FISCALES = [
  { value: "601", label: "601 · General de Ley Personas Morales" },
  { value: "603", label: "603 · Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 · Sueldos y Salarios" },
  { value: "606", label: "606 · Arrendamiento" },
  { value: "612", label: "612 · Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "616", label: "616 · Sin obligaciones fiscales" },
  { value: "620", label: "620 · Sociedades Cooperativas de Producción" },
  { value: "621", label: "621 · Incorporación Fiscal" },
  { value: "622", label: "622 · Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "623", label: "623 · Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 · Coordinados" },
  { value: "625", label: "625 · Actividades Empresariales a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 · Régimen Simplificado de Confianza" },
];

export const USOS_DE_CFDI = [
  { value: "G03", label: "G03 · Gastos en general" },
  { value: "G01", label: "G01 · Adquisición de mercancías" },
  { value: "I04", label: "I04 · Equipo de cómputo y accesorios" },
  { value: "I08", label: "I08 · Otra maquinaria y equipo" },
  { value: "D10", label: "D10 · Pagos por servicios educativos" },
  { value: "S01", label: "S01 · Sin efectos fiscales" },
  { value: "CP01", label: "CP01 · Pagos" },
];

/** RFC de persona física (13) o moral (12), con homoclave. */
export const esRfcValido = (valor: string): boolean =>
  /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(valor.trim().toUpperCase());

export const esCodigoPostalValido = (valor: string): boolean =>
  /^\d{5}$/.test(valor.trim());
