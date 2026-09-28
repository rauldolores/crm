import type { PreguntaDeJev } from "../ia/clasificador";
import { hayClasificador, preguntarAlClasificador } from "../ia/clasificador";
import { getServiceClient } from "../supabase-service";

/**
 * ¿Los candidatos que ha encontrado el buscador son de verdad la misma
 * persona (o la misma empresa) que se está capturando?
 *
 * La búsqueda de parecidos sigue siendo del navegador y sigue siendo tonta a
 * propósito — un `ilike` sobre el nombre —: es instantánea, gratis y funciona
 * igual en la demo. Lo que no sabe hacer es distinguir a dos Juan García que
 * trabajan en empresas distintas de un mismo Juan García escrito de dos
 * maneras, y por eso el aviso saltaba de más y se acababa ignorando. Ese
 * juicio es el que se delega aquí en el modelo de decisión.
 *
 * Nunca decide por su cuenta: devuelve una probabilidad por candidato y
 * quien captura sigue viendo la ficha y eligiendo. Si no hay modelo o falla,
 * se devuelve el mapa vacío y quien llama se queda con su lista tal cual —
 * como antes de que esto existiera.
 */

export type RecursoConDuplicados = "contacts" | "companies";

/** Más candidatos que esto no se juzgan: el buscador ya trae los mejores. */
const MAX_CANDIDATOS = 5;

const CRITERIOS: Record<RecursoConDuplicados, { true: string; false: string }> =
  {
    contacts: {
      true: "Es la misma persona escrita de otra forma: un apodo o diminutivo, el nombre con o sin tildes, un apellido de más o de menos, un correo o un teléfono en común, o el mismo puesto en la misma empresa",
      false:
        "Son dos personas distintas que coinciden en el nombre: trabajan en empresas distintas, o sus correos y teléfonos no tienen nada que ver",
    },
    companies: {
      true: "Es la misma empresa escrita de otra forma: con o sin la forma jurídica (S.A. de C.V., S.L.), con o sin tildes, con abreviaturas, el nombre comercial frente al fiscal, o el mismo sitio web o RFC",
      false:
        "Son dos empresas distintas que comparten una palabra del nombre, o son sucursales o filiales que se llevan por separado",
    },
  };

const INSTRUCCION: Record<RecursoConDuplicados, string> = {
  contacts:
    "El contacto que se está capturando (state.nuevo) y el contacto que ya existe con este identificador son la misma persona",
  companies:
    "La empresa que se está capturando (state.nueva) y la empresa que ya existe con este identificador son la misma empresa",
};

const COLUMNAS: Record<RecursoConDuplicados, { tabla: string; select: string }> =
  {
    contacts: {
      // La vista trae el nombre de la empresa ya resuelto, que es justo el
      // dato que distingue a dos personas que se llaman igual.
      tabla: "contacts_summary",
      select:
        "id, first_name, last_name, title, email_jsonb, phone_jsonb, company_name",
    },
    companies: {
      tabla: "companies",
      select: "id, name, website, phone_number, city, tax_identifier",
    },
  };

/**
 * El formulario manda la empresa del contacto como id, que a un modelo no le
 * dice nada: se cambia por su nombre, que es justo el dato que separa a dos
 * personas que se llaman igual.
 */
async function conNombreDeEmpresa(
  organizacionId: string,
  nuevo: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { empresa_id: empresaId, ...resto } = nuevo;
  const id = Number(empresaId);
  if (!id) return resto;

  const { data } = await getServiceClient()
    .from("companies")
    .select("name")
    .eq("organization_id", organizacionId)
    .eq("id", id)
    .maybeSingle();

  return data?.name ? { ...resto, empresa: data.name } : resto;
}

/**
 * `nuevo` es lo que hay escrito en el formulario; `candidatos` son ids que el
 * navegador acaba de encontrar. Los ids NO se creen: se releen de la base
 * acotados a la organización de quien pregunta, así que lo único que aporta
 * el cliente es a quién mirar, nunca qué decir de él.
 */
export async function juzgarDuplicados(
  organizacionId: string,
  recurso: RecursoConDuplicados,
  nuevo: Record<string, unknown>,
  candidatos: number[],
): Promise<Record<number, number>> {
  if (!hayClasificador() || candidatos.length === 0) return {};

  const { tabla, select } = COLUMNAS[recurso];
  const { data: existentes } = await getServiceClient()
    .from(tabla)
    .select(select)
    .eq("organization_id", organizacionId)
    .in("id", candidatos.slice(0, MAX_CANDIDATOS));

  const filas = (existentes ?? []) as unknown as { id: number }[];
  if (filas.length === 0) return {};

  const preguntas: Record<string, PreguntaDeJev> = {};
  for (const fila of filas) {
    preguntas[`id_${fila.id}`] = {
      type: "noul",
      instructions: `${INSTRUCCION[recurso]} (identificador ${fila.id})`,
      criteria: CRITERIOS[recurso],
    };
  }

  const resultado = await preguntarAlClasificador(
    recurso === "contacts"
      ? { nuevo: await conNombreDeEmpresa(organizacionId, nuevo), existentes: filas }
      : { nueva: nuevo, existentes: filas },
    preguntas,
  );
  if (!resultado.ok || !resultado.respuestas) return {};

  const veredicto: Record<number, number> = {};
  for (const fila of filas) {
    const probabilidad = resultado.respuestas[`id_${fila.id}`]?.noul;
    if (typeof probabilidad === "number") veredicto[fila.id] = probabilidad;
  }
  return veredicto;
}
