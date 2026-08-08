/** Libellés français pour les énumérations métier */

export const STATUT_PROJET_LABELS: Record<string, string> = {
  IDEE: "Idée",
  A_ETUDIER: "À étudier",
  VALIDE: "Validé",
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  EN_VALIDATION: "En validation",
  DEPLOYE: "Déployé",
  CLOTURE: "Clôturé",
  ABANDONNE: "Abandonné",
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
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
};

export const STATUT_CONSEIL_LABELS: Record<string, string> = {
  RECU: "Reçu",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  REPONDU: "Répondu",
  CLOTURE: "Clôturé",
  ANNULE: "Annulé",
};

export const STATUT_RISQUE_LABELS: Record<string, string> = {
  IDENTIFIE: "Identifié",
  EN_EVALUATION: "En évaluation",
  EN_TRAITEMENT: "En traitement",
  MAITRISE: "Maîtrisé",
  ACCEPTE: "Accepté",
  CLOTURE: "Clôturé",
};

export const CATEGORIE_RISQUE_LABELS: Record<string, string> = {
  FINANCIER: "Financier",
  OPERATIONNEL: "Opérationnel",
  CONFORMITE: "Conformité",
  CYBERSECURITE: "Cybersécurité",
  REPORTING: "Reporting",
  JURIDIQUE: "Juridique",
  SYSTEME_INFORMATION: "Système d'information",
};

export const TYPE_DOCUMENT_LABELS: Record<string, string> = {
  DIRECTIVE: "Directive",
  PROCEDURE: "Procédure",
  CHARTE: "Charte",
  POLITIQUE: "Politique",
  INSTRUCTION: "Instruction",
  MODELE: "Modèle",
  AUTRE: "Autre",
};

export const STRATEGIE_RISQUE_LABELS: Record<string, string> = {
  EVITER: "Éviter",
  REDUIRE: "Réduire",
  TRANSFERER: "Transférer",
  ACCEPTER: "Accepter",
};

export const TYPE_CONTROLE_LABELS: Record<string, string> = {
  MANUEL: "Manuel",
  SEMI_AUTOMATIQUE: "Semi-automatique",
  AUTOMATIQUE: "Automatique",
};

export const TAXINOMIE_LABELS: Record<string, string> = {
  GOUVERNANCE: "Gouvernance",
  RESSOURCES_HUMAINES: "Ressources humaines",
  FINANCES: "Finances",
  INFORMATIQUE: "Informatique",
  JURIDIQUE: "Juridique",
  ACHATS: "Achats",
  AUTRE: "Autre",
};

export const STATUT_DOCUMENT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  EN_VIGUEUR: "En vigueur",
  A_REVOIR: "À revoir",
  OBSOLETE: "Obsolète",
  ARCHIVE: "Archivé",
};

export const NIVEAU_CONFIDENTIALITE_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  INTERNE: "Interne",
  CONFIDENTIEL: "Confidentiel",
  SENSIBLE: "Sensible",
};

export const FREQUENCE_REVUE_LABELS: Record<string, string> = {
  ANNUELLE: "Annuelle",
  BIANNUELLE: "Tous les 2 ans",
  TRIENNALE: "Tous les 3 ans",
  PONCTUELLE: "Ponctuelle",
};

export const STATUT_MISSION_LABELS: Record<string, string> = {
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  EN_REVUE: "En revue",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

/** @deprecated Utiliser STATUT_MISSION_LABELS */
export const STATUT_AUDIT_LABELS = STATUT_MISSION_LABELS;

export const TYPE_OBJET_LABELS: Record<string, string> = {
  PROJET: "Projet",
  CONSEIL: "Conseil",
  MISSION: "Mission d'assurance",
  RISQUE: "Risque",
  CONTROLE_SCI: "Contrôle SCI",
  DOCUMENT: "Document",
  TACHE: "Tâche",
  PROCESSUS: "Processus",
  PROCESSUS_ETAPE: "Étape de processus",
  MODELE_TACHE: "Modèle de tâche",
};

export const ETAT_SECTION_REDACTION_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  FINALISE: "Finalisé",
  A_VALIDER: "À valider",
  VALIDE: "Validé",
  OBSOLETE: "Obsolète",
};

export const STATUT_PROCESSUS_LABELS: Record<string, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
};

export const STATUT_RECO_LABELS: Record<string, string> = {
  OUVERTE: "Ouverte",
  EN_COURS: "En cours",
  CLOTUREE: "Clôturée",
  ANNULEE: "Annulée",
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
  MISSION: "Mission",
  DOCUMENT: "Document",
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

/** Date compacte pour inventaires (ex. 11.08.2026). */
export function formatDateDot(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

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

export function criticiteNiveau(criticite: number): "faible" | "modere" | "eleve" | "critique" {
  if (criticite >= 20) return "critique";
  if (criticite >= 12) return "eleve";
  if (criticite >= 6) return "modere";
  return "faible";
}
