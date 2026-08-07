import Link from "next/link";
import type { ReactNode } from "react";

export type InventoryCell = {
  value: ReactNode;
  /** Mise en avant visuelle du contenu */
  emphasis?: "code" | "title" | "status" | "muted";
  /** Préfixe inline discret (ex. « Échéance ») — ligne secondaire */
  prefix?: string;
};

/**
 * En-tête de colonnes — affiché une seule fois au-dessus de la liste.
 */
export function InventoryColumns({ columns }: { columns: string[] }) {
  return (
    <div className="inventory-columns" role="row">
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
 * Ligne 1 = valeurs alignées sur les colonnes ; ligne 2 = méta discrète.
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

  const display = cell.value || "—";

  return (
    <div className="inventory-cell">
      <span className={valueClass}>
        {cell.prefix ? (
          <>
            <span className="inventory-cell__prefix">{cell.prefix}</span>
            {" : "}
          </>
        ) : null}
        {display}
      </span>
    </div>
  );
}

export function InventoryEmpty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

/** Liste avec en-tête de colonnes + lignes. */
export function InventoryList({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="inventory-table">
      <InventoryColumns columns={columns} />
      <ul className="inventory-list">{children}</ul>
    </div>
  );
}
