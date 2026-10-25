import { Users } from "lucide-react";
import {
  useCanAccess,
  useGetList,
  useListContext,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Deal, Sale } from "../types";

/**
 * Reparte las oportunidades de una etapa entre varios comerciales, por
 * turnos. Su contacto, su empresa y las tareas abiertas pasan con ellas, para
 * que cada quien vea su cartera también en contactos y tareas.
 *
 * Solo administradores, como la acción en lote de al lado: el candado real
 * está en la ruta; esto evita enseñar un botón que iba a dar 403.
 */

/** Valor del selector «de quién» que significa «de cualquiera». */
const CUALQUIERA = "cualquiera";

interface Resultado {
  total: number;
  por_responsable: Record<string, number>;
}

export const RepartirButton = () => {
  const translate = useTranslate();
  const { filterValues } = useListContext<Deal>();
  const { canAccess } = useCanAccess({
    resource: "configuration",
    action: "edit",
  });
  const [abierto, setAbierto] = useState(false);

  if (!canAccess) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Users />
        {translate("resources.deals.reparto.action")}
      </Button>
      {abierto && (
        <DialogoDeReparto
          embudo={String(filterValues?.pipeline ?? "")}
          alCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
};

const nombre = (comercial: Sale) =>
  `${comercial.first_name} ${comercial.last_name}`.trim();

const DialogoDeReparto = ({
  embudo,
  alCerrar,
}: {
  embudo: string;
  alCerrar: () => void;
}) => {
  const translate = useTranslate();
  const refresh = useRefresh();
  const { dealPipelines } = useConfigurationContext();
  const [etapa, setEtapa] = useState("");
  const [deResponsable, setDeResponsable] = useState(CUALQUIERA);
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const etapas =
    dealPipelines.find((candidato) => candidato.value === embudo)?.stages ?? [];

  const { data: comerciales } = useGetList<Sale>("sales", {
    filter: { "disabled@neq": true },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "first_name", order: "ASC" },
  });

  // Solo interesa el total: el servidor resolverá el mismo conjunto.
  const { total: cuantas } = useGetList<Deal>(
    "deals",
    {
      filter: {
        pipeline: embudo,
        stage: etapa,
        "archived_at@is": null,
        ...(deResponsable !== CUALQUIERA
          ? { sales_id: Number(deResponsable) }
          : {}),
      },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "id", order: "ASC" },
    },
    { enabled: Boolean(etapa) },
  );

  const alternar = (id: number, marcado: boolean) =>
    setElegidos((actuales) =>
      marcado
        ? [...actuales, id]
        : actuales.filter((elegido) => elegido !== id),
    );

  const lanzar = async () => {
    setEnviando(true);
    setError(null);
    try {
      setResultado(
        await llamarApi<Resultado>("/api/reparto", {
          method: "POST",
          body: JSON.stringify({
            embudo,
            etapa,
            deResponsable:
              deResponsable === CUALQUIERA ? null : Number(deResponsable),
            responsables: elegidos,
          }),
        }),
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  const porCabeza =
    cuantas && elegidos.length ? Math.ceil(cuantas / elegidos.length) : 0;

  return (
    <Dialog open onOpenChange={(valor) => !valor && alCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.deals.reparto.title")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.deals.reparto.intro")}
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-2 text-sm">
            <p>
              {translate("resources.deals.reparto.done", {
                smart_count: resultado.total,
              })}
            </p>
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
              {(comerciales ?? [])
                .filter(
                  (comercial) =>
                    resultado.por_responsable[String(comercial.id)] != null,
                )
                .map((comercial) => (
                  <li key={comercial.id}>
                    {translate("resources.deals.reparto.per_person", {
                      name: nombre(comercial),
                      smart_count:
                        resultado.por_responsable[String(comercial.id)],
                    })}
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {translate("resources.deals.reparto.stage")}
              </p>
              <Select value={etapa} onValueChange={setEtapa}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={translate(
                      "resources.deals.reparto.stage_pick",
                    )}
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
                {translate("resources.deals.reparto.from")}
              </p>
              <Select value={deResponsable} onValueChange={setDeResponsable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CUALQUIERA}>
                    {translate("resources.deals.reparto.from_anyone")}
                  </SelectItem>
                  {(comerciales ?? []).map((comercial) => (
                    <SelectItem key={comercial.id} value={String(comercial.id)}>
                      {nombre(comercial)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {translate("resources.deals.reparto.to")}
              </p>
              <div className="space-y-2">
                {(comerciales ?? []).map((comercial) => {
                  const id = Number(comercial.id);
                  return (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={elegidos.includes(id)}
                        onCheckedChange={(marcado) =>
                          alternar(id, marcado === true)
                        }
                      />
                      {nombre(comercial)}
                    </label>
                  );
                })}
              </div>
            </div>

            {etapa && (
              <p className="text-sm text-muted-foreground">
                {translate("resources.deals.reparto.affects", {
                  smart_count: cuantas ?? 0,
                })}
                {porCabeza > 0 &&
                  ` ${translate("resources.deals.reparto.each", {
                    smart_count: porCabeza,
                  })}`}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={alCerrar}>
            {translate(
              resultado
                ? "resources.deals.reparto.close"
                : "resources.deals.reparto.cancel",
            )}
          </Button>
          {!resultado && (
            <Button
              onClick={lanzar}
              disabled={!etapa || elegidos.length === 0 || enviando || !cuantas}
            >
              {translate(
                enviando
                  ? "resources.deals.reparto.sending"
                  : "resources.deals.reparto.send",
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
