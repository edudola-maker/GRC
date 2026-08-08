import Link from "next/link";
import type { ReactNode } from "react";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";

export type AttentionItem = {
  id: string;
  href: string;
  code: string;
  title: string;
  meta?: string;
};

/** Zone « À traiter » — sobre ; repliable. */
export function AttentionZone({
  label = "À traiter",
  items,
  max = 5,
  moreHint,
  defaultOpen = true,
}: {
  label?: string;
  items: AttentionItem[];
  max?: number;
  moreHint?: ReactNode;
  defaultOpen?: boolean;
}) {
  if (items.length === 0) return null;

  const visible = items.slice(0, max);
  const rest = items.length - visible.length;

  return (
    <CollapsibleSection
      title={label}
      defaultOpen={defaultOpen}
      badge={items.length}
      className="page-zone page-zone--attention collapsible-section--zone"
    >
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
    </CollapsibleSection>
  );
}
