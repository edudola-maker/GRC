/**
 * RiskQuant V2 — aide déterministe à l’évaluation des risques.
 * Propose des notes — l’utilisateur décide toujours (valeur retenue).
 * Niveau 2 (IA) : futur via AIProvider — hors scope.
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
  /** Fréquence / historique d’occurrence */
  dejaProduit?: "jamais" | "rare" | "occasionnel" | "frequent";
  /** Exposition / surface d’attaque ou d’occurrence */
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

/** Critères / exemples par niveau d’impact (échelle 1–5). */
export const IMPACT_NIVEAU_CRITERES: Record<
  1 | 2 | 3 | 4 | 5,
  { label: string; exemple: string }
> = {
  1: {
    label: "Négligeable",
    exemple: "Effet local, corrigé rapidement, sans conséquence durable.",
  },
  2: {
    label: "Faible",
    exemple: "Gêne limitée, coût / délai mineur, pas d’atteinte majeure.",
  },
  3: {
    label: "Modéré",
    exemple: "Perturbation notable d’un service ou d’un projet ; attention managériale.",
  },
  4: {
    label: "Élevé",
    exemple: "Impact significatif (financier, conformité ou usagers) ; plan de remédiation.",
  },
  5: {
    label: "Critique",
    exemple: "Arrêt majeur, sanction, atteinte grave aux bénéficiaires ou aux données.",
  },
};

/** Critères pour la fréquence / exposition (probabilité). */
export const PROBA_FREQUENCE_CRITERES: Record<
  NonNullable<ProbabiliteAnswers["dejaProduit"]>,
  { label: string; exemple: string; scoreBase: number }
> = {
  jamais: {
    label: "Jamais observé",
    exemple: "Scénario théorique ou très peu plausible dans le contexte actuel.",
    scoreBase: 1,
  },
  rare: {
    label: "Rare",
    exemple: "Déjà vu une fois ou moins d’une fois tous les 2–3 ans.",
    scoreBase: 2,
  },
  occasionnel: {
    label: "Occasionnel",
    exemple: "Quelques occurrences par an, ou cycle connu.",
    scoreBase: 3,
  },
  frequent: {
    label: "Fréquent",
    exemple: "Plusieurs fois par an / quasi récurrent sans maîtrise.",
    scoreBase: 4,
  },
};

export const PROBA_EXPOSITION_CRITERES: Record<
  NonNullable<ProbabiliteAnswers["exposition"]>,
  { label: string; exemple: string }
> = {
  faible: {
    label: "Faible",
    exemple: "Périmètre restreint, peu d’acteurs, accès limité.",
  },
  moyenne: {
    label: "Moyenne",
    exemple: "Exposition habituelle du processus / service.",
  },
  forte: {
    label: "Forte",
    exemple: "Large surface (nombreux usagers, partenaires, canaux).",
  },
};

export type ImpactDimensionMeta = {
  key: ImpactDimension;
  label: string;
  question: string;
  exemples: Partial<Record<1 | 2 | 3 | 4 | 5, string>>;
};

export const IMPACT_DIMENSIONS: ImpactDimensionMeta[] = [
  {
    key: "financier",
    label: "Financier",
    question: "Quel serait l’effet budgétaire / patrimonial ?",
    exemples: {
      1: "Quelques centaines CHF",
      3: "Dépassement de budget notable",
      5: "Perte majeure ou engagement non assurable",
    },
  },
  {
    key: "operationnel",
    label: "Opérationnel",
    question: "Le processus / service peut-il continuer ?",
    exemples: {
      1: "Ralentissement mineur",
      3: "Mode dégradé plusieurs jours",
      5: "Arrêt total du service critique",
    },
  },
  {
    key: "juridique",
    label: "Juridique / conformité",
    question: "Exposition réglementaire ou contractuelle ?",
    exemples: {
      1: "Écart formel sans suite",
      3: "Non-conformité à remédier",
      5: "Sanction / litige grave",
    },
  },
  {
    key: "reputationnel",
    label: "Réputationnel",
    question: "Atteinte à la confiance / image ?",
    exemples: {
      1: "Remarque isolée",
      3: "Couverture locale / partenaires inquiets",
      5: "Crise médiatique durable",
    },
  },
  {
    key: "beneficiaires",
    label: "Bénéficiaires / usagers",
    question: "Combien d’usagers touchés, et à quel degré ?",
    exemples: {
      1: "Quelques usagers, inconfort",
      3: "Cohorte significative impactée",
      5: "Population large / vulnérables",
    },
  },
  {
    key: "duree",
    label: "Durée de perturbation",
    question: "Combien de temps avant retour à la normale ?",
    exemples: {
      1: "< 1 jour",
      3: "Plusieurs jours à 2 semaines",
      5: "> 1 mois ou irréversible",
    },
  },
  {
    key: "donnees",
    label: "Données / sécurité",
    question: "Confidentialité, intégrité, disponibilité des données ?",
    exemples: {
      1: "Incident contenu, pas de donnée sensible",
      3: "Fuite limitée / altération partielle",
      5: "Breach massif ou données très sensibles",
    },
  },
];

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
  const critere =
    IMPACT_NIVEAU_CRITERES[max as 1 | 2 | 3 | 4 | 5]?.label ?? `${max}/5`;
  let justification: string;
  if (max >= 4) {
    justification = `Impact ${critere.toLowerCase()} sur ${tops.join(", ")} (niveau ${max}/5).`;
  } else if (max >= 3) {
    justification = `Impact ${critere.toLowerCase()} (${tops.join(", ")}) — ${midHigh} dimension(s) ≥ 3.`;
  } else {
    justification = `Impact ${critere.toLowerCase()} d’après les dimensions évaluées (max ${max}/5).`;
  }
  return { score: clampScore(max), justification };
}

export function suggestProbabilite(answers: ProbabiliteAnswers): {
  score: number;
  justification: string;
} {
  let score = 2;
  const parts: string[] = [];

  if (answers.dejaProduit && PROBA_FREQUENCE_CRITERES[answers.dejaProduit]) {
    const f = PROBA_FREQUENCE_CRITERES[answers.dejaProduit];
    score = f.scoreBase;
    parts.push(`${f.label.toLowerCase()} (${f.exemple})`);
  } else {
    parts.push("historique / fréquence non renseigné");
  }

  if (answers.exposition === "forte") {
    score += 1;
    parts.push(`exposition forte — ${PROBA_EXPOSITION_CRITERES.forte.exemple}`);
  } else if (answers.exposition === "faible") {
    score -= 0.5;
    parts.push(`exposition faible — ${PROBA_EXPOSITION_CRITERES.faible.exemple}`);
  } else if (answers.exposition === "moyenne") {
    parts.push("exposition moyenne");
  }

  if (answers.volumeOperations === "massif") {
    score += 0.5;
    parts.push("volume d’opérations élevé");
  } else if (answers.volumeOperations === "ponctuel") {
    score -= 0.25;
    parts.push("volume ponctuel");
  } else if (answers.volumeOperations === "regulier") {
    parts.push("volume régulier");
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
    "Valeur retenue : à confirmer par l’évaluateur (l’outil ne décide pas).",
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
