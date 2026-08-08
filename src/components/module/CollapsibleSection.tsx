"use client";

import type { ReactNode } from "react";
import { useState } from "react";

/**
 * Grande box de contenu repliable — composant transversal.
 * Repliée : seul le titre (en-tête) reste visible.
 * Ne pas utiliser pour KPI individuels, badges, champs ou lignes d’inventaire.
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = "",
  badge,
  id,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: ReactNode;
  id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      id={id}
      className={`collapsible-section ${className}`.trim()}
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="collapsible-section__summary">
        <span className="collapsible-section__chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
        <span className="collapsible-section__title">{title}</span>
        {badge != null && badge !== "" ? (
          <span className="collapsible-section__badge">{badge}</span>
        ) : null}
      </summary>
      <div className="collapsible-section__body">{children}</div>
    </details>
  );
}
