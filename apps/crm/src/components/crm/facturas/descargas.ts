import { llamarApi } from "../misc/llamarApi";

/** Pide al servidor el enlace temporal del proveedor y lo abre. */
export const abrirDescarga = async (
  facturaId: number | string,
  formato: "pdf" | "xml",
): Promise<void> => {
  const { url } = await llamarApi<{ url: string }>(
    `/api/conectores/facturacion/${facturaId}/descargar?formato=${formato}`,
  );
  window.open(url, "_blank", "noopener");
};
