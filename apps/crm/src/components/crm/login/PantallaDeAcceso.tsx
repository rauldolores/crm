import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * El marco de las pantallas de paso del acceso (ir a KontrolIA Auth y
 * volver): fondo vino, como el encabezado de página del panel, y una
 * tarjeta blanca con la marca. Vive fuera de <CRM>, así que no lee la
 * configuración: el logo es el de public/.
 */
const Marco = ({ children }: { children: ReactNode }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero px-4">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-linear-to-l from-hero-glow to-transparent"
    />
    <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-card px-8 py-10 text-center text-card-foreground shadow-hero">
      <div className="flex items-center gap-2.5">
        <img src="/vinqulia-icon.png" alt="" className="size-9 rounded-lg" />
        <span className="text-xl font-black tracking-tight">Vinqulia</span>
      </div>
      {children}
    </div>
  </div>
);

/** Mientras se va a KontrolIA Auth o se vuelve de ahí. */
export const PasoDeAcceso = ({
  texto,
  children,
}: {
  texto: string;
  children?: ReactNode;
}) => (
  <Marco>
    <Loader2 className="size-7 animate-spin text-primary" />
    <p className="text-sm font-medium text-muted-foreground">{texto}</p>
    {children}
  </Marco>
);

/** Cuando el acceso no se pudo completar. */
export const ErrorDeAcceso = ({
  mensaje,
  children,
}: {
  mensaje: string;
  children?: ReactNode;
}) => (
  <Marco>
    <AlertCircle className="size-9 text-destructive" />
    <h1 className="text-lg font-black tracking-tight">
      No se pudo iniciar sesión
    </h1>
    <p className="text-sm text-muted-foreground">{mensaje}</p>
    {children}
  </Marco>
);
