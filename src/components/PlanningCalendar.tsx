import Link from "next/link";
import {
  PLANNING_KIND_LABELS,
  bandStyle,
  type PlanningBand,
  type PlanningKind,
} from "@/lib/planning";

const KIND_ORDER: PlanningKind[] = [
  "PROJET",
  "AUDIT",
  "CONSEIL",
  "DOCUMENT",
  "ACTION",
];

export function PlanningCalendar({
  columns,
  bands,
  winStart,
  weeks,
}: {
  columns: { index: number; label: string }[];
  bands: PlanningBand[];
  winStart: Date;
  weeks: number;
}) {
  if (bands.length === 0) {
    return (
      <p className="empty">
        Aucune plage planifiée sur les prochaines semaines. Les projets, audits
        et conseils avec dates apparaîtront ici.
      </p>
    );
  }

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: bands.filter((b) => b.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="planning">
      <div className="planning__legend">
        {KIND_ORDER.map((kind) => (
          <span key={kind} className={`planning__chip planning__chip--${kind.toLowerCase()}`}>
            {PLANNING_KIND_LABELS[kind]}
          </span>
        ))}
      </div>

      <div
        className="planning__grid"
        style={{ ["--planning-weeks" as string]: weeks }}
      >
        <div className="planning__head" aria-hidden>
          {columns.map((c) => (
            <span key={c.index} className="planning__week">
              {c.label}
            </span>
          ))}
        </div>

        {grouped.map((group) => (
          <div key={group.kind} className="planning__group">
            <h3 className="planning__group-title">
              {PLANNING_KIND_LABELS[group.kind]}
            </h3>
            <ul className="planning__rows">
              {group.items.map((band) => {
                const style = bandStyle(band.start, band.end, winStart, weeks);
                return (
                  <li key={band.id} className="planning__row">
                    <div className="planning__track">
                      <Link
                        href={band.href}
                        className={`planning__band planning__band--${band.kind.toLowerCase()}`}
                        style={style}
                        title={band.title}
                      >
                        <span>{band.title}</span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
