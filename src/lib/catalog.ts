/**
 * Catalogue de valeurs métier.
 *
 * Centralisé pour pouvoir rendre ces listes configurables plus tard
 * (catégories, statuts, priorités) sans changer toute l'UI.
 *
 * Vision produit (ROADMAP.md) :
 * - les catégories de tâche actuelles sont un pont MVP ;
 * - CONSEIL migrera vers un objet métier « Conseil » ;
 * - les catégories de risques / documents / etc. s'ajouteront ici puis en base config.
 */

export const CATEGORIE_TACHE_OPTIONS = [
  { value: "CONSEIL", label: "Conseil" },
  { value: "PROJET", label: "Projet" },
  { value: "ADMINISTRATIF", label: "Administratif" },
  { value: "SCI", label: "SCI" },
  { value: "AUTRE", label: "Autre" },
] as const;

/** Catégories risques — réservées au futur module (non utilisées en UI pour l'instant) */
export const CATEGORIE_RISQUE_OPTIONS = [
  { value: "FINANCIER", label: "Financier" },
  { value: "OPERATIONNEL", label: "Opérationnel" },
  { value: "CONFORMITE", label: "Conformité" },
  { value: "CYBERSECURITE", label: "Cybersécurité" },
  { value: "REPORTING", label: "Reporting" },
] as const;

/** Échelle matrice de criticité 5×5 (probabilité / impact) — futur module Risques */
export const ECHELLE_RISQUE = [1, 2, 3, 4, 5] as const;

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
