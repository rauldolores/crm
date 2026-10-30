import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ListTodo } from "lucide-react";
import { useNotify, useStore, useTranslate } from "ra-core";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { diasHabiles, primeraEtapa } from "@/lib/miDia/etapas";
import type { ColaDeMiDia } from "@/lib/miDia/tipos";

import { llamarApi } from "../misc/llamarApi";
import { PageHero } from "../misc/Patrones";
import { MobileContent } from "../layout/MobileContent";
import MobileHeader from "../layout/MobileHeader";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { FilaDeMiDia } from "./FilaDeMiDia";

/**
 * «Mi día»: la pantalla de trabajo diario de un comercial. Arriba, sus
 * tareas que vencen hasta hoy; abajo, prospectos nuevos de la primera etapa
 * del embudo, tantos como su cuota. Cada fila se resuelve con un clic (ver
 * FilaDeMiDia) y desaparece de la cola.
 *
 * El embudo y la cuota son preferencias de cada quien y se recuerdan en este
 * navegador.
 */

const CUOTA_POR_DEFECTO = 20;
/** Más días que esto para repartir lo vencido ya no es «ponerse al día». */
const MAXIMO_DE_DIAS_PARA_REPARTIR = 60;

const limitesDelDia = () => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
};

export const MiDiaPage = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const isMobile = useIsMobile();
  const { dealPipelines } = useConfigurationContext();
  const [embudoGuardado, setEmbudoGuardado] = useStore<string | null>(
    "miDia.embudo",
    null,
  );
  const [cuota, setCuota] = useStore<number>("miDia.cuota", CUOTA_POR_DEFECTO);
  const [repartiendo, setRepartiendo] = useState(false);
  // Se fija al abrir la pantalla: si queda abierta pasada la medianoche,
  // basta con recargar.
  const { inicio, fin } = useMemo(limitesDelDia, []);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["mi-dia", embudoGuardado, cuota, inicio.toISOString()],
    queryFn: () => {
      const parametros = new URLSearchParams({
        desde: inicio.toISOString(),
        hasta: fin.toISOString(),
        cuota: String(cuota),
        ...(embudoGuardado ? { embudo: embudoGuardado } : {}),
      });
      return llamarApi<ColaDeMiDia>(`/api/mi-dia?${parametros}`);
    },
  });

  const embudo = dealPipelines.find((e) => e.value === data?.embudo);
  const etapaInicial = embudo ? primeraEtapa(embudo) : null;
  const vencidas = data?.vencidas ?? 0;

  const repartirVencidas = async () => {
    setRepartiendo(true);
    try {
      const dias = Math.min(
        Math.ceil(vencidas / Math.max(cuota, 1)),
        MAXIMO_DE_DIAS_PARA_REPARTIR,
      );
      const { reprogramadas } = await llamarApi<{ reprogramadas: number }>(
        "/api/mi-dia/repartir-vencidas",
        {
          method: "POST",
          body: JSON.stringify({
            antesDe: inicio.toISOString(),
            // El mismo embudo que la cola: se reparten las vencidas que cuenta.
            embudo: data?.embudo ?? null,
            fechas: diasHabiles(new Date(), Math.max(dias, 1)).map((d) =>
              d.toISOString(),
            ),
            porDia: Math.max(cuota, 1),
          }),
        },
      );
      notify("crm.my_day.spread_done", {
        messageArgs: { count: reprogramadas },
      });
      await refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error), {
        type: "error",
      });
    } finally {
      setRepartiendo(false);
    }
  };

  const alResolver = () => void refetch();

  const contenido = (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1.5 text-sm max-sm:w-full">
          <span className="text-muted-foreground">
            {translate("crm.my_day.pipeline")}
          </span>
          <Select
            value={data?.embudo ?? embudoGuardado ?? undefined}
            onValueChange={setEmbudoGuardado}
          >
            <SelectTrigger className="w-full sm:w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dealPipelines.map((opcion) => (
                <SelectItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-muted-foreground">
            {translate("crm.my_day.quota")}
          </span>
          <Input
            type="number"
            min={0}
            max={200}
            className="w-28"
            value={cuota}
            onChange={(evento) => {
              const valor = Number(evento.target.value);
              if (Number.isInteger(valor) && valor >= 0 && valor <= 200) {
                setCuota(valor);
              }
            }}
          />
        </label>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link to="/tasks">
            <ListTodo className="w-4 h-4" />
            {translate("crm.my_day.all_tasks")}
          </Link>
        </Button>
      </div>

      {isError ? (
        <p className="text-destructive">{translate("crm.my_day.error")}</p>
      ) : isPending ? (
        <p className="text-muted-foreground">{translate("ra.page.loading")}</p>
      ) : (
        <>
          <Seccion
            titulo={translate("crm.my_day.tasks_title")}
            cuenta={data.tareas.length}
            accion={
              vencidas > cuota && cuota > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={repartiendo}
                  onClick={repartirVencidas}
                  title={translate("crm.my_day.spread_help", {
                    count: vencidas,
                    quota: cuota,
                  })}
                >
                  <CalendarClock className="w-4 h-4" />
                  {translate("crm.my_day.spread")}
                </Button>
              ) : null
            }
          >
            {data.tareas.length === 0 ? (
              <Vacio>{translate("crm.my_day.tasks_empty")}</Vacio>
            ) : (
              data.tareas.map((fila) => (
                <FilaDeMiDia
                  key={fila.clave}
                  fila={fila}
                  inicioDelDia={inicio}
                  onHecho={alResolver}
                />
              ))
            )}
          </Seccion>

          <Seccion
            titulo={translate("crm.my_day.new_title")}
            cuenta={data.nuevos.length}
            subtitulo={
              etapaInicial
                ? translate("crm.my_day.new_subtitle", {
                    remaining: data.porContactar.toLocaleString("es-MX"),
                    stage: etapaInicial.label,
                  })
                : undefined
            }
          >
            {data.nuevos.length === 0 ? (
              <Vacio>{translate("crm.my_day.new_empty")}</Vacio>
            ) : (
              data.nuevos.map((fila) => (
                <FilaDeMiDia
                  key={fila.clave}
                  fila={fila}
                  inicioDelDia={inicio}
                  onHecho={alResolver}
                />
              ))
            )}
          </Seccion>
        </>
      )}
    </>
  );

  const trabajados = data?.trabajadosHoy ?? "–";

  if (isMobile) {
    return (
      <>
        <MobileHeader>
          <h1 className="text-xl font-semibold">
            {translate("crm.my_day.title")}
          </h1>
          <span className="text-sm">
            <strong className="tabular-nums">{trabajados}</strong>{" "}
            {translate("crm.my_day.worked_today").toLowerCase()}
          </span>
        </MobileHeader>
        <MobileContent>
          <div className="space-y-6">{contenido}</div>
        </MobileContent>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        compacto
        title={translate("crm.my_day.title")}
        description={translate("crm.my_day.description")}
        action={
          <div className="rounded-xl bg-white/10 px-4 py-2 text-center">
            <p className="text-3xl font-black tabular-nums leading-none">
              {trabajados}
            </p>
            <p className="mt-1 text-[10px] font-bold tracking-[0.15em] uppercase opacity-80">
              {translate("crm.my_day.worked_today")}
            </p>
          </div>
        }
      />
      {contenido}
    </div>
  );
};

MiDiaPage.path = "/mi-dia";

const Seccion = ({
  titulo,
  cuenta,
  subtitulo,
  accion,
  children,
}: {
  titulo: string;
  cuenta: number;
  subtitulo?: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold">
          {titulo}{" "}
          <span className="text-muted-foreground tabular-nums">{cuenta}</span>
        </h2>
        {subtitulo && (
          <p className="text-sm text-muted-foreground">{subtitulo}</p>
        )}
      </div>
      {accion}
    </div>
    <ul className="grid gap-3 lg:grid-cols-2">{children}</ul>
  </section>
);

const Vacio = ({ children }: { children: React.ReactNode }) => (
  <li className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground lg:col-span-2">
    {children}
  </li>
);
