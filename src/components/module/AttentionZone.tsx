import Link from "next/link";
import type { ReactNode } from "react";

export type AttentionItem = {
  id: string;
  href: string;
  code: string;
  title: string;
  meta?: string;
};

/** Zone « À traiter » — sobre ; le jaune/rouge reste réservé aux statuts. */
export function AttentionZone({
  label = "À traiter",
  items,
  max = 5,
  moreHint,
}: {
  label?: string;
  items: AttentionItem[];
  max?: number;
  moreHint?: ReactNode;
}) {
  if (items.length === 0) return null;

  const visible = items.slice(0, max);
  const rest = items.length - visible.length;

  return (
    <section
      className="page-zone page-zone--attention"
      aria-label="Éléments à traiter"
    >
      <p className="page-zone__label">{label}</p>
      <ul className="attention-list">
        {visible.map((item) => (
          <li key={item.id}>
            <Link href={item.href}>
              <span className="attention-list__code">{item.code}</span>
              <span className="attention-list__title">{item.title}</span>
              {item.meta ? (
                <span className="attention-list__meta">{item.meta}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p className="muted page-zone__note">
          {moreHint ?? (
            <>
              +{rest} autre{rest > 1 ? "s" : ""} — utiliser les filtres
              ci-dessous.
            </>
          )}
        </p>
      ) : null}
    </section>
  );
}
