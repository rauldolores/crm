import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Welcome = () => (
  <Card>
    <CardHeader className="px-4">
      <CardTitle>Bienvenido a Vinqulia</CardTitle>
    </CardHeader>
    <CardContent className="px-4">
      <p className="text-sm mb-4">
        Vinqulia centraliza tus contactos, empresas, oportunidades y tareas en
        un solo lugar, para que tu equipo sepa siempre en qué punto está cada
        relación comercial.
      </p>
      <p className="text-sm">
        Estás viendo la demostración, que funciona sobre datos de prueba: puedes
        explorar y modificar lo que quieras, y todo se reinicia al recargar la
        página.
      </p>
    </CardContent>
  </Card>
);
