import type { CouvertureItem } from "@/lib/processus-couverture";

export function ProcessusCouvertureBadges({
  items,
  compact = false,
}: {
  items: CouvertureItem[];
  compact?: boolean;
}) {
  return (
    <div
      className={`processus-cover${compact ? " processus-cover--compact" : ""}`}
      aria-label="Couverture gouvernance"
    >
      {items.map((c) => (
        <span
          key={c.key}
          className={`processus-cover__chip processus-cover__chip--${c.statut}`}
          title={c.detail}
        >
          <span aria-hidden>{c.statut === "ok" ? "✓" : "⚠"}</span> {c.label}
        </span>
      ))}
    </div>
  );
}
