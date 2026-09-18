"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EncuestaDeTicket as Encuesta } from "@/lib/server/tickets/encuesta";

const OPCIONES = [
  { valor: 1, cara: "😞", texto: "Muy mala" },
  { valor: 2, cara: "🙁", texto: "Mala" },
  { valor: 3, cara: "😐", texto: "Regular" },
  { valor: 4, cara: "🙂", texto: "Buena" },
  { valor: 5, cara: "😀", texto: "Excelente" },
];

/**
 * Una sola pregunta y un comentario opcional. Sin sesión: habla con
 * /api/encuesta/<token>, que solo conoce este ticket. Una vez respondida,
 * la página solo agradece.
 */
export const EncuestaDeTicket = ({
  token,
  encuesta,
}: {
  token: string;
  encuesta: Encuesta;
}) => {
  const [rating, setRating] = useState<number | null>(encuesta.rating);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [respondida, setRespondida] = useState(encuesta.respondida);
  const [error, setError] = useState("");

  const enviar = async () => {
    if (!rating) return;
    setEnviando(true);
    setError("");
    try {
      const respuesta = await fetch(`/api/encuesta/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comentario }),
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        throw new Error(cuerpo.message || "No se pudo enviar tu respuesta.");
      }
      setRespondida(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  };

  if (respondida) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-green-600" />
        <p className="text-lg font-semibold">¡Gracias por tu respuesta!</p>
        <p className="text-sm text-neutral-600">
          Nos ayuda a atenderte mejor la próxima vez.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-neutral-600">
          {encuesta.contacto ? `Hola, ${encuesta.contacto}. ` : ""}
          Sobre tu solicitud{" "}
          <span className="font-medium text-neutral-900">
            #{encuesta.id} · {encuesta.subject}
          </span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">
          ¿Cómo fue la atención que recibiste?
        </h1>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => setRating(opcion.valor)}
            aria-pressed={rating === opcion.valor}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition-colors",
              rating === opcion.valor
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 hover:bg-neutral-50",
            )}
          >
            <span className="text-2xl" aria-hidden>
              {opcion.cara}
            </span>
            {opcion.texto}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comentario">
          ¿Algo que quieras contarnos? (opcional)
        </Label>
        <Textarea
          id="comentario"
          rows={3}
          maxLength={1000}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={enviar} disabled={!rating || enviando} size="lg">
        {enviando && <Loader2 className="animate-spin" />}
        Enviar respuesta
      </Button>
    </div>
  );
};
