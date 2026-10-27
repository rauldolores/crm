import { useState } from "react";
import { MessageCircle, CircleX, Send, Loader2 } from "lucide-react";
import {
  useDataProvider,
  useNotify,
  useRecordContext,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  ContenidoDeWhatsapp,
  OpcionesDeWhatsapp,
  VentanaDeConversacion,
} from "@/lib/whatsapp/plantillas";
import { variablesSinRellenar } from "@/lib/whatsapp/plantillas";
import {
  enlaceDeWhatsapp,
  telefonoParaWhatsapp,
} from "@/lib/whatsapp/telefono";
import type { Contact } from "../types";
import { PlantillaDeWhatsappInputs } from "./PlantillaDeWhatsappInputs";

type Modo = "plantilla" | "libre";

/**
 * Envía un WhatsApp real al contacto (no solo una nota informativa) y deja
 * constancia en su ficha. Solo aparece si tiene un teléfono registrado; va
 * al marcado como móvil si lo hay (ver `telefonoParaWhatsapp`).
 *
 * Si el CRM no tiene Twilio, abre el chat en wa.me con el WhatsApp de quien
 * lo pulsa, en vez de un diálogo que solo podría fallar. Mientras no se sabe
 * (la primera carga, o si la pregunta falla) también: wa.me siempre funciona.
 */
