import Link from "next/link";
import {
  PLANNING_KIND_LABELS,
  PLANNING_KINDS,
  bandStyle,
  type PlanningBand,
  type PlanningKind,
} from "@/lib/planning";

function buildPlanHref(params: {
  weekOffset: number;
  filters: Set<PlanningKind>;
  vue?: string;
}) {
  const qs = new URLSearchParams();
  if (params.vue && params.vue !== "toutes") qs.set("vue", params.vue);
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
}) {
  const visible = bands.filter((b) => activeFilters.has(b.kind));
  const step = 4;

  return (
    <div className="planning">
      <div className="planning__toolbar">
        <div className="planning__nav" aria-label="Navigation temporelle">
          <Link
            href={buildPlanHref({
              weekOffset: weekOffset - step,
              filters: activeFilters,
              vue,
            })}
            className="btn btn--ghost planning__nav-btn"
          >
            ← {step} sem.
          </Link>
          <Link
            href={buildPlanHref({
              weekOffset: 0,
              filters: activeFilters,
              vue,
            })}
            className={`btn btn--ghost planning__nav-btn${weekOffset === 0 ? " is-current" : ""}`}
          >
            Aujourd&apos;hui
          </Link>
          <Link
            href={buildPlanHref({
              weekOffset: weekOffset + step,
              filters: activeFilters,
              vue,
            })}
            className="btn btn--ghost planning__nav-btn"
          >
            {step} sem. →
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
