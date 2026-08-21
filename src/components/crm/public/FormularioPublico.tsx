"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * El formulario que un visitante ve al llegar a /f/[clave] o dentro del
 * iframe que el cliente incrustó en su propia web. No usa nada de ra-core:
 * corre fuera del árbol de <Admin>, para un visitante que nunca inició
 * sesión.
 *
 * `tipo` decide qué campos se piden: "lead" da de alta un contacto (y su
 * empresa) como hasta ahora; "ticket" además pide asunto y descripción, y
 * abre un ticket de soporte asociado al contacto que lo reporta.
 */
export const FormularioPublico = ({
  clave,
  titulo,
  tipo,
}: {
  clave: string;
  titulo: string;
  tipo: "lead" | "ticket";
}) => {
  const [estado, setEstado] = useState<
    "listo" | "enviando" | "hecho" | "error"
  >("listo");
  const [errorMensaje, setErrorMensaje] = useState("");

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setEstado("enviando");
    setErrorMensaje("");

    const datosFormulario = new FormData(evento.currentTarget);
    const cuerpo = Object.fromEntries(datosFormulario.entries());

    try {
      const respuesta = await fetch(`/api/formularios/${clave}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrorMensaje(
          resultado.message || "No se pudo enviar. Inténtalo de nuevo.",
        );
        setEstado("error");
        return;
      }

      setEstado("hecho");
    } catch {
      setErrorMensaje(
        "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.",
      );
      setEstado("error");
    }
  };

  if (estado === "hecho") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-green-600" />
          <p className="text-lg font-medium">¡Gracias!</p>
          <p className="text-sm text-muted-foreground">
            {tipo === "ticket"
              ? "Recibimos tu reporte. Nos pondremos en contacto contigo pronto."
              : "Recibimos tu mensaje. Nos pondremos en contacto contigo pronto."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {tipo === "ticket" ? "Reporta un problema" : "Contáctanos"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input id="nombre" name="nombre" required maxLength={200} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo">Correo electrónico *</Label>
            <Input
              id="correo"
              name="correo"
              type="email"
              required
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono" type="tel" maxLength={50} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="empresa">
              Empresa{tipo === "ticket" ? " *" : ""}
            </Label>
            <Input
              id="empresa"
              name="empresa"
              required={tipo === "ticket"}
              maxLength={200}
            />
          </div>

          {tipo === "ticket" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="asunto">Asunto *</Label>
                <Input id="asunto" name="asunto" required maxLength={200} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="descripcion">Describe el problema *</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  rows={4}
                  required
                  maxLength={5000}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" name="mensaje" rows={3} maxLength={5000} />
            </div>
          )}

          {/* Señuelo para bots: oculto a la vista y al lector de pantalla, con
              nombre poco sospechoso. Una persona nunca lo rellena. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="sitio_web">Sitio web</label>
            <input
              id="sitio_web"
              name="sitio_web"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {estado === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{errorMensaje}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={estado === "enviando"}>
            {estado === "enviando" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Enviar
          </Button>
        </form>
      </CardContent>
      <p className="pb-4 text-center text-xs text-muted-foreground">
        Formulario de {titulo}
      </p>
    </Card>
  );
};
