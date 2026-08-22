"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  updatePlanification,
  undoPlanification,
  type PlanificationSnapshot,
} from "@/app/planning/actions";
import { bandDayStyle, type PlanifiableEntity } from "@/lib/planning-geometry";
import type { PlanningEquipeHorizon } from "@/lib/planning-equipe-horizon";

type SerialEquipeBand = {
  id: string;
  kind: "PROJET" | "MISSION" | "TACHE";
  title: string;
  href: string;
  startIso: string;
  endIso: string;
  planStartIso?: string;
  planEndIso?: string;
  source?: string;
  entityType?: PlanifiableEntity;
  entityId?: string;
  editable?: boolean;
  echeanceIso?: string;
  chargeJours?: number | null;
  durationDays: number;
};

type SerialEquipeRow = {
  user: { id: string; nom: string };
  chargeDays: number;
  bands: SerialEquipeBand[];
};

function bandWeightStyle(durationDays: number): CSSProperties {
  const d = Math.max(0.5, durationDays);
  const opacity = Math.min(1, 0.38 + d / 12);
  const minWidth =
    d <= 1 ? "0.85rem" : d <= 3 ? "1.4rem" : d <= 7 ? "2.2rem" : "3rem";
  return { opacity, minWidth };
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function dayDiff(aIso: string, bIso: string): number {
  return Math.round(
    (new Date(bIso).getTime() - new Date(aIso).getTime()) / 86_400_000,
  );
}

type DragState = {
  bandId: string;
  mode: "move" | "resize-end";
  originX: number;
  trackWidth: number;
  originStart: string;
  originEnd: string;
  liveStart: string;
  liveEnd: string;
};

const HORIZONS: { id: PlanningEquipeHorizon; label: string }[] = [
  { id: "semaine", label: "Semaine" },
  { id: "mois", label: "Mois" },
  { id: "3mois", label: "3 mois" },
  { id: "annee", label: "Année" },
];

export function PlanningEquipeGantt({
  columns,
  rows: rowsProp,
  winStartIso,
  weeks,
  weekOffset,
  horizon,
  step,
  collaborateurs,
  filterCollaborateur,
  filterKinds,
  basePath = "/responsable",
}: {
  columns: {
    index: number;
    labelShort: string;
    labelDates: string;
    labelFull: string;
  }[];
  rows: SerialEquipeRow[];
  winStartIso: string;
  weeks: number;
  weekOffset: number;
  horizon: PlanningEquipeHorizon;
  step: number;
  collaborateurs: { id: string; nom: string }[];
  filterCollaborateur?: string;
  filterKinds: string[];
  basePath?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [rows, setRows] = useState(rowsProp);
  useEffect(() => setRows(rowsProp), [rowsProp]);

  const [drag, setDrag] = useState<DragState | null>(null);
  const [toast, setToast] = useState<{
    previous: PlanificationSnapshot;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalDays = weeks * 7;

  const buildHref = (opts: {
    plan?: number;
    horizon?: PlanningEquipeHorizon;
    collab?: string;
    kinds?: string[];
  }) => {
    const qs = new URLSearchParams();
    const h = opts.horizon ?? horizon;
    if (h !== "mois") qs.set("ph", h);
    const p = opts.plan ?? weekOffset;
    if (p !== 0) qs.set("plan", String(p));
    const c = opts.collab === undefined ? filterCollaborateur : opts.collab;
    if (c) qs.set("pcollab", c);
    const k = opts.kinds ?? filterKinds;
    if (k.length && k.length < 3) qs.set("pk", k.join(","));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const pxToDays = useCallback(
    (dx: number, trackWidth: number) => {
      if (trackWidth <= 0) return 0;
      return Math.round((dx / trackWidth) * totalDays);
    },
    [totalDays],
  );

  const commit = async (
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
  };

  const onPointerDown = (
    e: ReactPointerEvent,
    band: SerialEquipeBand,
    mode: DragState["mode"],
  ) => {
    if (!band.editable || !band.entityType || !band.entityId) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const track = (e.currentTarget as HTMLElement).closest(
      ".planning-equipe__track",
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

  const patchBand = (bandId: string, start: string, end: string) => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        bands: row.bands.map((b) =>
          b.id === bandId
            ? {
                ...b,
                startIso: start,
                endIso: end,
                planStartIso: start,
                planEndIso: end,
              }
            : b,
        ),
      })),
    );
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag) return;
    const delta = pxToDays(e.clientX - drag.originX, drag.trackWidth);
    let liveStart = drag.originStart;
    let liveEnd = drag.originEnd;
    if (drag.mode === "move") {
      liveStart = addDaysIso(drag.originStart, delta);
      liveEnd = addDaysIso(drag.originEnd, delta);
    } else {
      liveEnd = addDaysIso(drag.originEnd, delta);
      if (dayDiff(liveStart, liveEnd) < 0) liveEnd = liveStart;
    }
    setDrag({ ...drag, liveStart, liveEnd });
    patchBand(drag.bandId, liveStart, liveEnd);
  };

  const onPointerUp = async (e: ReactPointerEvent) => {
    if (!drag) return;
    const final = { ...drag };
    setDrag(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    let found: SerialEquipeBand | undefined;
    for (const row of rows) {
      found = row.bands.find((b) => b.id === final.bandId);
      if (found) break;
    }
    if (
      !found?.entityType ||
      !found.entityId ||
      (final.liveStart === final.originStart &&
        final.liveEnd === final.originEnd)
    ) {
      return;
    }
    await commit(
      found.entityType,
      found.entityId,
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

  const kindSet = new Set(filterKinds.length ? filterKinds : ["PROJET", "MISSION", "TACHE"]);

  const toggleKind = (k: string) => {
    const next = new Set(kindSet);
    if (next.has(k)) {
      if (next.size > 1) next.delete(k);
    } else next.add(k);
    return buildHref({ kinds: [...next] });
  };

  return (
    <div className="planning-equipe">
      <div className="planning-equipe__toolbar">
        <div className="planning__modes" aria-label="Horizon équipe">
          {HORIZONS.map((m) => (
            <Link
              key={m.id}
              href={buildHref({ horizon: m.id, plan: 0 })}
              className={`planning__mode${horizon === m.id ? " is-active" : ""}`}
            >
              {m.label}
            </Link>
          ))}
        </div>
        <div className="planning__nav">
          <Link
            href={buildHref({ plan: weekOffset - step })}
            className="btn btn--ghost planning__nav-btn"
          >
            ←
          </Link>
          <Link
            href={buildHref({ plan: 0 })}
            className={`btn btn--ghost planning__nav-btn${weekOffset === 0 ? " is-current" : ""}`}
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={buildHref({ plan: weekOffset + step })}
            className="btn btn--ghost planning__nav-btn"
          >
            →
          </Link>
        </div>
        <div className="planning-equipe__filters">
          <label className="planning-equipe__filter">
            <span className="muted">Collaborateur</span>
            <select
              defaultValue={filterCollaborateur ?? ""}
              onChange={(e) => {
                router.push(buildHref({ collab: e.target.value || "" }));
              }}
            >
              <option value="">Tous</option>
              {collaborateurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>
          <div className="planning__filters" aria-label="Type d’objet">
            {(["PROJET", "MISSION", "TACHE"] as const).map((k) => (
              <Link
                key={k}
                href={toggleKind(k)}
                className={`planning__chip planning__chip--${k.toLowerCase()}${kindSet.has(k) ? " is-active" : ""}`}
              >
                {k === "PROJET"
                  ? "Projet"
                  : k === "MISSION"
                    ? "Mission"
                    : "Tâche"}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="muted planning__hint">
        Glisser une barre pour replanifier (S → S suivante) · l’échéance reste
        inchangée.
      </p>

      <div
        className="planning-equipe__grid"
        style={{ ["--planning-weeks" as string]: weeks }}
      >
        <div className="planning-equipe__head">
          <span className="planning-equipe__label-col">Collaborateur</span>
          <div className="planning-equipe__weeks">
            {columns.map((c) => (
              <span
                key={c.index}
                className="planning-equipe__week"
                title={c.labelFull}
              >
                <strong>{c.labelShort}</strong>
                <em>{c.labelDates}</em>
              </span>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="empty" style={{ marginTop: "0.75rem" }}>
            Aucune plage planifiée pour l’équipe sur cette période.
          </p>
        ) : (
          <ul className="planning-equipe__rows">
            {rows.map((row) => (
              <li key={row.user.id} className="planning-equipe__row">
                <div className="planning-equipe__label-col">
                  <strong>{row.user.nom}</strong>
                  <span className="muted">~{row.chargeDays} j.</span>
                </div>
                <div className="planning-equipe__track">
                  {row.bands.map((band) => {
                    const weight = bandWeightStyle(band.durationDays);
                    const pos = bandDayStyle(
                      new Date(band.startIso),
                      new Date(band.endIso),
                      new Date(winStartIso),
                      weeks,
                    );
                    const tip = `${band.title} · ~${band.durationDays} j.${
                      band.source ? ` (${band.source})` : ""
                    }${band.editable ? " · glisser pour replanifier" : ""}`;
                    const dragging = drag?.bandId === band.id;
                    return (
                      <div
                        key={band.id}
                        className={`planning-equipe__band planning-equipe__band--${band.kind.toLowerCase()}${band.editable ? " is-editable" : ""}${dragging ? " is-dragging" : ""}`}
                        style={{ ...pos, ...weight }}
                        title={tip}
                        onPointerMove={dragging ? onPointerMove : undefined}
                        onPointerUp={dragging ? onPointerUp : undefined}
                      >
                        {band.editable ? (
                          <>
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
                    );
                  })}
                </div>
              </li>
            ))}
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
