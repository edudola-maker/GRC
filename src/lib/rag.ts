import { addDays, startOfToday, SOON_DAYS } from "@/lib/labels";

export type RagStatut = "vert" | "jaune" | "rouge" | "neutre";

/** Vert = dans les délais, Jaune = à surveiller, Rouge = en retard */
export function ragEcheance(
  dateEcheance: Date | string | null | undefined,
  estClos = false,
): RagStatut {
  if (estClos || !dateEcheance) return "neutre";
  const today = startOfToday();
  const echeance = new Date(dateEcheance);
  echeance.setHours(0, 0, 0, 0);
  if (echeance < today) return "rouge";
  if (echeance <= addDays(today, SOON_DAYS)) return "jaune";
  return "vert";
}

export const RAG_LABELS: Record<RagStatut, string> = {
  vert: "Dans les délais",
  jaune: "À surveiller",
  rouge: "En retard",
  neutre: "Sans échéance",
};
