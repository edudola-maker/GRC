/**
 * Bibliothèque de bonnes pratiques — accompagnement (≠ obligations).
 * Structured-first : métadonnées exploitables, pas seulement du texte.
 */

export type BonnePratique = {
  id: string;
  titre: string;
  pourquoi: string;
  quandPertinent: string;
  /** Obligation légale / réglementaire / bonne pratique / recommandation */
  nature:
    | "OBLIGATION_LEGALE"
    | "EXIGENCE_REGLEMENTAIRE"
    | "EXIGENCE_CONTRACTUELLE"
    | "POLITIQUE_INTERNE"
    | "BONNE_PRATIQUE"
    | "RECOMMANDATION";
  responsableRecommande: string;
  frequenceRevue: string;
  modeleDisponible: boolean;
  parcoursSlug?: string;
};

export const NATURE_LABELS: Record<BonnePratique["nature"], string> = {
  OBLIGATION_LEGALE: "Obligation légale",
  EXIGENCE_REGLEMENTAIRE: "Exigence réglementaire",
  EXIGENCE_CONTRACTUELLE: "Exigence contractuelle",
  POLITIQUE_INTERNE: "Politique interne",
  BONNE_PRATIQUE: "Bonne pratique",
  RECOMMANDATION: "Recommandation",
};

export const BONNES_PRATIQUES: BonnePratique[] = [
  {
    id: "bp_ethique",
    titre: "Code éthique / de conduite",
    pourquoi: "Clarifier les comportements attendus et prévenir les conflits.",
    quandPertinent: "Dès que l’organisation a des collaborateurs ou partenaires.",
    nature: "BONNE_PRATIQUE",
    responsableRecommande: "Direction",
    frequenceRevue: "Annuelle",
    modeleDisponible: true,
    parcoursSlug: "gouvernance-fondamentaux",
  },
  {
    id: "bp_lpd",
    titre: "Politique de protection des données",
    pourquoi: "Cadre pour traiter les données personnelles de façon responsable.",
    quandPertinent: "Si vous traitez des données de clients, RH ou prestataires.",
    nature: "EXIGENCE_REGLEMENTAIRE",
    responsableRecommande: "Responsable désigné / Direction",
    frequenceRevue: "Annuelle ou après incident",
    modeleDisponible: false,
    parcoursSlug: "point-lpd",
  },
  {
    id: "bp_acces",
    titre: "Gestion des accès",
    pourquoi: "Limiter les droits au nécessaire et revoir périodiquement.",
    quandPertinent: "Systèmes informatiques critiques ou données sensibles.",
    nature: "BONNE_PRATIQUE",
    responsableRecommande: "Responsable SI / opérations",
    frequenceRevue: "Trimestrielle",
    modeleDisponible: true,
    parcoursSlug: "creer-controle",
  },
  {
    id: "bp_risques",
    titre: "Gestion des risques",
    pourquoi: "Anticiper ce qui peut empêcher d’atteindre les objectifs.",
    quandPertinent: "Toute organisation — profondeur proportionnée à la taille.",
    nature: "BONNE_PRATIQUE",
    responsableRecommande: "Direction / responsable d’unité",
    frequenceRevue: "Semestrielle",
    modeleDisponible: false,
    parcoursSlug: "cartographie-risques",
  },
  {
    id: "bp_continuite",
    titre: "Continuité d’activité",
    pourquoi: "Savoir quoi faire si un processus critique s’arrête.",
    quandPertinent: "Dépendance à un fournisseur, un système ou une personne clé.",
    nature: "BONNE_PRATIQUE",
    responsableRecommande: "Responsable opérations",
    frequenceRevue: "Annuelle",
    modeleDisponible: false,
    parcoursSlug: "documenter-processus",
  },
  {
    id: "bp_doc",
    titre: "Gestion documentaire",
    pourquoi: "Savoir où sont les règles en vigueur et qui les approuve.",
    quandPertinent: "Dès qu’il existe des procédures ou politiques.",
    nature: "BONNE_PRATIQUE",
    responsableRecommande: "Responsable qualité / Direction",
    frequenceRevue: "Annuelle",
    modeleDisponible: true,
  },
  {
    id: "bp_rh",
    titre: "Règlement du personnel",
    pourquoi: "Cadre clair pour le temps de travail, absences et devoirs.",
    quandPertinent: "Dès le premier collaborateur.",
    nature: "POLITIQUE_INTERNE",
    responsableRecommande: "Direction",
    frequenceRevue: "Tous les 2 ans",
    modeleDisponible: false,
  },
];
