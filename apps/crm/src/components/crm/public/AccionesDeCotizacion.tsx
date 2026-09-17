"use client";

import { CheckCircle2, Loader2, Printer, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuoteStatus } from "../types";

/**
 * Los botones de la página pública de una cotización: aceptar (con nombre y
 * correo de quien acepta, que quedan registrados), rechazar (con motivo
 * opcional) e imprimir o guardar en PDF desde el navegador.
 *
 * Sin sesión: habla con /api/cotizaciones/publica/<token>, que solo conoce
 * esta cotización.
 */
export const AccionesDeCotizacion = ({
  token,
  estado,
  nombreSugerido,
  correoSugerido,
}: {
  token: string;
  estado: QuoteStatus;
  nombreSugerido: string;
  correoSugerido: string;
}) => {
  const [estadoActual, setEstadoActual] = useState<QuoteStatus>(estado);
  const [modo, setModo] = useState<"ninguno" | "aceptar" | "rechazar">(
    "ninguno",
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const responder = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setEnviando(true);
    setError("");
    const datos = new FormData(evento.currentTarget);
    const cuerpo =
      modo === "aceptar"
        ? {
            accion: "aceptar",
            nombre: datos.get("nombre"),
            correo: datos.get("correo"),
          }
        : { accion: "rechazar", motivo: datos.get("motivo") };
    try {
      const respuesta = await fetch(`/api/cotizaciones/publica/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const resultado = (await respuesta.json().catch(() => ({}))) as {
        status?: QuoteStatus;
        message?: string;
      };
      if (!respuesta.ok) {
        setError(resultado.message ?? "No se pudo registrar tu respuesta.");
        return;
      }
      setEstadoActual(resultado.status ?? estadoActual);
      setModo("ninguno");
    } catch {
      setError("No se pudo registrar tu respuesta. Revisa tu conexión.");
    } finally {
      setEnviando(false);
    }
  };

  const imprimir = (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      Imprimir o guardar en PDF
    </Button>
  );

  if (estadoActual === "accepted") {
    return (
      <div className="flex flex-col gap-3 print:hidden">
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Cotización aceptada. Gracias; nos ponemos en marcha.
        </p>
        <div>{imprimir}</div>
      </div>
    );
  }
  if (estadoActual === "rejected") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-700 print:hidden">
        <XCircle className="h-5 w-5" />
        Cotización rechazada. Si cambias de opinión, pídenos una nueva.
      </p>
    );
  }
  if (estadoActual === "expired") {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 print:hidden">
        Esta cotización ya venció. Escríbenos y te preparamos una actualizada.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 print:hidden">
      {modo === "ninguno" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setModo("aceptar")}>
            <CheckCircle2 className="h-4 w-4" />
            Aceptar cotización
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setModo("rechazar")}
          >
            No me interesa
          </Button>
          {imprimir}
        </div>
      ) : (
        <form
          onSubmit={responder}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          {modo === "aceptar" ? (
            <>
              <p className="text-sm text-neutral-700">
                Al aceptar quedan registrados tu nombre, tu correo y la fecha.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cot-nombre">Tu nombre</Label>
                  <Input
                    id="cot-nombre"
                    name="nombre"
                    required
                    minLength={2}
                    maxLength={200}
                    defaultValue={nombreSugerido}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cot-correo">Tu correo</Label>
                  <Input
                    id="cot-correo"
                    name="correo"
                    type="email"
                    required
                    maxLength={200}
                    defaultValue={correoSugerido}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="cot-motivo">¿Nos dices por qué? (opcional)</Label>
              <Textarea
                id="cot-motivo"
                name="motivo"
                rows={3}
                maxLength={1000}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modo === "aceptar" ? "Confirmar aceptación" : "Confirmar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={enviando}
              onClick={() => setModo("ninguno")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
