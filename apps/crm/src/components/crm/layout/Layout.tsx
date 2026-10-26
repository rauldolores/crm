import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";

import { GuardiaDeAplicacion } from "../autorizacion/GuardiaDeAplicacion";
import { GuardiaDePlan } from "../facturacion/GuardiaDePlan";
import { useConfigurationLoader } from "../root/useConfigurationLoader";
import Header from "./Header";
import { AvisoDeExcedente } from "../facturacion/AvisoDeExcedente";
import { BarraLateral } from "./BarraLateral";
import { BandaDelEcosistema } from "./BandaDelEcosistema";
import { MarcoDeAjustes } from "../settings/MarcoDeAjustes";

export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  // La banda del ecosistema ocupa --kontrolia-band-height arriba (0 si no
  // se pinta): el alto mínimo la descuenta para no dejar un scroll de sobra.
  return (
    <div className="flex min-h-[calc(100vh_-_var(--kontrolia-band-height,0px))]">
      <BandaDelEcosistema />
      <GuardiaDeAplicacion />
      <GuardiaDePlan />
      <AvisoDeExcedente />
      <BarraLateral />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        {/* El contenido ocupa todo el ancho disponible: ninguna pantalla
            lleva tope propio, así aprovechan igual los monitores anchos. */}
        <main className="w-full px-6 pt-4 pb-10 lg:px-8" id="main-content">
          <ErrorBoundary FallbackComponent={Error}>
            <Suspense
              fallback={<Skeleton className="h-12 w-12 rounded-full" />}
            >
              <MarcoDeAjustes>{children}</MarcoDeAjustes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <Notification />
    </div>
  );
};
