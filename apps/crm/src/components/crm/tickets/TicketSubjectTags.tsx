import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Paleta fija para las etiquetas del asunto: no vienen de un catálogo de la
 * organización (las escribe libremente el sistema que abre el ticket), así
 * que el color se deriva del propio texto para que la misma etiqueta luzca
 * siempre igual entre tickets.
 */
const PALETA = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
];

const colorPara = (texto: string) => {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) | 0;
  }
  return PALETA[Math.abs(hash) % PALETA.length];
};

// Solo la primera letra: la clase `capitalize` de Tailwind pone en mayúscula
// cada palabra, lo que deforma un motivo largo ya escrito con su propia
// puntuación ("Preferencia por asistencia directa" → "Preferencia Por
// Asistencia Directa"). Esto además pone en mayúscula la categoría, que
// llega en minúsculas ("other", "product").
const conMayusculaInicial = (texto: string) =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

export const TicketSubjectTags = ({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) => {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="outline"
          className={cn("border-0 font-normal", colorPara(tag))}
        >
          {conMayusculaInicial(tag)}
        </Badge>
      ))}
    </div>
  );
};
