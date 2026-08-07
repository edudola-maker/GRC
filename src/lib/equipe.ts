/**
 * Architecture réservée à la future vue « Équipe » (responsable d'unité).
 *
 * Ne pas exposer encore dans la navigation.
 *
 * Capacités prévues :
 * - vue par collaborateur : projets / tâches en cours, demandes Conseil,
 *   échéances, charge, retards
 * - suivi d'objectifs annuels (plus tard) :
 *   objectif, résultat attendu, réalisé, avancement, échéance
 *
 * Les données actuelles (Utilisateur, Projet, Tâche + categorie CONSEIL)
 * suffisent pour une première version sans nouveau modèle.
 * Un modèle ObjectifAnnuel pourra s'ajouter ensuite, relié à Utilisateur.
 */

export type EquipeCollaborateurSnapshot = {
  utilisateurId: string;
  nom: string;
  projetsEnCours: number;
  tachesEnCours: number;
  demandesConseil: number;
  elementsEnRetard: number;
  prochainesEcheances: Array<{
    type: "projet" | "tache";
    id: string;
    label: string;
    date: Date;
  }>;
};

/** Placeholder — implémentation ultérieure */
export async function getEquipeOverview(): Promise<EquipeCollaborateurSnapshot[]> {
  return [];
}
