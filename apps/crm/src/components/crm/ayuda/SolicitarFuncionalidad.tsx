import { Send } from "lucide-react";
import { useDataProvider, useGetIdentity, useNotify } from "ra-core";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { CrmDataProvider } from "../providers/types";

/**
 * «Funcionalidades a tu medida»: el cierre del centro de ayuda.
 *
 * Después de leer todo lo que el CRM hace, quien necesita algo más tiene
 * aquí mismo cómo pedirlo: un formulario corto que llega a la bandeja
 * comercial de KontrolIA (la misma que usa el plan Enterprise), sin salir de
 * la aplicación ni buscar un correo.
 */
export const SolicitarFuncionalidad = () => {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!nombre && identity?.fullName) setNombre(identity.fullName);
  }, [identity?.fullName, nombre]);

  const puedeEnviar = nombre.trim().length > 0 && mensaje.trim().length > 10;

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      await dataProvider.solicitarFuncionalidad(nombre.trim(), mensaje.trim());
      setEnviado(true);
      setMensaje("");
      notify("Solicitud enviada. Te contactamos en breve.", {
        type: "success",
      });
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud",
        { type: "error" },
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col gap-4 text-sm leading-relaxed">
        <p>
          Todo lo que has leído es lo que el CRM hace hoy. Si tu negocio
          necesita algo que no está (una integración con tu programa de
          facturación, un módulo propio de tu sector, un informe especial,
          acceso único para tu empresa, tu propia infraestructura), lo
          construimos para ti. Es lo que hacemos con los clientes del plan
          Enterprise, y también con proyectos concretos de cualquier plan.
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <b>Integraciones</b>: facturación, ERP, tienda online, centralita,
            calendario, WhatsApp Business, herramientas de marketing.
          </li>
          <li>
            <b>Módulos por sector</b>: lo que una inmobiliaria, una clínica o un
            taller llevan aparte hoy (visitas, historias, vehículos).
          </li>
          <li>
            <b>Informes y cuadros de mando</b> con tus métricas, exportables o
            enviados por correo cada semana.
          </li>
          <li>
            <b>Automatizaciones complejas</b> que van más allá de las reglas
            «cuando pase esto, haz aquello».
          </li>
          <li>
            <b>Enterprise</b>: infraestructura propia, SSO, SLA, despliegues
            personalizados y equipos grandes.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Cómo funciona: nos cuentas qué necesitas, te respondemos con preguntas
          si hacen falta y con una propuesta (alcance, plazo y precio). Si te
          encaja, lo construimos, lo probamos contigo y lo activamos en tu
          organización sin que tengas que instalar nada.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="ayuda-nombre">Tu nombre</Label>
          <Input
            id="ayuda-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ayuda-mensaje">Qué necesitas</Label>
          <Textarea
            id="ayuda-mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder="Cuéntanos el problema que quieres resolver, con qué sistemas trabajas y para cuándo lo necesitarías. Cuanto más concreto, mejor propuesta."
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Te respondemos al correo de tu cuenta.
          </span>
          <Button
            type="button"
            onClick={handleEnviar}
            disabled={!puedeEnviar || enviando}
          >
            <Send className="size-4" />
            {enviando ? "Enviando…" : enviado ? "Enviar otra" : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
};
