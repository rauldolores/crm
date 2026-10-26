import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import {
  ErrorDeResultado,
  registrarResultado,
} from "@/lib/server/miDia/resultado";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import type { ResultadoDeMiDia } from "@/lib/miDia/etapas";
import type { PeticionDeResultado } from "@/lib/miDia/tipos";

/**
 * Lo que pasó con un prospecto de «Mi día»: mueve la oportunidad, deja la
 * nota y cierra o reprograma la tarea (ver registrarResultado).
 */

const TIPOS: ResultadoDeMiDia["tipo"][] = [
  "mover",
  "quedarse",
  "posponer",
  "descartar",
];

const idOpcional = (valor: unknown): number | null =>
  Number.isInteger(valor) && Number(valor) > 0 ? Number(valor) : null;

/** El cuerpo, con cada campo comprobado: nunca se confía en lo que llega. */
function leerPeticion(cuerpo: unknown): PeticionDeResultado | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const datos = cuerpo as Record<string, unknown>;
  const resultado = datos.resultado as Record<string, unknown> | undefined;
  const tipo = resultado?.tipo as ResultadoDeMiDia["tipo"] | undefined;
  if (!tipo || !TIPOS.includes(tipo)) return null;

  const texto = (clave: string) =>
    typeof resultado?.[clave] === "string" ? (resultado[clave] as string) : "";
  const leido: ResultadoDeMiDia =
    tipo === "mover"
      ? { tipo, etapa: texto("etapa") }
      : tipo === "posponer"
        ? { tipo, fecha: texto("fecha") }
        : tipo === "descartar"
          ? { tipo, motivo: texto("motivo") }
          : { tipo };

  const peticion: PeticionDeResultado = {
    dealId: idOpcional(datos.dealId),
    contactId: idOpcional(datos.contactId),
    tareaId: idOpcional(datos.tareaId),
    canal: typeof datos.canal === "string" ? datos.canal : null,
    nota: typeof datos.nota === "string" ? datos.nota : null,
    resultado: leido,
  };
  return peticion.dealId || peticion.tareaId ? peticion : null;
}

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId, usuarioId } = auth.sesion;

  const comercialId = await comercialDeLaSesion(organizacionId, usuarioId);
  if (!comercialId) {
    return Response.json(
      {
        message: "Tu usuario no tiene ficha de comercial en esta organización.",
      },
      { status: 403 },
    );
  }

  const cuerpo = leerPeticion(await peticion.json().catch(() => null));
  if (!cuerpo) {
    return Response.json(
      { message: "Hacen falta la oportunidad o la tarea, y el resultado." },
      { status: 400 },
    );
  }

  try {
    await registrarResultado(organizacionId, comercialId, cuerpo);
  } catch (error) {
    if (error instanceof ErrorDeResultado) {
      return Response.json(
        { message: error.message },
        { status: error.estado },
      );
    }
    throw error;
  }
  return Response.json({ ok: true });
}
