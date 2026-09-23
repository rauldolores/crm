/**
 * Lo que un cliente le pide a Kontrolia desde dentro del CRM.
 *
 * Los campos son los mismos que el formulario de vinqulia.com/enterprise
 * para que la solicitud entre en el CRM comercial igual que las del sitio
 * —con su estimación y su cotización en borrador— en vez de como un correo.
 * Ver app/api/facturacion/enterprise/route.ts.
 */

export type ModalidadEnterprise = "nube" | "onpremise";

export interface SolicitudEnterprise {
  nombre: string;
  empresa: string;
  email: string;
  telefono?: string;
  modalidad: ModalidadEnterprise;
  /** Cuántas personas usarían el CRM: de ahí sale la banda de precio. */
  usuarios: number;
  mensaje?: string;
  /** El plan que tiene hoy, para que ventas no tenga que buscarlo. */
  plan?: string;
}

export interface SolicitudDeFuncionalidad {
  nombre: string;
  empresa: string;
  email: string;
  mensaje: string;
  plan?: string;
  usuarios?: number;
}

export const MODALIDADES_ENTERPRISE: {
  valor: ModalidadEnterprise;
  clave: string;
}[] = [
  { valor: "nube", clave: "crm.billing.enterprise.mode_cloud" },
  { valor: "onpremise", clave: "crm.billing.enterprise.mode_onpremise" },
];
