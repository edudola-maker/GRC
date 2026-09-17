/**
 * Buckets de temporalité calculés (pas maintenus par l’utilisateur).
 * Regroupement ≠ filtre.
 */

export type TemporaliteBucket =
  | "EN_RETARD"
  | "AUJOURD_HUI"
  | "J7"
  | "J30"
  | "PLUS_TARD"
  | "SANS_ECHEANCE";

export const TEMPORALITE_LABELS: Record<TemporaliteBucket, string> = {
  EN_RETARD: "En retard",
  AUJOURD_HUI: "Aujourd’hui",
  J7: "7 prochains jours",
  J30: "30 prochains jours",
  PLUS_TARD: "Plus tard",
  SANS_ECHEANCE: "Sans échéance",
};

export const TEMPORALITE_ORDER: TemporaliteBucket[] = [
  "EN_RETARD",
  "AUJOURD_HUI",
  "J7",
  "J30",
  "PLUS_TARD",
  "SANS_ECHEANCE",
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Classe une échéance dans un bucket de temporalité.
 * Les tâches closes ne sont pas « en retard » (appelant peut filtrer avant).
 */
export function temporaliteBucket(
  dateEcheance: Date | string | null | undefined,
  now: Date = new Date(),
  opts?: { ignoreRetard?: boolean },
): TemporaliteBucket {
  if (!dateEcheance) return "SANS_ECHEANCE";
  const echeance = startOfDay(
    typeof dateEcheance === "string" ? new Date(dateEcheance) : dateEcheance,
  );
  if (Number.isNaN(echeance.getTime())) return "SANS_ECHEANCE";

  const today = startOfDay(now);
  const in7 = addDays(today, 7);
  const in30 = addDays(today, 30);

  if (!opts?.ignoreRetard && echeance < today) return "EN_RETARD";
  if (echeance.getTime() === today.getTime()) return "AUJOURD_HUI";
  if (echeance > today && echeance <= in7) return "J7";
  if (echeance > in7 && echeance <= in30) return "J30";
  return "PLUS_TARD";
}

export type GroupByTaches =
  | "temporalite"
  | "responsable"
  | "statut"
  | "priorite"
  | "objet"
  | "unite";

export const GROUP_BY_LABELS: Record<GroupByTaches, string> = {
  temporalite: "Temporalité",
  responsable: "Responsable",
  statut: "Statut",
  priorite: "Priorité",
  objet: "Objet lié",
  unite: "Unité",
};

/** Drag & drop autorisé uniquement si le regroupement mappe une donnée modifiable. */
export function groupByAllowsDrag(groupBy: GroupByTaches): boolean {
  return groupBy === "statut" || groupBy === "responsable";
}
