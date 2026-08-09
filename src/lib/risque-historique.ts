import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
} from "@/lib/labels";

/** Libellés des champs structurants du pilote Risques. */
export const CHAMP_RISQUE_LABELS: Record<string, string> = {
  nom: "Nom",
  description: "Description",
  taxinomie: "Taxinomie",
  tags: "Tags",
  processus: "Processus",
  responsable: "Responsable",
  categorie: "Catégorie",
  probabilite: "Probabilité (inhérent)",
  impact: "Impact (inhérent)",
  criticite: "Criticité (inhérent)",
  probabiliteResiduelle: "Probabilité (résiduel)",
  impactResiduel: "Impact (résiduel)",
  criticiteResiduelle: "Criticité (résiduel)",
  strategie: "Stratégie",
  statut: "Statut",
  commentaires: "Commentaires",
  justificationEvaluation: "Justification d’évaluation",
  archive: "Archivage",
  controles: "Contrôles SCI liés",
};

export function formatRisqueHistValue(
  champ: string,
  value: string | null,
): string {
  if (value == null || value === "") return "—";
  if (champ === "statut") return STATUT_RISQUE_LABELS[value] ?? value;
  if (champ === "categorie") return CATEGORIE_RISQUE_LABELS[value] ?? value;
  if (champ === "strategie") return STRATEGIE_RISQUE_LABELS[value] ?? value;
  if (champ === "archive") {
    if (value === "true") return "Archivé";
    if (value === "false") return "Actif";
  }
  return value;
}
