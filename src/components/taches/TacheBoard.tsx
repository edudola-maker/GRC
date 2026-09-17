"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  patchTacheBoard,
  undoTacheBoardPatch,
  type TacheBoardSnapshot,
} from "@/app/taches/actions";
import type { TacheInventoryItem } from "@/components/taches/TacheInventory";
import { toneFromStatut } from "@/components/ui/StatusBadge";
import {
  GROUP_BY_LABELS,
  TEMPORALITE_LABELS,
  TEMPORALITE_ORDER,
  groupByAllowsDrag,
  temporaliteBucket,
  type GroupByTaches,
} from "@/lib/taches-temporalite";

type Column = {
  key: string;
  label: string;
  count: number;
  retard: number;
  items: TacheInventoryItem[];
};

function buildColumns(
  items: TacheInventoryItem[],
  groupBy: GroupByTaches,
  responsables: { id: string; nom: string }[],
): Column[] {
  const map = new Map<string, Column>();

  const ensure = (key: string, label: string) => {
    if (!map.has(key)) {
      map.set(key, { key, label, count: 0, retard: 0, items: [] });
    }
    return map.get(key)!;
  };

  if (groupBy === "temporalite") {
    for (const b of TEMPORALITE_ORDER) {
      ensure(b, TEMPORALITE_LABELS[b]);
    }
  }

  for (const t of items) {
    let key: string;
    let label: string;
    switch (groupBy) {
      case "temporalite": {
        const bucket = temporaliteBucket(t.dateEcheance, new Date(), {
          ignoreRetard: !t.estOuverte,
        });
        key = bucket;
        label = TEMPORALITE_LABELS[bucket];
        break;
      }
      case "responsable":
        key = t.responsableId || "none";
        label = t.responsableNom || "Non attribué";
        break;
      case "statut":
        key = t.statut;
        label = t.statutLabel;
        break;
      case "priorite":
        key = t.priorite;
        label = t.prioriteLabel;
        break;
      case "objet":
        key = t.sourceType ?? "LIBRE";
        label = t.sourceType ?? "Libre";
        break;
      case "unite":
        key = t.uniteId;
        label = t.uniteNom;
        break;
      default:
        key = "all";
        label = "Toutes";
    }
    const col = ensure(key, label);
    col.items.push(t);
    col.count += 1;
    if (t.estRetard) col.retard += 1;
  }

  // Ordre stable
  if (groupBy === "temporalite") {
    return TEMPORALITE_ORDER.map((b) => map.get(b)!).filter(Boolean);
  }
  if (groupBy === "responsable") {
    const ordered = [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label, "fr"),
    );
    // Enrichir labels depuis responsables si besoin
    for (const c of ordered) {
      const r = responsables.find((x) => x.id === c.key);
      if (r) c.label = r.nom;
    }
    return ordered;
  }
  return [...map.values()];
}

export function TacheBoard({
  items,
  groupBy,
  onGroupByChange,
  responsables,
}: {
  items: TacheInventoryItem[];
  groupBy: GroupByTaches;
  onGroupByChange: (g: GroupByTaches) => void;
  responsables: { id: string; nom: string }[];
}) {
  const columns = useMemo(
    () => buildColumns(items, groupBy, responsables),
    [items, groupBy, responsables],
  );
  const canDrag = groupByAllowsDrag(groupBy);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    message: string;
    previous: TacheBoardSnapshot;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function onDrop(columnKey: string, tacheId: string) {
    if (!canDrag) return;
    setPendingId(tacheId);
    const input =
      groupBy === "statut"
        ? { id: tacheId, statut: columnKey }
        : { id: tacheId, responsableId: columnKey };
    const res = await patchTacheBoard(input);
    setPendingId(null);
    if (!res.ok) {
      setToast({
        message: res.error,
        previous: { id: "", statut: "", responsableId: "" },
      });
      return;
    }
    if (res.message === "Aucun changement") return;
    setToast({ message: res.message, previous: res.previous });
    startTransition(() => router.refresh());
  }

  async function onUndo() {
    if (!toast?.previous.id) return;
    await undoTacheBoardPatch(toast.previous);
    setToast(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="tache-board">
      <div className="tache-board__toolbar">
        <label className="field field--inline">
          <span className="field__label">Regrouper par</span>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as GroupByTaches)}
          >
            {(Object.keys(GROUP_BY_LABELS) as GroupByTaches[]).map((g) => (
              <option key={g} value={g}>
                {GROUP_BY_LABELS[g]}
              </option>
            ))}
          </select>
        </label>
        {!canDrag ? (
          <p className="muted tache-board__hint">
            Temporalité / priorité / objet : regroupement d’affichage uniquement
            (pas de glisser-déposer ambigu).
          </p>
        ) : (
          <p className="muted tache-board__hint">
            Glisser une carte pour modifier le{" "}
            {groupBy === "statut" ? "statut" : "responsable"}.
          </p>
        )}
      </div>

      <div className="tache-board__columns" role="list">
        {columns.map((col) => (
          <section
            key={col.key}
            className="tache-board__col"
            role="listitem"
            onDragOver={(e) => {
              if (canDrag) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/tache-id");
              if (id) void onDrop(col.key, id);
            }}
          >
            <header className="tache-board__col-head">
              <h3>{col.label}</h3>
              <span className="bucket-count">{col.count}</span>
              {col.retard > 0 ? (
                <span className="bucket-count bucket-count--danger">
                  {col.retard} retard
                </span>
              ) : null}
            </header>
            <ul className="tache-board__cards">
              {col.items.map((t) => (
                <li key={t.id}>
                  <article
                    className={`tache-board__card${pendingId === t.id ? " is-pending" : ""}${t.estRetard ? " is-retard" : ""}`}
                    draggable={canDrag}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/tache-id", t.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <Link href={`/taches/${t.id}`} className="tache-board__title">
                      {t.titre}
                    </Link>
                    <div className="tache-board__meta">
                      <span>{t.responsableNom}</span>
                      <span
                        className={`status-badge status-badge--${toneFromStatut(t.statut)}`}
                      >
                        {t.statutLabel}
                      </span>
                    </div>
                    {t.sourceLabel ? (
                      <p className="tache-board__source muted">{t.sourceLabel}</p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {toast ? (
        <div className="planning__toast" role="status">
          <span>{toast.message.replace(" — Annuler", "")}</span>
          {toast.previous.id ? (
            <button type="button" className="btn btn--ghost" onClick={onUndo}>
              Annuler
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
