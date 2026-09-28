import * as Papa from "papaparse";
import { useCallback, useMemo, useRef, useState } from "react";

type Import =
  | {
      state: "idle";
    }
  | {
      state: "parsing";
    }
  | {
      state: "running" | "complete";

      rowCount: number;
      importCount: number;
      errorCount: number;

      // The remaining time in milliseconds
      remainingTime: number | null;
    }
  | {
      state: "error";

      error: Error;
    };

type usePapaParseProps<T> = {
  // The import batch size
  batchSize?: number;

  // processBatch returns the number of imported items
  processBatch(batch: T[]): Promise<void>;
};

export function usePapaParse<T>({
  batchSize = 10,
  processBatch,
}: usePapaParseProps<T>) {
  const importIdRef = useRef<number>(0);

  const [importer, setImporter] = useState<Import>({
    state: "idle",
  });

  const reset = useCallback(() => {
    setImporter({
      state: "idle",
    });
    importIdRef.current += 1;
  }, []);

  /**
   * `mapeo` renombra las cabeceras al leerlas: `{"Correo": "email_work"}`.
   * Así un CSV de otro sistema llega al importador con nuestros nombres y
   * nada de lo que viene después tiene que enterarse. Una cabecera que no
   * esté en el mapeo se queda tal cual, y entonces nadie la lee: así es como
   * se dice «esta columna no se importa».
   */
  const parseCsv = useCallback(
    (file: File, mapeo?: Record<string, string>) => {
      setImporter({
        state: "parsing",
      });

      const importId = importIdRef.current;
      Papa.parse<T>(file, {
        header: true,
        ...(mapeo
          ? {
              transformHeader: (cabecera: string) =>
                mapeo[cabecera.trim()] ?? cabecera,
            }
          : {}),
        skipEmptyLines: true,
        async complete(results) {
          if (importIdRef.current !== importId) {
            return;
          }

          setImporter({
            state: "running",
            rowCount: results.data.length,
            errorCount: results.errors.length,
            importCount: 0,
            remainingTime: null,
          });

          let totalTime = 0;
          for (let i = 0; i < results.data.length; i += batchSize) {
            if (importIdRef.current !== importId) {
              return;
            }

            const batch = results.data.slice(i, i + batchSize);
            try {
              const start = Date.now();
              await processBatch(batch);
              totalTime += Date.now() - start;

              const meanTime = totalTime / (i + batch.length);
              setImporter((previous) => {
                if (previous.state === "running") {
                  const importCount = previous.importCount + batch.length;
                  return {
                    ...previous,
                    importCount,
                    remainingTime:
                      meanTime * (results.data.length - importCount),
                  };
                }
                return previous;
              });
            } catch (error) {
              console.error("Failed to import batch", error);
              setImporter((previous) =>
                previous.state === "running"
                  ? {
                      ...previous,
                      errorCount: previous.errorCount + batch.length,
                    }
                  : previous,
              );
            }
          }

          setImporter((previous) =>
            previous.state === "running"
              ? {
                  ...previous,
                  state: "complete",
                  remainingTime: null,
                }
              : previous,
          );
        },
        error(error) {
          console.error(error);
          setImporter({
            state: "error",
            error,
          });
        },
        dynamicTyping: true,
      });
    },
    [batchSize, processBatch],
  );

  /**
   * Solo las cabeceras y el primer valor de cada una, para poder proponer el
   * mapeo antes de importar. `preview: 1` lee una fila y para: el archivo
   * puede tener cien mil.
   */
  const leerCabeceras = useCallback(
    (file: File) =>
      new Promise<{ cabeceras: string[]; muestra: Record<string, string> }>(
        (resolver) => {
          Papa.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            preview: 1,
            complete(resultado) {
              const cabeceras = resultado.meta.fields ?? [];
              const primera = resultado.data[0] ?? {};
              const muestra: Record<string, string> = {};
              for (const cabecera of cabeceras) {
                const valor = primera[cabecera];
                if (valor != null && valor !== "") {
                  muestra[cabecera] = String(valor);
                }
              }
              resolver({ cabeceras, muestra });
            },
            error() {
              resolver({ cabeceras: [], muestra: {} });
            },
          });
        },
      ),
    [],
  );

  return useMemo(
    () => ({
      importer,
      parseCsv,
      leerCabeceras,
      reset,
    }),
    [importer, parseCsv, leerCabeceras, reset],
  );
}
