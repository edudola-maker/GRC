/**
 * Catalogue centralisé — valeurs de secours / structurelles.
 * Taxinomies et paramètres unitaires : Preferer ReferentielValeur / ParametreFonctionnel
 * (Administration future). Les enums de statut restent dans Prisma.
 */

export const TAXINOMIE_OPTIONS = [
  { value: "GOUVERNANCE", label: "Gouvernance" },
  { value: "RESSOURCES_HUMAINES", label: "Ressources humaines" },
  { value: "FINANCES", label: "Finances" },
  { value: "INFORMATIQUE", label: "Informatique" },
  { value: "JURIDIQUE", label: "Juridique" },
  { value: "ACHATS", label: "Achats" },
  { value: "AUTRE", label: "Autre" },
] as const;

/** @deprecated Préférer getConseilDelaiCibleJours(uniteId) — paramètre par unité. */
export const CONSEIL_DELAI_CIBLE_JOURS = 5;

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
  { value: "IDEE", label: "Idée" },
  { value: "A_ETUDIER", label: "À étudier" },
  { value: "VALIDE", label: "Validé" },
  { value: "PLANIFIE", label: "Planifié" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_VALIDATION", label: "En validation" },
  { value: "DEPLOYE", label: "Déployé" },
  { value: "CLOTURE", label: "Clôturé" },
  { value: "ABANDONNE", label: "Abandonné" },
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

export const TYPE_CONTROLE_OPTIONS = [
  { value: "MANUEL", label: "Manuel" },
  { value: "SEMI_AUTOMATIQUE", label: "Semi-automatique" },
  { value: "AUTOMATIQUE", label: "Automatique" },
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

export const STRATEGIE_RISQUE_OPTIONS = [
  { value: "EVITER", label: "Éviter" },
  { value: "REDUIRE", label: "Réduire" },
  { value: "TRANSFERER", label: "Transférer" },
  { value: "ACCEPTER", label: "Accepter" },
] as const;

export const CATEGORIE_RISQUE_OPTIONS = [
  { value: "FINANCIER", label: "Financier" },
  { value: "OPERATIONNEL", label: "Opérationnel" },
  { value: "CONFORMITE", label: "Conformité" },
  { value: "CYBERSECURITE", label: "Cybersécurité" },
  { value: "REPORTING", label: "Reporting" },
  { value: "JURIDIQUE", label: "Juridique" },
  { value: "SYSTEME_INFORMATION", label: "Système d'information" },
] as const;

export const TYPE_MISSION_OPTIONS = [
  { value: "AUDIT", label: "Audit" },
  { value: "REVUE_PROCESSUS", label: "Revue de processus" },
] as const;

export const TYPE_DOCUMENT_OPTIONS = [
  { value: "DIRECTIVE", label: "Directive" },
  { value: "PROCEDURE", label: "Procédure" },
  { value: "CHARTE", label: "Charte" },
  { value: "POLITIQUE", label: "Politique" },
  { value: "INSTRUCTION", label: "Instruction" },
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
export const PROJET_STATUTS_CLOS = ["CLOTURE", "ABANDONNE"] as const;
export const PROJET_STATUTS_ACTIFS = [
  "VALIDE",
  "PLANIFIE",
  "EN_COURS",
  "EN_VALIDATION",
  "DEPLOYE",
] as const;
export const CONSEIL_STATUTS_CLOS = ["CLOTURE", "ANNULE", "REPONDU"] as const;
export const RISQUE_STATUTS_MAITRISES = ["MAITRISE", "ACCEPTE", "CLOTURE"] as const;

export const MODULE_HELP = {
  projets: {
    title: "Qu'est-ce qu'un projet ?",
    body: "Un projet est une initiative structurée visant à produire un livrable, nécessitant plusieurs étapes, échanges ou validations, et s'inscrivant généralement sur une durée supérieure à quelques jours. Une demande ponctuelle d'analyse relève plutôt d'un Conseil. Le statut Idée sert de boîte à idées sans créer un module séparé.",
  },
  conseils: {
    title: "Qu'est-ce qu'un conseil ?",
    body: "Un conseil est une demande ponctuelle d'analyse ou d'avis. Délai cible : 5 jours ouvrés. Utilisez les tags pour retrouver facilement les sujets (ex. LSubv, gouvernance).",
  },
  risques: {
    title: "Qu'est-ce qu'un risque ?",
    body: "Un risque est évalué (probabilité × impact) puis traité : éviter, réduire, transférer ou accepter. Des contrôles SCI peuvent découler du traitement, sauf si le risque est accepté.",
  },
  controles: {
    title: "Qu'est-ce qu'un contrôle SCI ?",
    body: "Contrôle périodique du système de contrôle interne. La prochaine occurrence est calculée selon la fréquence, mais l'action n'apparaît dans le backlog qu'à l'ouverture de la fenêtre de déclenchement.",
  },
  documents: {
    title: "Qu'est-ce qu'un document ?",
    body: "Inventaire et pilotage documentaire (métadonnées, revues, liens). Le contenu détaillé reste dans Confluence — cette application n'est pas une GED.",
  },
  audits: {
    title: "Qu'est-ce qu'une mission d'assurance ?",
    body: "Mission d'assurance (Audit ou Revue de processus) : même moteur — planification, travaux, rapport, recommandations et suivi. Le type choisi à la création pourra ensuite disposer de son propre template.",
  },
} as const;
