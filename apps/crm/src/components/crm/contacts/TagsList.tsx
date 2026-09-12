import { RecordContextProvider, useRecordContext } from "ra-core";
import { ReferenceArrayField } from "@/components/admin/reference-array-field";
import { SingleFieldList } from "@/components/admin/single-field-list";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ColoredBadge = (props: any) => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Badge
      {...props}
      style={{ backgroundColor: record.color, border: 0 }}
      variant="outline"
      className={cn(
        "rounded-full border-transparent text-black font-normal",
        props.className,
      )}
    >
      {record.name}
    </Badge>
  );
};

/**
 * Cuántas etiquetas se muestran antes de resumir el resto en un "+N". Sin
 * este límite, un contacto con muchas etiquetas (frecuente cuando las pone
 * el servidor MCP o una integración externa) deformaba la fila de la lista.
 */
const MAX_ETIQUETAS_VISIBLES = 5;

export const TagsList = ({
  max = MAX_ETIQUETAS_VISIBLES,
}: {
  max?: number;
}) => {
  const record = useRecordContext();
  if (!record) return null;

  const tags: number[] = record.tags ?? [];
  // Las etiquetas se agregan al final (ver TagsListEdit), así que las
  // "últimas" son las más recientes: eso es lo que se muestra.
  const visibles = tags.slice(-max);
  const ocultas = tags.length - visibles.length;

  return (
    // ReferenceArrayField (el wrapper de admin/) no reenvía un prop `record`
    // a su controlador, así que la única forma de que lea un `tags` recortado
    // es ofrecérselo por contexto.
    <RecordContextProvider value={{ ...record, tags: visibles }}>
      <ReferenceArrayField
        className="inline-flex flex-wrap items-center gap-2"
        resource="contacts"
        source="tags"
        reference="tags"
      >
        <SingleFieldList>
          <ColoredBadge source="name" />
        </SingleFieldList>
        {ocultas > 0 && (
          <Badge variant="secondary" className="shrink-0 font-normal">
            +{ocultas}
          </Badge>
        )}
      </ReferenceArrayField>
    </RecordContextProvider>
  );
};
