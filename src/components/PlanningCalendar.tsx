"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  updatePlanification,
  undoPlanification,
  type PlanificationSnapshot,
} from "@/app/planning/actions";
import {
  PLANNING_KIND_LABELS,
  PLANNING_KINDS,
  bandDayStyle,
  type PlanningHorizon,
  type PlanningKind,
  type PlanifiableEntity,
} from "@/lib/planning-geometry";

const HORIZON_MODES: { id: PlanningHorizon; label: string }[] = [
  { id: "semaine", label: "Semaine" },
  { id: "4sem", label: "4 semaines" },
  { id: "mois", label: "Mois" },
];

type SerialBand = {
  id: string;
  kind: PlanningKind;
  title: string;
  href: string;
  source?: string;
  entityType?: PlanifiableEntity;
  entityId?: string;
  editable?: boolean;
  echeanceIso?: string;
  chargeJours?: number | null;
  planStartIso?: string;
  planEndIso?: string;
  startIso: string;
  endIso: string;
};

function buildPlanHref(params: {
  weekOffset: number;
  filters: Set<PlanningKind>;
  vue?: string;
  horizon: PlanningHorizon;
}) {
  const qs = new URLSearchParams();
  if (params.vue && params.vue !== "toutes") qs.set("vue", params.vue);
  if (params.horizon !== "semaine") qs.set("horizon", params.horizon);
  if (params.weekOffset !== 0) qs.set("plan", String(params.weekOffset));
  const allOn = PLANNING_KINDS.every((k) => params.filters.has(k));
  if (!allOn) {
    qs.set("f", [...params.filters].join(","));
  }
  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

function toggleFilter(
  current: Set<PlanningKind>,
  kind: PlanningKind,
): Set<PlanningKind> {
  const next = new Set(current);
  if (next.has(kind)) {
    if (next.size > 1) next.delete(kind);
  } else {
    next.add(kind);
  }
  return next;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function dayDiff(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.round((b - a) / 86_400_000);
}

type DragState = {
  bandId: string;
  mode: "move" | "resize-end" | "resize-start";
  originX: number;
  trackWidth: number;
  originStart: string;
  originEnd: string;
  liveStart: string;
  liveEnd: string;
};

/**
 * Calendrier collaborateur — drag / resize = planification uniquement.
 * Desktop : éditable. Mobile : liens uniquement (liste fournie à part).
 */
export function PlanningCalendar({
  columns,
  bands: bandsProp,
  winStartIso,
  weeks,
  weekOffset,
  activeFilters: filtersArr,
  vue,
  horizon = "semaine",
  step,
}: {
  columns: {
    index: number;
    labelShort: string;
    labelDates: string;
    labelFull: string;
  }[];
  bands: SerialBand[];
  winStartIso: string;
  weeks: number;
  weekOffset: number;
  activeFilters: PlanningKind[];
  vue?: string;
  horizon?: PlanningHorizon;
  step?: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const activeFilters = new Set(filtersArr);
  const navStep = step ?? weeks;
  const totalDays = weeks * 7;

  const [local, setLocal] = useState(bandsProp);
  useEffect(() => {
    setLocal(bandsProp);
  }, [bandsProp]);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [toast, setToast] = useState<{
    previous: PlanificationSnapshot;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pxToDays = useCallback(
    (dx: number, trackWidth: number) => {
      if (trackWidth <= 0) return 0;
      return Math.round((dx / trackWidth) * totalDays);
    },
    [totalDays],
  );

  const commit = useCallback(
    async (
      entityType: PlanifiableEntity,
      entityId: string,
      dateDebut: string,
      dateFin: string,
    ) => {
      const res = await updatePlanification({
        kind: entityType,
        id: entityId,
        dateDebut,
        dateFin,
      });
      if (!res.ok) return;
      setToast({ previous: res.previous });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 8000);
      startTransition(() => router.refresh());
    },
    [router],
  );

  const onPointerDown = (
    e: ReactPointerEvent,
    band: SerialBand,
    mode: DragState["mode"],
  ) => {
    if (!band.editable || !band.entityType || !band.entityId) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const track = (e.currentTarget as HTMLElement).closest(
      ".planning__track",
    ) as HTMLElement | null;
    if (!track) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const start = band.planStartIso ?? band.startIso;
    const end = band.planEndIso ?? band.endIso;
    setDrag({
      bandId: band.id,
      mode,
      originX: e.clientX,
      trackWidth: track.getBoundingClientRect().width,
      originStart: start,
      originEnd: end,
      liveStart: start,
      liveEnd: end,
    });
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag) return;
    const delta = pxToDays(e.clientX - drag.originX, drag.trackWidth);
    let liveStart = drag.originStart;
    let liveEnd = drag.originEnd;
    if (drag.mode === "move") {
      liveStart = addDaysIso(drag.originStart, delta);
      liveEnd = addDaysIso(drag.originEnd, delta);
    } else if (drag.mode === "resize-end") {
      liveEnd = addDaysIso(drag.originEnd, delta);
      if (dayDiff(liveStart, liveEnd) < 0) liveEnd = liveStart;
    } else {
      liveStart = addDaysIso(drag.originStart, delta);
      if (dayDiff(liveStart, liveEnd) < 0) liveStart = liveEnd;
    }
    setDrag({ ...drag, liveStart, liveEnd });
    setLocal((prev) =>
      prev.map((b) =>
        b.id === drag.bandId
          ? {
              ...b,
              startIso: liveStart,
              endIso: liveEnd,
              planStartIso: liveStart,
              planEndIso: liveEnd,
            }
          : b,
      ),
    );
  };

  const onPointerUp = async (e: ReactPointerEvent) => {
    if (!drag) return;
    const band = local.find((b) => b.id === drag.bandId);
    const final = { ...drag };
    setDrag(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (
      !band?.entityType ||
      !band.entityId ||
      (final.liveStart === final.originStart &&
        final.liveEnd === final.originEnd)
    ) {
      return;
    }
    await commit(
      band.entityType,
      band.entityId,
      final.liveStart,
      final.liveEnd,
    );
  };

  const onUndo = async () => {
    if (!toast) return;
    await undoPlanification(toast.previous);
    setToast(null);
    startTransition(() => router.refresh());
  };

  const displayBands = local.filter((b) => activeFilters.has(b.kind));

  return (
    <div className="planning">
      <div className="planning__toolbar">
        <div className="planning__modes" aria-label="Horizon de planification">
          {HORIZON_MODES.map((m) => (
            <Link
              key={m.id}
              href={buildPlanHref({
                weekOffset: 0,
                filters: activeFilters,
                vue,
                horizon: m.id,
              })}
              className={`planning__mode${horizon === m.id ? " is-active" : ""}`}
            >
              {m.label}
            </Link>
          ))}
        </div>

        <div className="planning__nav" aria-label="Navigation temporelle">
          <Link
            href={buildPlanHref({
              weekOffset: weekOffset - navStep,
              filters: activeFilters,
              vue,
              horizon,
            })}
            className="btn btn--ghost planning__nav-btn"
          >
            ← {navStep} sem.
          </Link>
          <Link
            href={buildPlanHref({
              weekOffset: 0,
              filters: activeFilters,
              vue,
              horizon,
            })}
            className={`btn btn--ghost planning__nav-btn${weekOffset === 0 ? " is-current" : ""}`}
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={buildPlanHref({
              weekOffset: weekOffset + navStep,
              filters: activeFilters,
              vue,
              horizon,
            })}
            className="btn btn--ghost planning__nav-btn"
          >
            {navStep} sem. →
          </Link>
        </div>

        <div className="planning__filters" aria-label="Filtres planification">
          {PLANNING_KINDS.map((kind) => {
            const on = activeFilters.has(kind);
            const next = toggleFilter(activeFilters, kind);
            return (
              <Link
                key={kind}
                href={buildPlanHref({
                  weekOffset,
                  filters: next,
                  vue,
                  horizon,
                })}
                className={`planning__chip planning__chip--${kind.toLowerCase()}${on ? " is-active" : ""}`}
                aria-pressed={on}
              >
                {PLANNING_KIND_LABELS[kind]}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="muted planning__hint">
        Glisser pour replanifier · poignées pour la durée · l’échéance n’est pas
        modifiée.
      </p>

      <div
        className="planning__grid"
        style={{ ["--planning-weeks" as string]: weeks }}
      >
        <div className="planning__head">
          {columns.map((c) => (
            <span key={c.index} className="planning__week" title={c.labelFull}>
              <strong>{c.labelShort}</strong>
              <em>{c.labelDates}</em>
            </span>
          ))}
        </div>

        {displayBands.length === 0 ? (
          <p className="empty" style={{ marginTop: "0.85rem" }}>
            Aucune plage pour cette période ou ces filtres.
          </p>
        ) : (
          <ul className="planning__rows">
            {displayBands.map((band) => {
              const start = new Date(band.startIso);
              const end = new Date(band.endIso);
              const style = bandDayStyle(
                start,
                end,
                new Date(winStartIso),
                weeks,
              );
              const tip = [
                band.title,
                band.source ? `(${band.source})` : null,
                band.echeanceIso
                  ? `Échéance ${new Date(band.echeanceIso).toLocaleDateString("fr-CH")}`
                  : null,
                band.editable ? "Glisser pour replanifier" : null,
              ]
                .filter(Boolean)
                .join(" · ");
              const dragging = drag?.bandId === band.id;
              return (
                <li key={band.id} className="planning__row">
                  <div className="planning__track">
                    <div
                      className={`planning__band planning__band--${band.kind.toLowerCase()}${band.editable ? " is-editable" : ""}${dragging ? " is-dragging" : ""}`}
                      style={style}
                      title={tip}
                      onPointerMove={dragging ? onPointerMove : undefined}
                      onPointerUp={dragging ? onPointerUp : undefined}
                      onPointerCancel={() => setDrag(null)}
                    >
                      {band.editable ? (
                        <>
                          <span
                            className="planning__handle planning__handle--start"
                            onPointerDown={(e) =>
                              onPointerDown(e, band, "resize-start")
                            }
                            aria-hidden
                          />
                          <button
                            type="button"
                            className="planning__band-body"
                            onPointerDown={(e) =>
                              onPointerDown(e, band, "move")
                            }
                          >
                            <span>{band.title}</span>
                          </button>
                          <span
                            className="planning__handle planning__handle--end"
                            onPointerDown={(e) =>
                              onPointerDown(e, band, "resize-end")
                            }
                            aria-hidden
                          />
                          <Link
                            href={band.href}
                            className="planning__band-open"
                            title="Ouvrir"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ↗
                          </Link>
                        </>
                      ) : (
                        <Link href={band.href} className="planning__band-body">
                          <span>{band.title}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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
