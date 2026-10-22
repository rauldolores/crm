import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import {
  useCanAccess,
  useGetList,
  useListContext,
  useTranslate,
} from "ra-core";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { llamarApi } from "../misc/llamarApi";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, EmailTemplate } from "../types";

/**
 * Manda el correo de una plantilla a todas las oportunidades de una etapa.
 *
 * No manda nada por sí mismo: encola, y el despachador que ya existe envía a
 * su ritmo (25 por minuto). Por eso el diálogo se puede cerrar sin cancelar
 * nada y se puede volver a abrir: el encargo vive en la base, no en esta
 * pantalla.
 *
 * Tampoco mueve etapas. Cada tarjeta se mueve cuando SU correo sale de
 * verdad, por la regla del disparador «se envía un correo». Mover aquí
 * afirmaría algo que todavía no ha pasado.
 *
 * Solo administradores: mandar miles de correos compromete la reputación del
 * dominio de toda la organización. El candado real está en la ruta; esto solo
 * evita enseñar un botón que iba a dar 403.
 */

interface Resultado {
  id: number | null;
  requested: number;
  enqueued: number;
  skipped_reasons: Record<string, number>;
}

interface Avance {
  requested: number;
  enqueued: number;
  enviados: number;
  pendientes: number;
  fallidos: number;
  ultimo_error: string | null;
  terminado: boolean;
}

export const AccionMasivaButton = () => {
  const translate = useTranslate();
  const { filterValues } = useListContext<Deal>();
  // El mismo candado que usa el resto de la interfaz para lo que es de la
  // organización y no de una persona (ver providers/commons/canAccess).
  const { canAccess } = useCanAccess({
    resource: "configuration",
    action: "edit",
  });
  const [abierto, setAbierto] = useState(false);

  if (!canAccess) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Send />
        {translate("resources.deals.bulk.action")}
      </Button>
      {abierto && (
        <DialogoDeAccionMasiva
          embudo={String(filterValues?.pipeline ?? "")}
          alCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
};

const DialogoDeAccionMasiva = ({
  embudo,
  alCerrar,
}: {
  embudo: string;
  alCerrar: () => void;
}) => {
  const translate = useTranslate();
  const { dealPipelines } = useConfigurationContext();
  const [etapa, setEtapa] = useState("");
  const [plantillaId, setPlantillaId] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const etapas =
    dealPipelines.find((candidato) => candidato.value === embudo)?.stages ?? [];

  const { data: plantillas } = useGetList<EmailTemplate>("email_templates", {
    filter: { active: true },
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Cuántas caen en el encargo. Se pide con perPage 1 porque solo interesa el
  // total: el servidor resolverá el mismo conjunto.
  const { total: cuantas } = useGetList<Deal>(
    "deals",
    {
      filter: { pipeline: embudo, stage: etapa, "archived_at@is": null },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "id", order: "ASC" },
    },
    { enabled: Boolean(etapa) },
  );

  const lanzar = async () => {
    setEnviando(true);
    setError(null);
    try {
      setResultado(
        await llamarApi<Resultado>("/api/acciones-masivas", {
          method: "POST",
          body: JSON.stringify({
            embudo,
            etapa,
            accion: "send_email",
            plantillaId: Number(plantillaId),
          }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(valor) => !valor && alCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{translate("resources.deals.bulk.title")}</DialogTitle>
          <DialogDescription>
            {translate("resources.deals.bulk.intro")}
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <Avance resultado={resultado} />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {translate("resources.deals.bulk.stage")}
              </p>
              <Select value={etapa} onValueChange={setEtapa}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={translate("resources.deals.bulk.stage_pick")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((candidata) => (
                    <SelectItem key={candidata.value} value={candidata.value}>
                      {candidata.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {translate("resources.deals.bulk.template")}
              </p>
              <Select value={plantillaId} onValueChange={setPlantillaId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={translate(
                      "resources.deals.bulk.template_pick",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(plantillas ?? []).map((plantilla) => (
                    <SelectItem key={plantilla.id} value={String(plantilla.id)}>
                      {plantilla.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {etapa && (
              <p className="text-sm text-muted-foreground">
                {translate("resources.deals.bulk.affects", {
                  smart_count: cuantas ?? 0,
                })}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={alCerrar}>
            {translate(
              resultado
                ? "resources.deals.bulk.close"
                : "resources.deals.bulk.cancel",
            )}
          </Button>
          {!resultado && (
            <Button
              onClick={lanzar}
              disabled={!etapa || !plantillaId || enviando || !cuantas}
            >
              {translate(
                enviando
                  ? "resources.deals.bulk.sending"
                  : "resources.deals.bulk.send",
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Lo que pasó y lo que va pasando. El desglose de omitidas es la parte útil:
 * «4.812 encolados» no dice nada sin «1.256 sin correo propio».
 */
const Avance = ({ resultado }: { resultado: Resultado }) => {
  const translate = useTranslate();
  const { data: avance } = useQuery({
    queryKey: ["accion-masiva", resultado.id],
    queryFn: () => llamarApi<Avance>(`/api/acciones-masivas/${resultado.id}`),
    enabled: resultado.id != null && resultado.enqueued > 0,
    // Mientras quede alguno esperando turno. El despachador manda 25 por
    // minuto, así que no tiene sentido preguntar más seguido que esto.
    refetchInterval: (consulta) =>
      consulta.state.data?.terminado ? false : 10_000,
  });

  const omitidas = Object.entries(resultado.skipped_reasons ?? {});

  return (
    <div className="space-y-3 text-sm">
      <p>
        {translate("resources.deals.bulk.queued", {
          smart_count: resultado.enqueued,
          total: resultado.requested,
        })}
      </p>

      {omitidas.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium">
            {translate("resources.deals.bulk.skipped")}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
            {omitidas.map(([motivo, cuantas]) => (
              <li key={motivo}>
                {translate(`resources.deals.bulk.reason.${motivo}`, {
                  smart_count: cuantas,
                  _: `${cuantas} · ${motivo}`,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {avance && (
        <div className="rounded-md border p-3">
          <p className="tabular-nums">
            {translate("resources.deals.bulk.progress", {
              sent: avance.enviados,
              total: avance.enqueued,
            })}
          </p>
          {avance.fallidos > 0 && (
            <p className="text-destructive">
              {translate("resources.deals.bulk.failed", {
                smart_count: avance.fallidos,
              })}
              {avance.ultimo_error ? ` — ${avance.ultimo_error}` : ""}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {translate(
              avance.terminado
                ? "resources.deals.bulk.finished"
                : "resources.deals.bulk.keeps_going",
            )}
          </p>
        </div>
      )}
    </div>
  );
};
