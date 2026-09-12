import { Translate } from "ra-core";
import type { ReactNode } from "react";

export const FilterCategory = ({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <h3 className="flex flex-row items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase [&>svg]:size-3.5">
      {icon}
      <Translate i18nKey={label} />
    </h3>
    <div className="flex md:flex-col flex-wrap items-start md:pl-0">
      {children}
    </div>
  </div>
);
