import type { ReactNode } from "react";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";

/** Zone de pilotage commune à tous les modules (repliable). */
export function KpiZone({
  label = "Vue de pilotage",
  children,
  defaultOpen = true,
}: {
  label?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <CollapsibleSection
      title={label}
      defaultOpen={defaultOpen}
      className="page-zone page-zone--kpi collapsible-section--zone"
    >
      <div className="stats">{children}</div>
    </CollapsibleSection>
  );
}

export function KpiStat({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      {label}
    </div>
  );
}
