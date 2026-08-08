"use client";

import type { ReactNode } from "react";
import { useState } from "react";

/**
 * Section repliable commune (fiches, cartographie, etc.).
 * Repliée : seul le titre reste visible.
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = "",
  badge,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className={`collapsible-section ${className}`.trim()}
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="collapsible-section__summary">
        <span className="collapsible-section__title">{title}</span>
        {badge ? (
          <span className="collapsible-section__badge">{badge}</span>
        ) : null}
      </summary>
      <div className="collapsible-section__body">{children}</div>
    </details>
  );
}
