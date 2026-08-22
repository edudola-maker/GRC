import Link from "next/link";
import {
  PLANNING_KIND_LABELS,
  PLANNING_KINDS,
  bandStyle,
  type PlanningBand,
  type PlanningHorizon,
  type PlanningKind,
} from "@/lib/planning";

const HORIZON_MODES: { id: PlanningHorizon; label: string }[] = [
  { id: "semaine", label: "Semaine" },
  { id: "4sem", label: "4 semaines" },
  { id: "mois", label: "Mois" },
];

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

export function PlanningCalendar({
  columns,
  bands,
  winStart,
  weeks,
  weekOffset,
  activeFilters,
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
  bands: PlanningBand[];
  winStart: Date;
  weeks: number;
  weekOffset: number;
  activeFilters: Set<PlanningKind>;
  vue?: string;
  horizon?: PlanningHorizon;
  /** Navigation step in weeks — defaults to `weeks` (horizon size). */
  step?: number;
}) {
  const visible = bands.filter((b) => activeFilters.has(b.kind));
  const navStep = step ?? weeks;

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

        {visible.length === 0 ? (
          <p className="empty" style={{ marginTop: "0.85rem" }}>
            Aucune plage pour cette période ou ces filtres.
          </p>
        ) : (
          <ul className="planning__rows">
            {visible.map((band) => {
              const style = bandStyle(band.start, band.end, winStart, weeks);
              const tip = band.source
                ? `${band.title} (${band.source})`
                : band.title;
              return (
                <li key={band.id} className="planning__row">
                  <div className="planning__track">
                    <Link
                      href={band.href}
                      className={`planning__band planning__band--${band.kind.toLowerCase()}`}
                      style={style}
                      title={tip}
                    >
                      <span>{band.title}</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
