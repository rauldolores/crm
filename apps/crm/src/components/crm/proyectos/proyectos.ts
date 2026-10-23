import { toSlug } from "@/lib/toSlug";

import type { Project } from "../types";

/**
 * Proyectos de la organización del lado de la pantalla: cómo se guardan
 * desde Ajustes. Las reglas de envío viven en el servidor
 * (lib/server/correo/proyectos.ts).
 */

const DIRECCION = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lo que se guarda: value estable (se genera del nombre una sola vez, porque
 * empresas y oportunidades lo guardan), dirección en minúsculas y un
 * predeterminado que exista.
 */
export const limpiarProyectos = (
  filas: Partial<Project>[] | undefined,
  predeterminado: string | undefined,
): { projects: Project[]; defaultProject: string } => {
  const projects = (filas ?? [])
    .filter((fila) => fila?.label?.trim())
    .map((fila) => {
      const email = fila.email?.trim().toLowerCase() || null;
      return {
        value: fila.value || toSlug(fila.label!.trim()),
        label: fila.label!.trim(),
        email,
        fromName: fila.fromName?.trim() || null,
      };
    });
  const existe = projects.some((p) => p.value === predeterminado);
  return {
    projects,
    defaultProject: existe ? predeterminado! : (projects[0]?.value ?? ""),
  };
};

/** Mensaje de error del formulario, o undefined si todo está bien. */
export const validarProyectos = (
  filas: Partial<Project>[] | undefined,
): string | undefined => {
  const direcciones = new Set<string>();
  for (const fila of filas ?? []) {
    const email = fila?.email?.trim().toLowerCase();
    if (!email) continue;
    if (!DIRECCION.test(email)) return "crm.projects.invalid_email";
    if (direcciones.has(email)) return "crm.projects.repeated_email";
    direcciones.add(email);
  }
  return undefined;
};

export const etiquetaDeProyecto = (
  proyectos: Project[],
  value: string | null | undefined,
): string | null =>
  value ? (proyectos.find((p) => p.value === value)?.label ?? value) : null;
