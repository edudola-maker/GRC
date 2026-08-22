/** Géométrie / types planning — sans Prisma (safe client). */

export type PlanningKind = "PROJET" | "MISSION" | "TACHE";

export const PLANNING_KINDS: PlanningKind[] = ["PROJET", "MISSION", "TACHE"];

export type PlanifiableEntity = "PROJET" | "MISSION" | "TACHE";

export type PlanningHorizon = "semaine" | "4sem" | "mois";

export const PLANNING_HORIZONS: PlanningHorizon[] = [
  "semaine",
  "4sem",
  "mois",
];

export const PLANNING_KIND_LABELS: Record<PlanningKind, string> = {
  PROJET: "Projet",
  MISSION: "Mission",
  TACHE: "Tâche",
};

export function bandStyle(
  bandStart: Date,
  bandEnd: Date,
  winStart: Date,
  weeks: number,
): { gridColumn: string } {
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  let startIdx = Math.floor(
    (bandStart.getTime() - winStart.getTime()) / msWeek,
  );
  let endIdx = Math.floor((bandEnd.getTime() - winStart.getTime()) / msWeek);
  startIdx = Math.max(0, Math.min(weeks - 1, startIdx));
  endIdx = Math.max(startIdx, Math.min(weeks - 1, endIdx));
  return { gridColumn: `${startIdx + 1} / ${endIdx + 2}` };
}

/** Position % sur la piste (jours) — drag / resize précis. */
export function bandDayStyle(
  bandStart: Date,
  bandEnd: Date,
  winStart: Date,
  weeks: number,
): { left: string; width: string } {
  const totalDays = weeks * 7;
  const msDay = 24 * 60 * 60 * 1000;
  let startDay = Math.floor(
    (bandStart.getTime() - winStart.getTime()) / msDay,
  );
  let endDay = Math.floor((bandEnd.getTime() - winStart.getTime()) / msDay);
  startDay = Math.max(0, Math.min(totalDays - 1, startDay));
  endDay = Math.max(startDay, Math.min(totalDays - 1, endDay));
  const span = endDay - startDay + 1;
  return {
    left: `${(startDay / totalDays) * 100}%`,
    width: `${(span / totalDays) * 100}%`,
  };
}

export function toIsoDay(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
