import { useTranslate } from "ra-core";

import { cn } from "@/lib/utils";

/**
 * Bandas fijas, no configurables por organización (a diferencia de
 * NoteStatus/Status.tsx): el usuario no pidió personalizarlas por ahora.
 */
const bandFor = (score: number) => {
  if (score >= 70) return { key: "hot", color: "#ef4444" } as const;
  if (score >= 40) return { key: "warm", color: "#f59e0b" } as const;
  return { key: "cold", color: "#3b82f6" } as const;
};

export const LeadScoreBadge = ({
  score,
  className,
}: {
  score: number | undefined | null;
  className?: string;
}) => {
  const translate = useTranslate();
  if (score == null) return null;
  const band = bandFor(score);

  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-1.5",
        className,
      )}
    >
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: band.color }}
      />
      <span className="text-sm text-muted-foreground tabular-nums">
        {score}
      </span>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {translate(`crm.contacts.lead_score.${band.key}`)}
      </div>
    </div>
  );
};