export const EnviarWhatsAppButton = () => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const [open, setOpen] = useState(false);

  // Una sola pregunta por sesión, compartida por todas las filas de «Mi día».
  const { data: conectado } = useQuery<boolean>({
    queryKey: ["whatsapp", "conectado"],
    queryFn: () => dataProvider.whatsappConectado(),
    staleTime: Infinity,
    retry: false,
  });

  const telefono = telefonoParaWhatsapp(record?.phone_jsonb);
  if (!telefono) return null;

  if (conectado !== true) {
    return (
      <Button asChild variant="outline" className="h-6" size="sm">
        <a
          href={enlaceDeWhatsapp(telefono.numero)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="w-4 h-4" />
          {translate("resources.contacts.send_whatsapp.action")}
        </a>
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-6 cursor-pointer"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="w-4 h-4" />
        {translate("resources.contacts.send_whatsapp.action")}
      </Button>
      {open && <EnviarWhatsAppDialog onClose={() => setOpen(false)} />}
    </>
  );
};

/** El aviso de arriba: qué deja hacer WhatsApp con este contacto ahora mismo. */
const avisoDeVentana = (ventana: VentanaDeConversacion) => {
  if (!ventana.comprobada)
    return "resources.contacts.send_whatsapp.window_unknown";
  return ventana.abierta
    ? "resources.contacts.send_whatsapp.window_open"
    : "resources.contacts.send_whatsapp.window_closed";
};

/**
 * Montado solo mientras está abierto: cada apertura vuelve a preguntar a
 * Twilio, porque la ventana de 24 h cambia (el contacto pudo escribir hace un
 * minuto) y el formulario empieza limpio sin tener que vaciarlo a mano.
 */
const EnviarWhatsAppDialog = ({ onClose }: { onClose: () => void }) => {
  const record = useRecordContext<Contact>();
  const notify = useNotify();
  const refresh = useRefresh();
  const translate = useTranslate();
  const dataProvider = useDataProvider();

  const [modoElegido, setModoElegido] = useState<Modo | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [sid, setSid] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});

  const {
    data: opciones,
    isPending: cargando,
    error: errorDeCarga,
  } = useQuery<OpcionesDeWhatsapp>({
    queryKey: ["whatsapp", "opciones", record?.id],
    queryFn: () => dataProvider.opcionesDeWhatsapp(record!.id),
    enabled: Boolean(record),
    gcTime: 0,
    retry: false,
  });

  const ventanaAbierta = Boolean(opciones?.ventana.abierta);
  // Por defecto, lo que WhatsApp permite: libre dentro de la ventana,
  // plantilla fuera. Y nunca libre si la ventana está cerrada.
  const modo: Modo =
    ventanaAbierta && modoElegido
      ? modoElegido
      : ventanaAbierta
        ? "libre"
        : "plantilla";

  const plantilla = opciones?.plantillas.find((p) => p.sid === sid);
  const listo =
    modo === "libre"
      ? Boolean(mensaje.trim())
      : Boolean(plantilla) &&
        variablesSinRellenar(plantilla!, valores).length === 0;

  const { mutateAsync, isPending: enviando } = useMutation({
    mutationFn: async () => {
      const contenido: ContenidoDeWhatsapp =
        modo === "libre"
          ? { mensaje }
          : { plantilla: { sid, variables: valores } };
      await dataProvider.enviarWhatsapp(record!.id, contenido);
    },
  });

  const elegirPlantilla = (nuevoSid: string) => {
    setSid(nuevoSid);
    // Casi todas las plantillas abren con «Hola {{1}}»: se adelanta el
    // nombre, que se ve en la vista previa y se cambia si no toca.
    const elegida = opciones?.plantillas.find((p) => p.sid === nuevoSid);
    const usaLaPrimera = elegida?.variables.some(({ clave }) => clave === "1");
    setValores(
      usaLaPrimera && record?.first_name ? { "1": record.first_name } : {},
    );
  };

  const handleEnviar = async () => {
    try {
      await mutateAsync();
      notify("resources.contacts.send_whatsapp.success", { type: "success" });
      refresh();
      onClose();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.contacts.send_whatsapp.error"),
        { type: "error" },
      );
    }
  };

  if (!record) return null;
  const telefono = telefonoParaWhatsapp(record.phone_jsonb);

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="md:min-w-lg max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.contacts.send_whatsapp.action")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.contacts.send_whatsapp.to", {
              phone: telefono?.numero ?? "",
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Va igualmente: muchos números de «Trabajo» son celulares. Pero si
            es un fijo no le llegará, y conviene que quien envía lo sepa. */}
        {telefono && !telefono.esMovil && (
          <p className="text-sm text-muted-foreground">
            {translate("resources.contacts.send_whatsapp.not_mobile")}
          </p>
        )}

        {cargando ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {translate("resources.contacts.send_whatsapp.checking")}
          </p>
        ) : !opciones ? (
          <p className="text-sm text-destructive">
            {errorDeCarga instanceof Error
              ? errorDeCarga.message
              : translate("resources.contacts.send_whatsapp.load_error")}
          </p>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                {translate(avisoDeVentana(opciones.ventana))}
              </AlertDescription>
            </Alert>

            <ToggleGroup
              type="single"
              variant="outline"
              value={modo}
              onValueChange={(valor) => {
                if (valor === "plantilla" || valor === "libre") {
                  setModoElegido(valor);
                }
              }}
              className="w-fit"
            >
              <ToggleGroupItem value="plantilla" className="px-4">
                {translate("resources.contacts.send_whatsapp.template")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="libre"
                className="px-4"
                disabled={!ventanaAbierta}
              >
                {translate("resources.contacts.send_whatsapp.free_text")}
              </ToggleGroupItem>
            </ToggleGroup>

            {modo === "plantilla" ? (
              <PlantillaDeWhatsappInputs
                plantillas={opciones.plantillas}
                error={opciones.errorDePlantillas}
                sid={sid}
                onSidChange={elegirPlantilla}
                valores={valores}
                onValorChange={(clave, valor) =>
                  setValores((actuales) => ({ ...actuales, [clave]: valor }))
                }
              />
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="texto-whatsapp">
                  {translate("resources.contacts.send_whatsapp.message")}
                </Label>
                <Textarea
                  id="texto-whatsapp"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={6}
                  maxLength={4096}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={enviando}>
            <CircleX />
            {translate("resources.contacts.send_whatsapp.cancel")}
          </Button>
          <Button onClick={handleEnviar} disabled={!listo || enviando}>
            <Send />
            {enviando
              ? translate("resources.contacts.send_whatsapp.sending")
              : translate("resources.contacts.send_whatsapp.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
