import { useEffect, useState } from "react";
import { useTranslate } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileContent } from "../layout/MobileContent";
import MobileHeader from "../layout/MobileHeader";
import { Markdown } from "./Markdown";
import { MobileBackButton } from "./MobileBackButton";

/**
 * El registro de cambios se descarga en tiempo de ejecucion desde
 * `public/CHANGELOG.md` en lugar de importarse como modulo. Vite lo resolvia
 * con el sufijo `?raw`, pero eso no es estandar: obligaba a registrar un
 * cargador propio para Markdown y ataba el contenido al empaquetado.
 */
const useChangelog = () => {
  const [contenido, setContenido] = useState("");

  useEffect(() => {
    let vigente = true;
    fetch("/CHANGELOG.md")
      .then((r) => (r.ok ? r.text() : ""))
      .then((texto) => {
        if (vigente) setContenido(texto);
      })
      .catch(() => {
        if (vigente) setContenido("");
      });
    return () => {
      vigente = false;
    };
  }, []);

  return contenido;
};

export const ChangelogPage = () => {
  const translate = useTranslate();
  const isMobile = useIsMobile();
  const changelogContent = useChangelog();

  if (isMobile) {
    return (
      <>
        <MobileHeader>
          <MobileBackButton to="/settings" />
          <div className="flex flex-1 min-w-0">
            <h1 className="text-xl font-semibold">
              {translate("crm.changelog.title")}
            </h1>
          </div>
        </MobileHeader>
        <MobileContent>
          <Markdown>{changelogContent}</Markdown>
        </MobileContent>
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8">
      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.changelog.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Markdown>{changelogContent}</Markdown>
        </CardContent>
      </Card>
    </div>
  );
};

ChangelogPage.path = "/changelog";
