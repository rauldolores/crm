import { ArrowUpRight, Lightbulb, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  GRUPOS,
  PREGUNTAS_FRECUENTES,
  normalizar,
  textoDeSeccion,
} from "./contenido";
import { SolicitarFuncionalidad } from "./SolicitarFuncionalidad";
import type { Bloque, Seccion } from "./tipos";

const ID_FAQ = "preguntas-frecuentes";
const ID_A_MEDIDA = "funcionalidades-a-medida";

/**
 * Centro de ayuda: una sola página larga con índice lateral, buscador y
 * enlaces profundos (?seccion=…), para que el «?» de la cabecera y la FAQ
 * puedan llevar a un punto concreto.
 *
 * Es una página, no un sitio aparte, a propósito: quien busca ayuda ya está
 * dentro de la aplicación y con sesión; mandarlo fuera es perderlo.
 */
export const AyudaPage = () => {
  const [busqueda, setBusqueda] = useState("");
  const [parametros] = useSearchParams();
  const seccionPedida = parametros.get("seccion");

  // Al llegar con ?seccion=… se desplaza hasta ella una vez montado el
  // contenido (que es estático, así que basta con el siguiente frame).
  useEffect(() => {
    if (!seccionPedida) return;
    const marco = requestAnimationFrame(() => {
      document
        .getElementById(seccionPedida)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(marco);
  }, [seccionPedida]);

  const termino = normalizar(busqueda.trim());
  const buscando = termino.length >= 2;

  const gruposVisibles = useMemo(() => {
    if (!buscando) return GRUPOS;
    return GRUPOS.map((grupo) => ({
      ...grupo,
      secciones: grupo.secciones.filter((seccion) =>
        textoDeSeccion(seccion).includes(termino),
      ),
    })).filter((grupo) => grupo.secciones.length > 0);
  }, [buscando, termino]);

  const preguntasVisibles = useMemo(() => {
    if (!buscando) return PREGUNTAS_FRECUENTES;
    return PREGUNTAS_FRECUENTES.filter((p) =>
      normalizar(`${p.pregunta} ${p.respuesta}`).includes(termino),
    );
  }, [buscando, termino]);

  const sinResultados =
    buscando && gruposVisibles.length === 0 && preguntasVisibles.length === 0;

  return (
    <div className="mx-auto mt-6 mb-24 flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Ayuda y documentación
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Qué es cada pantalla y para qué sirve, con ejemplos; todo lo que el
            sistema sabe hacer, y cómo pedir lo que aún no hace.
          </p>
        </div>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en la ayuda: «importar», «embudo», «correo»…"
            className="pl-9"
            aria-label="Buscar en la ayuda"
          />
        </div>
      </header>

      {sinResultados ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nada coincide con «{busqueda}». Prueba con otra palabra o cuéntanos
          qué buscabas en «Funcionalidades a tu medida», al final de la página.
        </p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Indice grupos={gruposVisibles} activa={seccionPedida} />

          <div className="flex min-w-0 flex-col gap-14">
            {gruposVisibles.map((grupo) => (
              <div key={grupo.id} className="flex flex-col gap-10">
                <h2
                  id={grupo.id}
                  className="scroll-mt-20 border-b pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {grupo.titulo}
                </h2>
                {grupo.secciones.map((seccion) => (
                  <SeccionDeAyuda key={seccion.id} seccion={seccion} />
                ))}
              </div>
            ))}

            {preguntasVisibles.length > 0 && (
              <div className="flex flex-col gap-6">
                <h2
                  id={ID_FAQ}
                  className="scroll-mt-20 border-b pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Preguntas frecuentes
                </h2>
                <Accordion
                  type="multiple"
                  className="rounded-xl border bg-card px-4"
                >
                  {preguntasVisibles.map((p) => (
                    <AccordionItem key={p.pregunta} value={p.pregunta}>
                      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                        {p.pregunta}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        <p>{p.respuesta}</p>
                        {p.seccion && (
                          <Link
                            to={`/ayuda?seccion=${p.seccion}`}
                            className="mt-2 inline-flex items-center gap-1 text-primary"
                          >
                            Leer más <ArrowUpRight className="size-3.5" />
                          </Link>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {!buscando && (
              <section
                id={ID_A_MEDIDA}
                className="scroll-mt-20 flex flex-col gap-6"
              >
                <div>
                  <h2 className="border-b pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    ¿Necesitas más?
                  </h2>
                  <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">
                    Funcionalidades a tu medida
                  </h3>
                </div>
                <SolicitarFuncionalidad />
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

AyudaPage.path = "/ayuda";

const Indice = ({
  grupos,
  activa,
}: {
  grupos: typeof GRUPOS;
  activa: string | null;
}) => (
  <nav
    aria-label="Índice de la ayuda"
    className="hidden lg:block sticky top-16 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-2 text-sm"
  >
    {grupos.map((grupo) => (
      <div key={grupo.id} className="mb-5">
        <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {grupo.titulo}
        </p>
        <ul className="flex flex-col">
          {grupo.secciones.map((seccion) => (
            <li key={seccion.id}>
              <Link
                to={`/ayuda?seccion=${seccion.id}`}
                className={cn(
                  "block rounded-md px-2 py-1 text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground",
                  activa === seccion.id && "bg-accent text-accent-foreground",
                )}
              >
                {seccion.titulo}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ))}
    <div className="mb-5">
      <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        Y además
      </p>
      <ul className="flex flex-col">
        <li>
          <Link
            to={`/ayuda?seccion=${ID_FAQ}`}
            className="block rounded-md px-2 py-1 text-muted-foreground no-underline hover:bg-muted hover:text-foreground"
          >
            Preguntas frecuentes
          </Link>
        </li>
        <li>
          <Link
            to={`/ayuda?seccion=${ID_A_MEDIDA}`}
            className="block rounded-md px-2 py-1 text-muted-foreground no-underline hover:bg-muted hover:text-foreground"
          >
            Funcionalidades a tu medida
          </Link>
        </li>
      </ul>
    </div>
  </nav>
);

const SeccionDeAyuda = ({ seccion }: { seccion: Seccion }) => (
  <section id={seccion.id} className="scroll-mt-20 flex flex-col gap-4">
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h3 className="font-display text-xl font-semibold tracking-tight">
          {seccion.titulo}
        </h3>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          {seccion.resumen}
        </p>
      </div>
      {seccion.ruta && (
        <Link
          to={seccion.ruta}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-foreground no-underline transition-colors hover:border-primary/40"
        >
          Abrir la pantalla <ArrowUpRight className="size-3.5" />
        </Link>
      )}
    </div>
    <div className="flex max-w-prose flex-col gap-4 text-sm leading-relaxed">
      {seccion.bloques.map((bloque, i) => (
        <BloqueDeAyuda key={i} bloque={bloque} />
      ))}
    </div>
  </section>
);

const BloqueDeAyuda = ({ bloque }: { bloque: Bloque }) => {
  switch (bloque.tipo) {
    case "parrafo":
      return <p>{bloque.texto}</p>;
    case "lista":
      return (
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          {bloque.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "pasos":
      return (
        <div className="flex flex-col gap-2">
          {bloque.titulo && <p className="font-medium">{bloque.titulo}</p>}
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-medium marker:text-primary">
            {bloque.pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </div>
      );
    case "ejemplo":
      return (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-xs font-semibold tracking-wider text-primary uppercase">
            {bloque.titulo}
          </p>
          <p>{bloque.texto}</p>
        </div>
      );
    case "consejo":
      return (
        <div className="flex gap-3 rounded-xl bg-accent/60 p-4 text-accent-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          <p>{bloque.texto}</p>
        </div>
      );
    case "tabla":
      return (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/60">
                {bloque.cabeceras.map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloque.filas.map((fila) => (
                <tr
                  key={fila[0]}
                  className="border-b last:border-b-0 align-top"
                >
                  {fila.map((celda, i) => (
                    <td
                      key={i}
                      className={cn("px-3 py-2", i === 0 && "font-medium")}
                    >
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};
