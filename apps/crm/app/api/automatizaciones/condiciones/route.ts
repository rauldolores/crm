import { juzgarCondicion } from "@/lib/server/automatizaciones/condicion";
import { registrarDecisiones } from "@/lib/server/ia/auditoria";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Juzga las condiciones en español que dejaron encoladas las
 * automatizaciones, y aplica la acción de las que se cumplen.
 *
 * La llama la propia base de datos (crm.despachar_condiciones, cada minuto por
 * pg_cron) porque un disparador de Postgres no puede llamar a la API del
 * clasificador. Mismo reparto que el correo de las automatizaciones: la base
 * encola, esto juzga, y la escritura vuelve a SQL
 * (crm.resolver_condicion_de_automatizacion), que es donde ya vivía.
 *
 * No lleva sesión de usuario: la autentica el secreto compartido que solo
 * conocen la base y esta ruta.
 */

const MAX_POR_TANDA = 25;

/** Espera creciente entre reintentos: 1, 3, 9 y 27 minutos. */
const esperaEnMinutos = (intentos: number) => 3 ** intentos;

interface FilaDeCola {
  id: number;
  organization_id: string;
  automation_id: number;
  ticket_id: number | null;
  deal_id: number | null;
  texto: string;
  attempts: number;
}

export async function POST(peticion: Request) {
  const supabase = getServiceClient();

  const { data: ajuste } = await supabase
    .from("internal_settings")
    .select("value")
    .eq("key", "dispatch_secret")
    .maybeSingle();

  const esperado = (ajuste?.value as string | undefined) ?? "";
  const recibido = peticion.headers.get("x-vinqulia-despacho") ?? "";
  if (!esperado || recibido !== esperado) {
    return Response.json({ message: "No autorizado." }, { status: 401 });
  }

  const { data: pendientes } = await supabase
    .from("automation_pending")
    .select(
      "id, organization_id, automation_id, ticket_id, deal_id, texto, attempts",
    )
    .is("resolved_at", null)
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at")
    .limit(MAX_POR_TANDA);

  const filas = (pendientes ?? []) as FilaDeCola[];
  if (!filas.length) return Response.json({ juzgadas: 0 });

  // Las condiciones de las reglas implicadas, en una sola consulta.
  const ids = [...new Set(filas.map((f) => f.automation_id))];
  const { data: reglas } = await supabase
    .from("automations")
    .select("id, condition_text")
    .in("id", ids);
  const condiciones = new Map<number, string>(
    (reglas ?? []).map((r) => [
      r.id as number,
      (r.condition_text ?? "") as string,
    ]),
  );

  let cumplidas = 0;
  let descartadas = 0;
  let reintentos = 0;

  for (const fila of filas) {
    const condicion = condiciones.get(fila.automation_id) ?? "";

    // La regla perdió su condición (o desapareció) mientras la fila esperaba:
    // se cierra sin actuar. Aplicarla sería ejecutar una regla que ya no dice
    // lo que decía cuando se encoló.
    if (!condicion) {
      await supabase.rpc("resolver_condicion_de_automatizacion", {
        pendiente_id: fila.id,
        se_cumple: false,
        confianza: null,
      });
      descartadas++;
      continue;
    }

    const juicio = await juzgarCondicion(condicion, fila.texto);

    // Sin respuesta del modelo no se decide nada: se reintenta con espera
    // creciente y, al agotar los intentos, la fila se queda sin resolver y a
    // la vista en la cola. Nunca se actúa a ciegas.
    if (juicio.probabilidad === null && juicio.motivo === "sin-respuesta") {
      await supabase
        .from("automation_pending")
        .update({
          attempts: fila.attempts + 1,
          next_attempt_at: new Date(
            Date.now() + esperaEnMinutos(fila.attempts + 1) * 60_000,
          ).toISOString(),
        })
        .eq("id", fila.id);
      reintentos++;
      continue;
    }

    // Sin clave de clasificador en el despliegue, ninguna regla con condición
    // puede cumplirse nunca. Se resuelve como «no» para no reintentar sin fin,
    // pero se deja dicho en el registro: es una mala configuración, no un
    // resultado, y desde la cola solo se vería un `matched` en falso.
    if (juicio.motivo === "sin-clasificador") {
      console.error(
        "[automatizaciones] hay condiciones que juzgar y no hay TYPESAFE_API_KEY: ninguna regla con condición va a actuar",
      );
    }

    await supabase.rpc("resolver_condicion_de_automatizacion", {
      pendiente_id: fila.id,
      se_cumple: juicio.seCumple,
      confianza: juicio.probabilidad,
    });

    if (juicio.decision) {
      await registrarDecisiones(fila.organization_id, [
        {
          ...juicio.decision,
          entidad: fila.ticket_id
            ? { tabla: "tickets", id: fila.ticket_id }
            : fila.deal_id
              ? { tabla: "deals", id: fila.deal_id }
              : undefined,
        },
      ]);
    }

    if (juicio.seCumple) cumplidas++;
    else descartadas++;
  }

  return Response.json({
    juzgadas: filas.length,
    cumplidas,
    descartadas,
    reintentos,
  });
}
