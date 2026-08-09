import Link from "next/link";
import type { ReactNode } from "react";

export type PilotageItem = {
  value: ReactNode;
  label: string;
  /** Lien optionnel (ex. ?filtre=retard#inventaire). */
  href?: string;
  tone?: "default" | "ok" | "warn" | "danger";
};

/**
 * Synthèse de pilotage compacte — remplace les grosses cartes KPI
 * et la box autonome « À traiter ».
 */
export function PilotageStrip({
  items,
  label = "Pilotage",
}: {
  items: PilotageItem[];
  label?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="pilotage-strip" role="group" aria-label={label}>
      {items.map((item, index) => {
        const tone = item.tone ?? "default";
        const className = `pilotage-strip__item pilotage-strip__item--${tone}${
          item.href ? " is-link" : ""
        }`;
        const content = (
          <>
            <strong className="pilotage-strip__value">{item.value}</strong>
            <span className="pilotage-strip__label">
              {item.label}
              {item.href ? (
                <span className="pilotage-strip__arrow" aria-hidden>
                  {" "}
                  →
                </span>
              ) : null}
            </span>
          </>
        );

        return (
          <span key={`${item.label}-${index}`} className="pilotage-strip__cell">
            {index > 0 ? (
              <span className="pilotage-strip__sep" aria-hidden>
                |
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className={className}>
                {content}
              </Link>
            ) : (
              <span className={className}>{content}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** @deprecated Préférer PilotageStrip — conservé pour compatibilité locale. */
export { PilotageStrip as KpiZone };
