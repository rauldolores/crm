import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import {
  useDataProvider,
  useListContext,
  useTranslate,
  type DataProvider,
} from "ra-core";
import { useEffect, useState } from "react";

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

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { DealColumn } from "./DealColumn";
import type { DealsByStage } from "./stages";
import { getDealsByStage } from "./stages";

export const DealListContent = () => {
  const { dealPipelines, dealLossReasons } = useConfigurationContext();
  const translate = useTranslate();
  const {
    data: unorderedDeals,
    isPending,
    refetch,
    filterValues,
  } = useListContext<Deal>();
  const dataProvider = useDataProvider();

  // Las columnas son las etapas del embudo activo (el del filtro de la
  // lista), no la union de todos los embudos.
  const embudoActivo =
    dealPipelines.find((embudo) => embudo.value === filterValues?.pipeline) ??
    dealPipelines[0];
  const etapas = embudoActivo.stages;

  const [dealsByStage, setDealsByStage] = useState<DealsByStage>(
    getDealsByStage([], etapas),
  );
  // Movimiento a una etapa de pérdida en espera de que se indique el motivo.
  const [perdidaPendiente, setPerdidaPendiente] = useState<{
    aplicar: (motivo?: string) => void;
    nombre: string;
  } | null>(null);
  const [motivoElegido, setMotivoElegido] = useState<string>("");

  useEffect(() => {
    if (unorderedDeals) {
      const newDealsByStage = getDealsByStage(unorderedDeals, etapas);
      if (!isEqual(newDealsByStage, dealsByStage)) {
        setDealsByStage(newDealsByStage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedDeals, etapas]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId;
    const destinationStage = destination.droppableId;
    const sourceDeal = dealsByStage[sourceStage][source.index]!;
    const destinationDeal = dealsByStage[destinationStage][
      destination.index
    ] ?? {
      stage: destinationStage,
      index: undefined, // undefined if dropped after the last item
    };

    const aplicar = (motivo?: string) => {
      // compute local state change synchronously
      setDealsByStage(
        updateDealStageLocal(
          sourceDeal,
          { stage: sourceStage, index: source.index },
          { stage: destinationStage, index: destination.index },
          dealsByStage,
        ),
      );

      // persist the changes
      updateDealStage(sourceDeal, destinationDeal, dataProvider, motivo).then(
        () => {
          refetch();
        },
      );
    };

    // Mover a una etapa de pérdida es el momento natural para preguntar por
    // qué: si no se pregunta aquí, nadie vuelve luego a rellenarlo.
    const esPerdida = (embudoActivo.lostStages ?? []).includes(
      destinationStage,
    );
    if (esPerdida && sourceStage !== destinationStage) {
      setMotivoElegido("");
      setPerdidaPendiente({ aplicar, nombre: sourceDeal.name });
      return;
    }

    aplicar();
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">
        {etapas.map((stage) => (
          <DealColumn
            stage={stage.value}
            deals={dealsByStage[stage.value]}
            key={stage.value}
          />
        ))}
      </div>

      <Dialog
        open={perdidaPendiente != null}
        onOpenChange={(abierto) => {
          if (!abierto) setPerdidaPendiente(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{translate("resources.deals.loss.title")}</DialogTitle>
            <DialogDescription>
              {translate("resources.deals.loss.description", {
                name: perdidaPendiente?.nombre ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          <Select value={motivoElegido} onValueChange={setMotivoElegido}>
            <SelectTrigger>
              <SelectValue
                placeholder={translate("resources.deals.fields.loss_reason")}
              />
            </SelectTrigger>
            <SelectContent>
              {dealLossReasons.map((motivo) => (
                <SelectItem key={motivo.value} value={motivo.value}>
                  {motivo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                perdidaPendiente?.aplicar();
                setPerdidaPendiente(null);
              }}
            >
              {translate("resources.deals.loss.skip")}
            </Button>
            <Button
              disabled={!motivoElegido}
              onClick={() => {
                perdidaPendiente?.aplicar(motivoElegido);
                setPerdidaPendiente(null);
              }}
            >
              {translate("resources.deals.loss.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
};

const updateDealStageLocal = (
  sourceDeal: Deal,
  source: { stage: string; index: number },
  destination: {
    stage: string;
    index?: number; // undefined if dropped after the last item
  },
  dealsByStage: DealsByStage,
) => {
  if (source.stage === destination.stage) {
    // moving deal inside the same column
    const column = dealsByStage[source.stage];
    column.splice(source.index, 1);
    column.splice(destination.index ?? column.length + 1, 0, sourceDeal);
    return {
      ...dealsByStage,
      [destination.stage]: column,
    };
  } else {
    // moving deal across columns
    const sourceColumn = dealsByStage[source.stage];
    const destinationColumn = dealsByStage[destination.stage];
    sourceColumn.splice(source.index, 1);
    destinationColumn.splice(
      destination.index ?? destinationColumn.length + 1,
      0,
      sourceDeal,
    );
    return {
      ...dealsByStage,
      [source.stage]: sourceColumn,
      [destination.stage]: destinationColumn,
    };
  }
};

const updateDealStage = async (
  source: Deal,
  destination: {
    stage: string;
    index?: number; // undefined if dropped after the last item
  },
  dataProvider: DataProvider,
  lossReason?: string,
) => {
  if (source.stage === destination.stage) {
    // moving deal inside the same column
    // Fetch all the deals in this stage (because the list may be filtered, but we need to update even non-filtered deals)
    const { data: columnDeals } = await dataProvider.getList("deals", {
      sort: { field: "index", order: "ASC" },
      pagination: { page: 1, perPage: 100 },
      filter: { stage: source.stage, pipeline: source.pipeline },
    });
    const destinationIndex = destination.index ?? columnDeals.length + 1;

    if (source.index > destinationIndex) {
      // deal moved up, eg
      // dest   src
      //  <------
      // [4, 7, 23, 5]
      await Promise.all([
        // for all deals between destinationIndex and source.index, increase the index
        ...columnDeals
          .filter(
            (deal) =>
              deal.index >= destinationIndex && deal.index < source.index,
          )
          .map((deal) =>
            dataProvider.update("deals", {
              id: deal.id,
              data: { index: deal.index + 1 },
              previousData: deal,
            }),
          ),
        // for the deal that was moved, update its index
        dataProvider.update("deals", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    } else {
      // deal moved down, e.g
      // src   dest
      //  ------>
      // [4, 7, 23, 5]
      await Promise.all([
        // for all deals between source.index and destinationIndex, decrease the index
        ...columnDeals
          .filter(
            (deal) =>
              deal.index <= destinationIndex && deal.index > source.index,
          )
          .map((deal) =>
            dataProvider.update("deals", {
              id: deal.id,
              data: { index: deal.index - 1 },
              previousData: deal,
            }),
          ),
        // for the deal that was moved, update its index
        dataProvider.update("deals", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    }
  } else {
    // moving deal across columns
    // Fetch all the deals in both stages (because the list may be filtered, but we need to update even non-filtered deals)
    const [{ data: sourceDeals }, { data: destinationDeals }] =
      await Promise.all([
        dataProvider.getList("deals", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { stage: source.stage, pipeline: source.pipeline },
        }),
        dataProvider.getList("deals", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { stage: destination.stage, pipeline: source.pipeline },
        }),
      ]);
    const destinationIndex = destination.index ?? destinationDeals.length + 1;

    await Promise.all([
      // decrease index on the deals after the source index in the source columns
      ...sourceDeals
        .filter((deal) => deal.index > source.index)
        .map((deal) =>
          dataProvider.update("deals", {
            id: deal.id,
            data: { index: deal.index - 1 },
            previousData: deal,
          }),
        ),
      // increase index on the deals after the destination index in the destination columns
      ...destinationDeals
        .filter((deal) => deal.index >= destinationIndex)
        .map((deal) =>
          dataProvider.update("deals", {
            id: deal.id,
            data: { index: deal.index + 1 },
            previousData: deal,
          }),
        ),
      // change the dragged deal to take the destination index and column
      dataProvider.update("deals", {
        id: source.id,
        data: {
          index: destinationIndex,
          stage: destination.stage,
          ...(lossReason ? { loss_reason: lossReason } : {}),
        },
        previousData: source,
      }),
    ]);
  }
};
