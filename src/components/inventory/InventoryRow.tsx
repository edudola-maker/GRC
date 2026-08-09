import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

export type InventoryCell = {
  value: ReactNode;
  /** Mise en avant visuelle du contenu */
  emphasis?: "code" | "title" | "status" | "muted";
  /** Badge coloré pour le statut (fond de ligne reste neutre) */
  badgeTone?: StatusTone;
  /** Lien optionnel (ex. objet source) — hors du lien principal de la ligne */
  href?: string | null;
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
 * Ligne d’inventaire neutre — le statut porte la couleur via badge.
 */
export function InventoryRow({
  href,
  archived = false,
  primary,
  secondary,
}: {
  href: string;
  /** @deprecated Conservé pour compat ; n’applique plus de fond coloré. */
  urgence?: string;
  archived?: boolean;
  primary: InventoryCell[];
  secondary?: InventoryCell[];
}) {
  const sourceLinks = (secondary ?? []).filter((c) => c.href);

  const lines = (
    <>
      <div className="inventory-row__line inventory-row__line--primary">
        {primary.map((cell, i) => (
          <InventoryCellView key={i} cell={cell} />
        ))}
      </div>
      {secondary && secondary.length > 0 ? (
        <div className="inventory-row__line inventory-row__line--secondary">
          {secondary.map((cell, i) => (
            <InventoryCellView
              key={i}
              cell={{ ...cell, href: undefined }}
              secondary
            />
          ))}
        </div>
      ) : null}
    </>
  );

  if (sourceLinks.length > 0) {
    return (
      <div
        className={`inventory-row inventory-row--split${archived ? " is-archived" : ""}`}
      >
        <Link href={href} className="inventory-row__main">
          {lines}
        </Link>
        <div className="inventory-row__links">
          {sourceLinks.map((cell, i) => (
            <Link
              key={i}
              href={cell.href!}
              className="inventory-row__source-link"
            >
              Ouvrir l’objet
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`inventory-row${archived ? " is-archived" : ""}`}
    >
      {lines}
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
  if (cell.badgeTone != null || cell.emphasis === "status") {
    return (
      <div className="inventory-cell">
        <StatusBadge tone={cell.badgeTone ?? "neutral"}>
          {cell.value || "—"}
        </StatusBadge>
      </div>
    );
  }

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

/** Liste avec double en-tête de colonnes (principales + secondaires) + lignes. */
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
