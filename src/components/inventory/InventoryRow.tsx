import Link from "next/link";
import type { ReactNode } from "react";

export type InventoryCell = {
  value: ReactNode;
  /** Mise en avant visuelle du contenu */
  emphasis?: "code" | "title" | "status" | "muted";
};

/**
 * En-tête de colonnes — affiché une seule fois au-dessus de la liste.
 */
export function InventoryColumns({
  columns,
  variant = "primary",
}: {
  columns: string[];
  variant?: "primary" | "secondary";
}) {
  return (
    <div
      className={`inventory-columns inventory-columns--${variant}`}
      role="row"
    >
      {columns.map((col) => (
        <span key={col} className="inventory-columns__cell" role="columnheader">
          {col}
        </span>
      ))}
    </div>
  );
}

/**
 * Ligne d’inventaire type tableau moderne.
 * Ligne 1 = valeurs alignées sur les colonnes principales ;
 * ligne 2 = méta alignée sur les colonnes secondaires.
 */
export function InventoryRow({
  href,
  urgence = "neutre",
  archived = false,
  primary,
  secondary,
}: {
  href: string;
  urgence?: "retard" | "bientot" | "a_venir" | "neutre" | string;
  archived?: boolean;
  primary: InventoryCell[];
  secondary?: InventoryCell[];
}) {
  return (
    <Link
      href={href}
      className={`inventory-row inventory-row--${urgence}${archived ? " is-archived" : ""}`}
    >
      <div className="inventory-row__line inventory-row__line--primary">
        {primary.map((cell, i) => (
          <InventoryCellView key={i} cell={cell} />
        ))}
      </div>
      {secondary && secondary.length > 0 ? (
        <div className="inventory-row__line inventory-row__line--secondary">
          {secondary.map((cell, i) => (
            <InventoryCellView key={i} cell={cell} secondary />
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function InventoryCellView({
  cell,
  secondary = false,
}: {
  cell: InventoryCell;
  secondary?: boolean;
}) {
  const valueClass = [
    "inventory-cell__value",
    cell.emphasis ? `inventory-cell__value--${cell.emphasis}` : null,
    secondary ? "inventory-cell__value--meta" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="inventory-cell">
      <span className={valueClass}>{cell.value || "—"}</span>
    </div>
  );
}

export function InventoryEmpty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

/**
 * Liste avec double en-tête de colonnes (principales + secondaires) + lignes.
 */
export function InventoryList({
  columns,
  secondaryColumns,
  children,
}: {
  columns: string[];
  secondaryColumns?: string[];
  children: ReactNode;
}) {
  return (
    <div className="inventory-table">
      <div className="inventory-columns-group" role="rowgroup">
        <InventoryColumns columns={columns} variant="primary" />
        {secondaryColumns && secondaryColumns.length > 0 ? (
          <InventoryColumns columns={secondaryColumns} variant="secondary" />
        ) : null}
      </div>
      <ul className="inventory-list">{children}</ul>
    </div>
  );
}
