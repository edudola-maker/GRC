/** Horizons planning équipe — sans Prisma (safe client). */

export type PlanningEquipeHorizon =
  | "semaine"
  | "mois"
  | "3mois"
  | "annee";

export function parsePlanningEquipeHorizon(
  raw: string | undefined,
): PlanningEquipeHorizon {
  if (raw === "semaine" || raw === "mois" || raw === "3mois" || raw === "annee")
    return raw;
  return "mois";
}

/** Granularité distincte — pas un simple zoom du même calendrier. */
export function weeksForEquipeHorizon(h: PlanningEquipeHorizon): number {
  switch (h) {
    case "semaine":
      return 1;
    case "mois":
      return 5;
    case "3mois":
      return 13;
    case "annee":
      return 26;
  }
}

export function stepForEquipeHorizon(h: PlanningEquipeHorizon): number {
  switch (h) {
    case "semaine":
      return 1;
    case "mois":
      return 4;
    case "3mois":
      return 13;
    case "annee":
      return 13;
  }
}
