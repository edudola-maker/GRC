import type { ReactNode } from "react";

/** Zone de pilotage commune à tous les modules. */
export function KpiZone({
  label = "Vue de pilotage",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <section className="page-zone page-zone--kpi" aria-label={label}>
      <p className="page-zone__label">{label}</p>
      <div className="stats">{children}</div>
    </section>
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
