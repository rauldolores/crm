import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Form, useRefresh, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormToolbar } from "@/components/admin/simple-form";
import { FileInput } from "@/components/admin/file-input";
import { FileField } from "@/components/admin/file-field";

import {
  cabecerasDesconocidas,
  SIN_COLUMNA,
} from "@/lib/importacion/camposDeContacto";

import { llamarApi } from "../misc/llamarApi";
import { usePapaParse } from "../misc/usePapaParse";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { MapeoDeColumnas } from "./MapeoDeColumnas";
import type { ContactImportSchema } from "./useContactImport";
import { useContactImport } from "./useContactImport";

export const ContactImportButton = () => {
  const translate = useTranslate();
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenModal}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Upload /> {translate("resources.contacts.import.button")}
      </Button>
      <ContactImportDialog open={modalOpen} onClose={handleCloseModal} />
    </>
  );
};

// Se sirve como archivo estatico en lugar de empotrarlo como URL de datos:
// el sufijo `?raw` de Vite no es estandar, y ademas el CSV completo viajaba
// codificado dentro del paquete de JavaScript.
const SAMPLE_URL = "/crm_contacts_sample.csv";

type ContactImportModalProps = {
  open: boolean;
  onClose(): void;
};

export function ContactImportDialog({
  open,
  onClose,
}: ContactImportModalProps) {
  const translate = useTranslate();
  const refresh = useRefresh();
  const {
    processBatch,
    duplicatesFound,
    reset: resetDuplicates,
  } = useContactImport();
  const {
    importer,
    parseCsv,
    leerCabeceras,
    reset: resetImporter,
  } = usePapaParse<ContactImportSchema>({
    batchSize: 10,
    processBatch,
  });
  const { contactCustomFields } = useConfigurationContext();

  const [file, setFile] = useState<File | null>(null);
  // Cabeceras del archivo que no son nuestras, y a qué campo va cada una.
  const [porMapear, setPorMapear] = useState<string[]>([]);
  const [mapeo, setMapeo] = useState<Record<string, string>>({});
  const [sinProponer, setSinProponer] = useState<string[]>([]);
  const [cargandoMapeo, setCargandoMapeo] = useState(false);

  useEffect(() => {
    if (importer.state === "complete") {
      refresh();
    }
  }, [importer.state, refresh]);

  const limpiarMapeo = () => {
    setPorMapear([]);
    setMapeo({});
    setSinProponer([]);
    setCargandoMapeo(false);
  };

  const handleFileChange = async (elegido: File | null) => {
    setFile(elegido);
    limpiarMapeo();
    if (!elegido) return;

    const { cabeceras, muestra } = await leerCabeceras(elegido);

    // Las columnas de campos personalizados se reconocen por su etiqueta o
    // por su clave (ver camposPersonalizadosCsv), así que no hay nada que
    // mapear en ellas.
    const personalizados = new Set(
      contactCustomFields.flatMap((campo) => [campo.label, campo.value]),
    );
    const desconocidas = cabecerasDesconocidas(cabeceras).filter(
      (cabecera) => !personalizados.has(cabecera),
    );
    if (!desconocidas.length) return;

    setPorMapear(desconocidas);
    // Todo a «no importar» de entrada: si la propuesta no llega, el archivo
    // se importa como se importaba antes en vez de inventarse columnas.
    setMapeo(Object.fromEntries(desconocidas.map((c) => [c, SIN_COLUMNA])));
    setCargandoMapeo(true);
    try {
      const { columnas } = await llamarApi<{
        columnas: { cabecera: string; campo: string | null }[];
      }>("/api/ia/importacion/mapeo", {
        method: "POST",
        body: JSON.stringify({ cabeceras: desconocidas, muestra }),
      });
      setMapeo((anterior) => ({
        ...anterior,
        ...Object.fromEntries(
          columnas
            .filter((columna) => columna.campo)
            .map((columna) => [columna.cabecera, columna.campo as string]),
        ),
      }));
      setSinProponer(
        columnas.filter((columna) => !columna.campo).map((c) => c.cabecera),
      );
    } catch {
      // Sin propuesta se mapea a mano: no es un error que valga un aviso,
      // porque la pantalla ya está pidiendo justo eso.
      setSinProponer(desconocidas);
    } finally {
      setCargandoMapeo(false);
    }
  };

  const startImport = () => {
    if (!file) return;
    // Solo las columnas con destino: una en «no importar» se queda con su
    // nombre original y nadie la lee.
    const renombres = Object.fromEntries(
      Object.entries(mapeo).filter(([, campo]) => campo !== SIN_COLUMNA),
    );
    parseCsv(file, Object.keys(renombres).length ? renombres : undefined);
  };

  const handleClose = () => {
    resetImporter();
    resetDuplicates();
    limpiarMapeo();
    onClose();
  };

  const handleReset = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetImporter();
    resetDuplicates();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <Form className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {translate("resources.contacts.import.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-2">
            {importer.state === "running" && (
              <div className="flex flex-col gap-2">
                <Alert>
                  <AlertDescription className="flex flex-row gap-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {translate("resources.contacts.import.running")}
                  </AlertDescription>
                </Alert>

                <div className="text-sm">
                  {translate("resources.contacts.import.progress", {
                    importCount: importer.importCount,
                    rowCount: importer.rowCount,
                    errorCount: importer.errorCount,
                  })}
                  {importer.remainingTime !== null && (
                    <>
                      {" "}
                      {translate(
                        "resources.contacts.import.remaining_time",
                      )}{" "}
                      <strong>
                        {millisecondsToTime(importer.remainingTime)}
                      </strong>
                      .{" "}
                      <button
                        onClick={handleReset}
                        className="text-red-600 underline hover:text-red-800"
                      >
                        {translate("resources.contacts.import.stop")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {importer.state === "error" && (
              <Alert variant="destructive">
                <AlertDescription>
                  {translate("resources.contacts.import.error")}
                </AlertDescription>
              </Alert>
            )}

            {importer.state === "complete" && (
              <>
                <Alert>
                  <AlertDescription>
                    {translate("resources.contacts.import.complete", {
                      importCount: importer.importCount,
                      errorCount: importer.errorCount,
                    })}
                  </AlertDescription>
                </Alert>
                {duplicatesFound.length > 0 && (
                  <Alert>
                    <AlertDescription className="flex flex-col gap-2">
                      <p>
                        {translate(
                          "resources.contacts.import.duplicates_found",
                          { count: duplicatesFound.length },
                        )}
                      </p>
                      <ul className="flex flex-col gap-1 text-sm">
                        {duplicatesFound.slice(0, 20).map((duplicado, i) => (
                          <li key={i}>
                            {duplicado.fila.first_name}{" "}
                            {duplicado.fila.last_name} →{" "}
                            <Link
                              to={`/contacts/${duplicado.existente.id}/show`}
                              target="_blank"
                              className="underline"
                            >
                              {translate(
                                "resources.contacts.import.existing_contact",
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {duplicatesFound.length > 20 && (
                        <p className="text-muted-foreground">
                          {translate(
                            "resources.contacts.import.duplicates_more",
                            { count: duplicatesFound.length - 20 },
                          )}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {importer.state === "idle" && (
              <>
                <Alert>
                  <AlertDescription className="flex flex-col gap-4">
                    {translate("resources.contacts.import.sample_hint")}
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={SAMPLE_URL}
                        download={"crm_contacts_sample.csv"}
                      >
                        {translate("resources.contacts.import.sample_download")}
                      </Link>
                    </Button>{" "}
                  </AlertDescription>
                </Alert>

                <FileInput
                  source="csv"
                  label="resources.contacts.import.csv_file"
                  accept={{ "text/csv": [".csv"] }}
                  onChange={handleFileChange}
                >
                  <FileField source="src" title="title" target="_blank" />
                </FileInput>

                {porMapear.length > 0 && (
                  <MapeoDeColumnas
                    cabeceras={porMapear}
                    valor={mapeo}
                    cargando={cargandoMapeo}
                    sinProponer={sinProponer}
                    alCambiar={(cabecera, campo) =>
                      setMapeo((anterior) => ({
                        ...anterior,
                        [cabecera]: campo,
                      }))
                    }
                  />
                )}
              </>
            )}
          </div>
        </Form>

        <div className="flex justify-start pt-6">
          <FormToolbar>
            {importer.state === "idle" ? (
              <Button onClick={startImport} disabled={!file}>
                {translate("resources.contacts.import.button")}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={importer.state === "running"}
              >
                {translate("ra.action.close")}
              </Button>
            )}
          </FormToolbar>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function millisecondsToTime(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (60 * 1000)) % 60);

  return `${minutes}m ${seconds}s`;
}
