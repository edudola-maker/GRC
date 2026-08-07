/**
 * Catalogue de valeurs métier.
 * Centralisé ici pour pouvoir rendre ces listes configurables plus tard
 * (catégories, statuts, priorités personnalisées) sans changer toute l'UI.
 */

export const CATEGORIE_TACHE_OPTIONS = [
  { value: "CONSEIL", label: "Conseil" },
  { value: "PROJET", label: "Projet" },
  { value: "ADMINISTRATIF", label: "Administratif" },
  { value: "SCI", label: "SCI" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const STATUT_PROJET_OPTIONS = [
  { value: "A_FAIRE", label: "À faire" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" },
] as const;

export const STATUT_TACHE_OPTIONS = [
  { value: "A_FAIRE", label: "À faire" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "A_VALIDER", label: "À valider" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" },
] as const;

export const PRIORITE_OPTIONS = [
  { value: "BASSE", label: "Basse" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "HAUTE", label: "Haute" },
  { value: "CRITIQUE", label: "Critique" },
] as const;

export const ECHEANCE_FILTER_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "retard", label: "En retard" },
  { value: "bientot", label: "Dans les 7 jours" },
  { value: "plus_tard", label: "Plus tard" },
  { value: "sans", label: "Sans échéance" },
] as const;

/** Statuts considérés comme clos (hors backlog « à traiter ») */
export const TACHE_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;
export const PROJET_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;
