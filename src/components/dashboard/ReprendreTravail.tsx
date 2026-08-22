"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "grc_recent_objects";

export type RecentItem = {
  href: string;
  label: string;
  at: number;
};

/** Enregistre l’objet courant dans « Reprendre » (localStorage). */
export function TrackRecentView({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: RecentItem[] = raw ? JSON.parse(raw) : [];
      const next = [
        { href, label, at: Date.now() },
        ...list.filter((i) => i.href !== href),
      ].slice(0, 8);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [href, label]);
  return null;
}

export function ReprendreTravail() {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <CollapsibleLike title="Reprendre">
      <ul className="reprendre-list">
        {items.slice(0, 3).map((i) => (
          <li key={i.href}>
            <Link href={i.href}>
              <span>{i.label}</span>
              <span className="muted">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </CollapsibleLike>
  );
}

function CollapsibleLike({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="collapsible-section" open>
      <summary className="collapsible-section__summary">
        <span className="collapsible-section__chevron" aria-hidden>
          ▾
        </span>
        <span className="collapsible-section__title">{title}</span>
      </summary>
      <div className="collapsible-section__body">{children}</div>
    </details>
  );
}
