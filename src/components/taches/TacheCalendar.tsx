"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updatePlanification,
  undoPlanification,
  type PlanificationSnapshot,
} from "@/app/planning/actions";
import type { TacheInventoryItem } from "@/components/taches/TacheInventory";
import { formatDateDot } from "@/lib/labels";

export type TacheCalItem = TacheInventoryItem & {
  dateDebut: string | null;
  dateFinPlanifiee: string | null;
};

type Horizon = "semaine" | "4sem" | "mois";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function toIsoDay(d: Date) {
  const x = startOfDay(d);
  return x.toISOString().slice(0, 10);
}

function daysForHorizon(horizon: Horizon): number {
  if (horizon === "semaine") return 7;
  if (horizon === "4sem") return 28;
  return 35;
}

function planRange(t: TacheCalItem): { start: Date; end: Date } | null {
  if (t.dateDebut) {
    const start = startOfDay(new Date(t.dateDebut));
    const end = startOfDay(
      new Date(t.dateFinPlanifiee ?? t.dateDebut),
    );
    return { start, end: end < start ? start : end };
  }
  return null;
}

export function TacheCalendar({
  items,
  horizon,
  onHorizonChange,
}: {
  items: TacheCalItem[];
  horizon: Horizon;
  onHorizonChange: (h: Horizon) => void;
}) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    previous: PlanificationSnapshot;
  } | null>(null);

  const windowStart = useMemo(() => {
    const base = startOfWeek(new Date());
    return addDays(base, offset * (horizon === "mois" ? 28 : daysForHorizon(horizon)));
  }, [offset, horizon]);

  const days = useMemo(() => {
    const n = daysForHorizon(horizon);
    return Array.from({ length: n }, (_, i) => addDays(windowStart, i));
  }, [windowStart, horizon]);

  const byDay = useMemo(() => {
    const map = new Map<string, TacheCalItem[]>();
    for (const d of days) map.set(toIsoDay(d), []);
    for (const t of items) {
      const range = planRange(t);
      if (range) {
        for (const d of days) {
          const iso = toIsoDay(d);
          if (d >= range.start && d <= range.end) {
            map.get(iso)?.push(t);
          }
        }
      } else if (t.dateEcheance) {
        // Repère échéance (non éditable via drag planif)
        const e = toIsoDay(new Date(t.dateEcheance));
        if (map.has(e)) map.get(e)!.push(t);
      }
    }
    return map;
  }, [items, days]);

  async function movePlan(tacheId: string, dayIso: string) {
    const t = items.find((x) => x.id === tacheId);
    if (!t) return;
    const range = planRange(t);
    const spanDays = range
      ? Math.max(
          0,
          Math.round(
            (range.end.getTime() - range.start.getTime()) / 86400000,
          ),
        )
      : 0;
    const start = dayIso;
    const endDate = addDays(new Date(dayIso + "T12:00:00"), spanDays);
    const end = toIsoDay(endDate);
    const res = await updatePlanification({
      kind: "TACHE",
      id: tacheId,
      dateDebut: start,
      dateFin: end,
    });
    if (res.ok) {
      setToast({ previous: res.previous });
      startTransition(() => router.refresh());
    }
  }

  async function onUndo() {
    if (!toast) return;
    await undoPlanification(toast.previous);
    setToast(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="tache-cal">
      <div className="tache-cal__toolbar">
        <div className="tache-cal__nav">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setOffset((o) => o - 1)}
          >
            ←
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setOffset(0)}
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setOffset((o) => o + 1)}
          >
            →
          </button>
        </div>
        <label className="field field--inline">
          <span className="field__label">Horizon</span>
          <select
            value={horizon}
            onChange={(e) => {
              setOffset(0);
              onHorizonChange(e.target.value as Horizon);
            }}
          >
            <option value="semaine">Semaine</option>
            <option value="4sem">4 semaines</option>
            <option value="mois">Mois</option>
          </select>
        </label>
        <p className="muted tache-cal__hint">
          Glisser une tâche planifiée pour replanifier — l’échéance n’est pas
          modifiée.
        </p>
      </div>

      <div
        className={`tache-cal__grid tache-cal__grid--${horizon}`}
        role="grid"
      >
        {days.map((d) => {
          const iso = toIsoDay(d);
          const list = byDay.get(iso) ?? [];
          const isToday = iso === toIsoDay(new Date());
          return (
            <div
              key={iso}
              className={`tache-cal__day${isToday ? " is-today" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/tache-id");
                if (id) void movePlan(id, iso);
              }}
            >
              <header className="tache-cal__day-head">
                <strong>
                  {d.toLocaleDateString("fr-CH", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </strong>
              </header>
              <ul className="tache-cal__events">
                {list.map((t) => {
                  const planned = Boolean(t.dateDebut);
                  return (
                    <li key={`${t.id}-${iso}`}>
                      <article
                        className={`tache-cal__event${planned ? " is-planned" : " is-echeance"}`}
                        draggable={planned}
                        title={
                          planned
                            ? `Planifié · échéance ${formatDateDot(t.dateEcheance)}`
                            : `Échéance ${formatDateDot(t.dateEcheance)} (non planifié)`
                        }
                        onDragStart={(e) => {
                          if (!planned) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData("text/tache-id", t.id);
                        }}
                      >
                        <Link href={`/taches/${t.id}`}>{t.titre}</Link>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {toast ? (
        <div className="planning__toast" role="status">
          <span>Planification mise à jour</span>
          <button type="button" className="btn btn--ghost" onClick={onUndo}>
            Annuler
          </button>
        </div>
      ) : null}
    </div>
  );
}
