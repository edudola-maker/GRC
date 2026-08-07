import Link from "next/link";
import type { ReactNode } from "react";

export type InventoryField = {
  label: string;
  value: ReactNode;
  /** Mise en avant visuelle du contenu */
  emphasis?: "code" | "title" | "status" | "muted";
};

/**
 * Ligne d’inventaire labellisée (design system).
 * Ligne 1 = champs principaux, ligne 2 = métadonnées — chaque cellule a un intitulé.
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
  primary: InventoryField[];
  secondary?: InventoryField[];
}) {
  return (
    <Link
      href={href}
      className={`inventory-row inventory-row--${urgence}${archived ? " is-archived" : ""}`}
    >
      <div className="inventory-row__line inventory-row__line--primary">
        {primary.map((field) => (
          <InventoryFieldCell key={field.label} field={field} />
        ))}
      </div>
      {secondary && secondary.length > 0 ? (
        <div className="inventory-row__line inventory-row__line--secondary">
          {secondary.map((field) => (
            <InventoryFieldCell key={field.label} field={field} />
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function InventoryFieldCell({ field }: { field: InventoryField }) {
  const valueClass = field.emphasis
    ? `inventory-field__value inventory-field__value--${field.emphasis}`
    : "inventory-field__value";

  return (
    <div className="inventory-field">
      <span className="inventory-field__label">{field.label}</span>
      <span className={valueClass}>{field.value || "—"}</span>
    </div>
  );
}

export function InventoryEmpty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
