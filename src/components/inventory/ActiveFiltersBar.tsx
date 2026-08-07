import type { ReactNode } from "react";

/** Pastille des critères actifs + bouton réinitialiser. */
export function ActiveFiltersBar({
  chips,
  onReset,
  canReset,
}: {
  chips: string[];
  onReset: () => void;
  canReset: boolean;
}) {
  if (!canReset && chips.length === 0) return null;

  return (
    <div className="inventory__active-filters" aria-live="polite">
      <div className="inventory__active-filters-list">
        <span className="inventory__active-filters-label">Filtres actifs</span>
        {chips.length === 0 ? (
          <span className="muted">Aucun (inventaire complet)</span>
        ) : (
          chips.map((chip) => (
            <span key={chip} className="inventory__active-chip">
              {chip}
            </span>
          ))
        )}
      </div>
      {canReset ? (
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Réinitialiser
        </button>
      ) : null}
    </div>
  );
}

export function InventoryResetRow({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="inventory__reset-row">{children}</div>;
}
