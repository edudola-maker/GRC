"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteLienObjet } from "@/app/liens/actions";
import { TYPE_OBJET_LABELS } from "@/lib/labels";
import type { TypeObjetMetier } from "@/generated/prisma/client";

export type ElementAssocieItem = {
  key: string;
  type: TypeObjetMetier;
  code: string;
  titre: string;
  href: string;
  libelle?: string | null;
  /** LienObjet id — absent pour les éléments « owned » (ex. tâches du projet). */
  lienId?: string;
  owned?: boolean;
};

export function ElementsAssociesList({
  items,
  retour,
  editable,
}: {
  items: ElementAssocieItem[];
  retour: string;
  editable: boolean;
}) {
  const types = useMemo(() => {
    const set = new Set(items.map((i) => i.type));
    return Array.from(set).sort();
  }, [items]);

  const [filter, setFilter] = useState<string>("");

  const filtered = filter
    ? items.filter((i) => i.type === filter)
    : items;

  if (items.length === 0) {
    return <p className="empty">Aucun élément associé pour le moment.</p>;
  }

  return (
    <div className="elements-associes__browser">
      {types.length > 1 ? (
        <div className="filter-bar" style={{ marginBottom: "0.75rem" }}>
          <button
            type="button"
            className={`chip${!filter ? " is-active" : ""}`}
            onClick={() => setFilter("")}
          >
            Tous
          </button>
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${filter === t ? " is-active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {TYPE_OBJET_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="elements-associes__list">
        {filtered.map((item) => (
          <li key={item.key} className="elements-associes__row">
            <Link href={item.href} className="elements-associes__link">
              <span className="muted">
                {TYPE_OBJET_LABELS[item.type] ?? item.type}
              </span>
              <span className="inventory-cell__value--code">{item.code}</span>
              <span className="elements-associes__title">{item.titre}</span>
              {item.libelle ? (
                <span className="muted">{item.libelle}</span>
              ) : null}
            </Link>
            {editable && item.lienId ? (
              <form action={deleteLienObjet}>
                <input type="hidden" name="retour" value={retour} />
                <input type="hidden" name="id" value={item.lienId} />
                <button type="submit" className="btn btn--ghost">
                  Retirer
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="empty">Aucun élément pour ce type.</p>
      ) : null}
    </div>
  );
}
