"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

/**
 * Grande box de contenu repliable — composant transversal.
 * Repliée : en-tête (titre + actions) reste visible.
 * Ne pas utiliser pour KPI individuels, badges, champs ou lignes d’inventaire.
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = "",
  badge,
  id,
  headerActions,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: ReactNode;
  id?: string;
  /** Actions visibles même box repliée (ex. bouton Modifier). */
  headerActions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

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
        {headerActions ? (
          <span
            className="collapsible-section__actions"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerActions}
          </span>
        ) : null}
      </summary>
      <div className="collapsible-section__body">{children}</div>
    </details>
  );
}
