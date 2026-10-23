import { useGetList } from "ra-core";

/**
 * Cuántas conversaciones esperan respuesta, junto a «Bandeja» en el menú.
 * Se revisa cada minuto: un correo nuevo no avisa al navegador.
 */
export const ContadorDeBandeja = () => {
  const { total } = useGetList(
    "conversations",
    {
      filter: { status: "pending" },
      pagination: { page: 1, perPage: 1 },
    },
    { refetchInterval: 60_000 },
  );
  if (!total) return null;
  return (
    <span className="ml-auto rounded-full bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground">
      {total > 99 ? "99+" : total}
    </span>
  );
};
