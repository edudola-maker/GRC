/**
 * Moteur déterministe d’aide à l’évaluation des risques (Niveau 1).
 * Propose des notes — l’utilisateur décide toujours.
 * Niveau 2 (IA) : futur via AIProvider (LOCAL | EXTERNAL_API | DISABLED).
 */

export type ImpactDimension =
  | "financier"
  | "operationnel"
  | "juridique"
  | "reputationnel"
  | "beneficiaires"
  | "duree"
  | "donnees";

export type ImpactNiveau = 0 | 1 | 2 | 3 | 4 | 5;
/** 0 = non pertinent / non évalué */

export type ImpactAnswers = Partial<Record<ImpactDimension, ImpactNiveau>>;

export type ProbabiliteAnswers = {
  dejaProduit?: "jamais" | "rare" | "occasionnel" | "frequent";
  exposition?: "faible" | "moyenne" | "forte";
  volumeOperations?: "ponctuel" | "regulier" | "massif";
  facteurExterne?: boolean;
  facteursAggravants?: boolean;
  contexteDegrade?: boolean;
};

export type EvaluationSuggestion = {
  impact: number;
  probabilite: number;
  criticite: number;
  justificationImpact: string;
  justificationProbabilite: string;
  justification: string;
};

const IMPACT_LABELS: Record<ImpactDimension, string> = {
  financier: "financier",
  operationnel: "opérationnel",
  juridique: "juridique / conformité",
  reputationnel: "réputationnel",
  beneficiaires: "bénéficiaires / usagers",
  duree: "durée de perturbation",
  donnees: "données / sécurité",
};

function clampScore(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** Impact suggéré = max des dimensions pertinentes (niveau ≥ 1). */
export function suggestImpact(answers: ImpactAnswers): {
  score: number;
  justification: string;
} {
  const entries = (Object.entries(answers) as [ImpactDimension, ImpactNiveau][])
    .filter(([, v]) => v != null && v > 0);
  if (entries.length === 0) {
    return {
      score: 1,
      justification: "Aucune dimension d’impact renseignée — note minimale proposée.",
    };
  }
  const max = Math.max(...entries.map(([, v]) => v));
  const tops = entries
    .filter(([, v]) => v === max)
    .map(([k]) => IMPACT_LABELS[k]);
  const midHigh = entries.filter(([, v]) => v >= 3).length;
  let justification: string;
  if (max >= 4) {
    justification = `Impact important sur ${tops.join(", ")} (niveau ${max}/5).`;
  } else if (max >= 3) {
    justification = `Impact notable (${tops.join(", ")}) — plusieurs dimensions concernées (${midHigh}).`;
  } else {
    justification = `Impact limité d’après les dimensions évaluées (max ${max}/5).`;
  }
  return { score: clampScore(max), justification };
}

export function suggestProbabilite(answers: ProbabiliteAnswers): {
  score: number;
  justification: string;
} {
  let score = 2;
  const parts: string[] = [];

  switch (answers.dejaProduit) {
    case "jamais":
      score = 1;
      parts.push("scénario jamais observé");
      break;
    case "rare":
      score = 2;
      parts.push("événement rare mais déjà observé");
      break;
    case "occasionnel":
      score = 3;
      parts.push("fréquence occasionnelle");
      break;
    case "frequent":
      score = 4;
      parts.push("événement fréquent");
      break;
    default:
      parts.push("historique non renseigné");
  }

  if (answers.exposition === "forte") {
    score += 1;
    parts.push("forte exposition");
  } else if (answers.exposition === "faible") {
    score -= 0.5;
    parts.push("exposition faible");
  }

  if (answers.volumeOperations === "massif") {
    score += 0.5;
    parts.push("volume d’opérations élevé");
  } else if (answers.volumeOperations === "ponctuel") {
    score -= 0.25;
  }

  if (answers.facteurExterne) {
    score += 0.25;
    parts.push("dépendance externe");
  }
  if (answers.facteursAggravants) {
    score += 0.5;
    parts.push("facteurs aggravants");
  }
  if (answers.contexteDegrade) {
    score += 0.5;
    parts.push("contexte récemment dégradé");
  }

  const final = clampScore(score);
  return {
    score: final,
    justification: `Probabilité ${final}/5 : ${parts.join(" ; ")}.`,
  };
}

export function buildEvaluationSuggestion(
  impactAnswers: ImpactAnswers,
  probaAnswers: ProbabiliteAnswers,
): EvaluationSuggestion {
  const impact = suggestImpact(impactAnswers);
  const probabilite = suggestProbabilite(probaAnswers);
  const criticite = impact.score * probabilite.score;
  const justification = [
    `Impact suggéré : ${impact.score}/5 — ${impact.justification}`,
    `Probabilité suggérée : ${probabilite.score}/5 — ${probabilite.justification}`,
    `Risque inhérent suggéré : ${criticite}/25.`,
  ].join("\n");
  return {
    impact: impact.score,
    probabilite: probabilite.score,
    criticite,
    justificationImpact: impact.justification,
    justificationProbabilite: probabilite.justification,
    justification,
  };
}
