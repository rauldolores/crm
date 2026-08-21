import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfigurationLoader } from "../root/useConfigurationLoader";
import Header from "./Header";
import { BarraLateral } from "./BarraLateral";

export const Layout = ({ children }: { children: ReactNode }) => {
  useConfigurationLoader();
  return (
    <div className="flex min-h-screen">
      <BarraLateral />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="w-full max-w-screen-xl px-6 pt-4" id="main-content">
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
