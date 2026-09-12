import {
  Briefcase,
  Building2,
  Car,
  Factory,
  GraduationCap,
  HardHat,
  Home,
  Megaphone,
  ShieldCheck,
  Stethoscope,
  Truck,
} from "lucide-react";

import { agencias } from "./agencias";
import { clinicas } from "./clinicas";
import { constructoras } from "./constructoras";
import { distribuidoras } from "./distribuidoras";
import { educacion } from "./educacion";
import { inmobiliarias } from "./inmobiliarias";
import { manufactura } from "./manufactura";
import { refaccionarias } from "./refaccionarias";
import { seguros } from "./seguros";
import { serviciosProfesionales } from "./servicios-profesionales";
import type { Industria } from "./tipos";

export type { Industria } from "./tipos";

/**
 * Registro de industrias publicadas.
 *
 * El menú, el hub y el sitemap se generan a partir de esta lista: una
 * industria solo aparece navegable cuando su contenido existe, así que nunca
 * hay enlaces muertos. Para publicar una nueva, se escribe su archivo de
 * contenido y se añade aquí.
 */
export const INDUSTRIAS: Industria[] = [
  distribuidoras,
  serviciosProfesionales,
  inmobiliarias,
  constructoras,
  manufactura,
  clinicas,
  agencias,
  refaccionarias,
  educacion,
  seguros,
];

export const industriaPorSlug = (slug: string) =>
  INDUSTRIAS.find((industria) => industria.slug === slug);

/** Iconos disponibles para las industrias, por nombre. */
export const ICONOS: Record<string, React.ElementType> = {
  Truck,
  Briefcase,
  Home,
  HardHat,
  Factory,
  Stethoscope,
  Megaphone,
  Car,
  GraduationCap,
  ShieldCheck,
  Building2,
};

export const iconoDeIndustria = (nombre: string) =>
  ICONOS[nombre] ?? Building2;

/**
 * Hoja de ruta: industrias priorizadas que todavía no tienen página publicada.
 *
 * Se muestran en el hub como «en preparación», sin enlace, para que la
 * ausencia sea explícita y no un enlace roto. Cuando la lista está vacía, el
 * bloque no se renderiza: las diez industrias priorizadas ya están publicadas.
 *
 * Para abrir una segunda oleada, basta con añadir aquí sus nombres y motivos.
 */
export const HOJA_DE_RUTA: {
  nombre: string;
  icono: string;
  porQue: string;
  prioridad: number;
}[] = [];
