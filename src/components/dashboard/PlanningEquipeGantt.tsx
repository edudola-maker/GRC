import Link from "next/link";
import type { CSSProperties } from "react";
import { bandStyle } from "@/lib/planning";
import type { PlanningEquipeRow } from "@/lib/planning-equipe";

/** Opacité / poids visuel selon durée (0,5 j ≠ 10 j). */
function bandWeightStyle(durationDays: number): CSSProperties {
  const d = Math.max(0.5, durationDays);
  const opacity = Math.min(1, 0.38 + d / 12);
  const minWidth =
    d <= 1 ? "0.85rem" : d <= 3 ? "1.4rem" : d <= 7 ? "2.2rem" : "3rem";
  return { opacity, minWidth };
}

export function PlanningEquipeGantt({
  columns,
  rows,
  winStart,
  weeks,
}: {
  columns: {
    index: number;
    labelShort: string;
    labelDates: string;
    labelFull: string;
  }[];
  rows: PlanningEquipeRow[];
  winStart: Date;
  weeks: number;
}) {
  return (
    <div className="planning-equipe">
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
                  <span className="muted">
                    ~{row.chargeDays} j.
                  </span>
                </div>
                <div className="planning-equipe__track">
                  {row.bands.map((band) => {
                    const col = bandStyle(
                      band.start,
                      band.end,
                      winStart,
                      weeks,
                    );
                    const weight = bandWeightStyle(band.durationDays);
                    const tip = `${band.title} · ~${band.durationDays} j.${
                      band.source ? ` (${band.source})` : ""
                    }`;
                    return (
                      <Link
                        key={band.id}
                        href={band.href}
                        className={`planning-equipe__band planning-equipe__band--${band.kind.toLowerCase()}`}
                        style={{ ...col, ...weight }}
                        title={tip}
                      >
                        <span>{band.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
