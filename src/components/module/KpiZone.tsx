import type { ReactNode } from "react";
import {
  PilotageStrip,
  type PilotageItem,
} from "@/components/module/PilotageStrip";

export type { PilotageItem };

/**
 * Zone de pilotage — bandeau compact (plus de grandes cartes).
 * Préférer `items` ; `children` reste supporté en secours (grille dense).
 */
export function KpiZone({
  items,
  children,
  label = "Pilotage",
}: {
  items?: PilotageItem[];
  children?: ReactNode;
  label?: string;
  /** Ignoré — conservé pour compatibilité d’appel. */
  defaultOpen?: boolean;
}) {
  if (items && items.length > 0) {
    return <PilotageStrip items={items} label={label} />;
  }

  if (!children) return null;

  return (
    <div className="pilotage-strip pilotage-strip--legacy" aria-label={label}>
      <div className="stats stats--compact">{children}</div>
    </div>
  );
}

/** @deprecated Utiliser PilotageStrip items — conservé pour pages non migrées. */
export function KpiStat({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="stat stat--compact">
      <strong>{value}</strong>
      {label}
    </div>
  );
}
