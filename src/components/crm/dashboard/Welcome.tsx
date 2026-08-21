import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Welcome = () => (
  <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-[var(--primary-deep)] py-0 text-primary-foreground shadow-md">
    <div
      aria-hidden
      className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-20 right-24 size-40 rounded-full bg-white/5 blur-xl"
    />
    <CardContent className="relative px-6 py-6">
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Bienvenido a Vinqulia
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-foreground/90">
            Vinqulia centraliza tus contactos, empresas, oportunidades y tareas
            en un solo lugar, para que tu equipo sepa siempre en qué punto está
            cada relación comercial.
          </p>
          <p className="mt-3 text-xs text-primary-foreground/70">
            Estás viendo la demostración, que funciona sobre datos de prueba:
            puedes explorar y modificar lo que quieras, y todo se reinicia al
            recargar la página.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
