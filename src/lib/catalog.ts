/**
 * Catalogue centralisé — listes configurables plus tard.
 */

export const CATEGORIE_TACHE_OPTIONS = [
  { value: "CONSEIL", label: "Conseil" },
  { value: "PROJET", label: "Projet" },
  { value: "ADMINISTRATIF", label: "Administratif" },
  { value: "SCI", label: "SCI" },
  { value: "AUDIT", label: "Audit" },
  { value: "DOCUMENT", label: "Document" },
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

export const STATUT_CONTROLE_OPTIONS = [
  { value: "A_REALISER", label: "À réaliser" },
  { value: "EN_COURS", label: "En cours" },
  { value: "A_VALIDER", label: "À valider" },
  { value: "REALISE", label: "Réalisé" },
  { value: "EN_RETARD", label: "En retard" },
] as const;

export const STATUT_CONSEIL_OPTIONS = [
  { value: "RECU", label: "Reçu" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "REPONDU", label: "Répondu" },
  { value: "CLOTURE", label: "Clôturé" },
  { value: "ANNULE", label: "Annulé" },
] as const;

export const STATUT_RISQUE_OPTIONS = [
  { value: "IDENTIFIE", label: "Identifié" },
  { value: "EN_EVALUATION", label: "En évaluation" },
  { value: "EN_TRAITEMENT", label: "En traitement" },
  { value: "MAITRISE", label: "Maîtrisé" },
  { value: "ACCEPTE", label: "Accepté" },
  { value: "CLOTURE", label: "Clôturé" },
] as const;

export const CATEGORIE_RISQUE_OPTIONS = [
  { value: "FINANCIER", label: "Financier" },
  { value: "OPERATIONNEL", label: "Opérationnel" },
  { value: "CONFORMITE", label: "Conformité" },
  { value: "CYBERSECURITE", label: "Cybersécurité" },
  { value: "REPORTING", label: "Reporting" },
] as const;

export const TYPE_DOCUMENT_OPTIONS = [
  { value: "DIRECTIVE", label: "Directive" },
  { value: "PROCEDURE", label: "Procédure" },
  { value: "CHARTE", label: "Charte" },
  { value: "POLITIQUE", label: "Politique" },
  { value: "MODELE", label: "Modèle" },
  { value: "AUTRE", label: "Autre" },
] as const;

export const STATUT_DOCUMENT_OPTIONS = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "EN_VIGUEUR", label: "En vigueur" },
  { value: "A_REVOIR", label: "À revoir" },
  { value: "OBSOLETE", label: "Obsolète" },
  { value: "ARCHIVE", label: "Archivé" },
] as const;

export const FREQUENCE_REVUE_OPTIONS = [
  { value: "ANNUELLE", label: "Annuelle" },
  { value: "BIANNUELLE", label: "Tous les 2 ans" },
  { value: "TRIENNALE", label: "Tous les 3 ans" },
  { value: "PONCTUELLE", label: "Ponctuelle" },
] as const;

export const STATUT_AUDIT_OPTIONS = [
  { value: "PLANIFIE", label: "Planifié" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_REVUE", label: "En revue" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" },
] as const;

export const STATUT_RECO_OPTIONS = [
  { value: "OUVERTE", label: "Ouverte" },
  { value: "EN_COURS", label: "En cours" },
  { value: "CLOTUREE", label: "Clôturée" },
  { value: "ANNULEE", label: "Annulée" },
] as const;

export const PRIORITE_OPTIONS = [
  { value: "BASSE", label: "Basse" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "HAUTE", label: "Haute" },
  { value: "CRITIQUE", label: "Critique" },
] as const;

export const FREQUENCE_CONTROLE_OPTIONS = [
  { value: "MENSUELLE", label: "Mensuelle" },
  { value: "TRIMESTRIELLE", label: "Trimestrielle" },
  { value: "SEMESTRIELLE", label: "Semestrielle" },
  { value: "ANNUELLE", label: "Annuelle" },
  { value: "PONCTUELLE", label: "Ponctuelle" },
] as const;

export const ECHELLE_RISQUE = [1, 2, 3, 4, 5] as const;

export const TACHE_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;
export const PROJET_STATUTS_CLOS = ["TERMINE", "ANNULE"] as const;
export const CONSEIL_STATUTS_CLOS = ["CLOTURE", "ANNULE", "REPONDU"] as const;
export const RISQUE_STATUTS_MAITRISES = ["MAITRISE", "ACCEPTE", "CLOTURE"] as const;

/** Délai cible conseils (jours ouvrés) */
export const CONSEIL_DELAI_CIBLE_JOURS = 5;
