import { criticiteNiveau } from "@/lib/labels";

/** Badge coloré selon la matrice 5×5 (même logique que RiskMatrix). */
export function CriticiteBadge({
  value,
  label,
}: {
  value: number | null | undefined;
  label?: string;
}) {
  if (value == null) {
    return <span className="criticite-pill criticite-pill--none">—</span>;
  }
  const niveau = criticiteNiveau(value);
  return (
    <span className={`criticite-pill criticite-pill--${niveau}`}>
      {label ? `${label} ${value}` : value}
    </span>
  );
}
