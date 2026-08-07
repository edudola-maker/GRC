/**
 * Architecture réservée à la future vue « Équipe » (responsable d'unité).
 * Voir ROADMAP.md et ARCHITECTURE.md — ne pas exposer dans la navigation pour l'instant.
 *
 * Capacités prévues :
 * - par collaborateur : projets, conseils, tâches, contrôles SCI, audits ;
 * - charge approximative, échéances, éléments en retard ;
 * - puis objectifs individuels (ObjectifAnnuel).
 *
 * MVP actuel : les « conseils » sont encore des tâches categorie=CONSEIL.
 * Quand Conseil deviendra un objet métier, étendre ce snapshot (conseilsEnCours, etc.).
 */

export type EquipeCollaborateurSnapshot = {
  utilisateurId: string;
  nom: string;
  projetsEnCours: number;
  tachesEnCours: number;
  /** Pont MVP : tâches categorie CONSEIL — remplacé par l'objet Conseil plus tard */
  demandesConseil: number;
  controlesSCIEnCours?: number;
  elementsEnRetard: number;
  chargeApproximative?: number;
  prochainesEcheances: Array<{
    type: "projet" | "tache" | "conseil" | "controle_sci" | "audit" | "document";
    id: string;
    label: string;
    date: Date;
  }>;
};

/** Placeholder — implémentation ultérieure */
export async function getEquipeOverview(): Promise<EquipeCollaborateurSnapshot[]> {
  return [];
}
