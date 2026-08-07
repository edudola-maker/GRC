/** Libellés français pour les énumérations métier */

export const STATUT_PROJET_LABELS: Record<string, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export const STATUT_TACHE_LABELS: Record<string, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  A_VALIDER: "À valider",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export const STATUT_CONTROLE_LABELS: Record<string, string> = {
  A_REALISER: "À réaliser",
  EN_COURS: "En cours",
  A_VALIDER: "À valider",
  REALISE: "Réalisé",
  EN_RETARD: "En retard",
};

export const PRIORITE_LABELS: Record<string, string> = {
  BASSE: "Basse",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
  CRITIQUE: "Critique",
};

export const FREQUENCE_LABELS: Record<string, string> = {
  MENSUELLE: "Mensuelle",
  TRIMESTRIELLE: "Trimestrielle",
  SEMESTRIELLE: "Semestrielle",
  ANNUELLE: "Annuelle",
  PONCTUELLE: "Ponctuelle",
};

export const CATEGORIE_TACHE_LABELS: Record<string, string> = {
  CONSEIL: "Conseil",
  PROJET: "Projet",
  ADMINISTRATIF: "Administratif",
  SCI: "SCI",
  AUTRE: "Autre",
};

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Seuil « bientôt » en jours */
export const SOON_DAYS = 7;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export type Urgence = "retard" | "bientot" | "a_venir" | "neutre";

export function urgenceEcheance(
  dateEcheance: Date | null | undefined,
  estClos: boolean,
): Urgence {
  if (estClos || !dateEcheance) return "neutre";
  const today = startOfToday();
  const echeance = new Date(dateEcheance);
  echeance.setHours(0, 0, 0, 0);
  if (echeance < today) return "retard";
  if (echeance <= addDays(today, SOON_DAYS)) return "bientot";
  return "a_venir";
}
