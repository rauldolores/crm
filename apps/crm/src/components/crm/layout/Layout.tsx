import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";

import { GuardiaDePlan } from "../facturacion/GuardiaDePlan";
import { useConfigurationLoader } from "../root/useConfigurationLoader";
import Header from "./Header";
import { BarraLateral } from "./BarraLateral";

export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  return (
    <div className="flex min-h-screen">
      <GuardiaDePlan />
      <BarraLateral />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        {/* Contenido centrado con un tope de ancho: en pantallas anchas deja
            márgenes iguales a ambos lados en vez de un tercio vacío a la
            derecha. */}
        <main
          className="mx-auto w-full max-w-[1400px] px-6 pt-4 pb-10 lg:px-8"
          id="main-content"
        >
          <ErrorBoundary FallbackComponent={Error}>
            <Suspense
              fallback={<Skeleton className="h-12 w-12 rounded-full" />}
            >
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <Notification />
    </div>
  );
};
