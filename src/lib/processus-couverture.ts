/**
 * Synthèse légère de couverture gouvernance d’un Processus.
 * ✓ / ⚠ — pas de score de maturité.
 */

export type CouvertureStatut = "ok" | "warn" | "na";

export type CouvertureItem = {
  key: string;
  label: string;
  statut: CouvertureStatut;
  detail?: string;
};

export type ProcessusCouvertureInput = {
  aRaci: boolean;
  risquesCount: number;
  controlesCount: number;
  aQualite: boolean;
  exigencesCount: number;
  aContinuite: boolean;
};

export function buildProcessusCouverture(
  input: ProcessusCouvertureInput,
): CouvertureItem[] {
  return [
    {
      key: "raci",
      label: "RACI",
      statut: input.aRaci ? "ok" : "warn",
      detail: input.aRaci ? "Lignes RACI présentes" : "Aucune ligne RACI",
    },
    {
      key: "risques",
      label: "Risques",
      statut: input.risquesCount > 0 ? "ok" : "warn",
      detail:
        input.risquesCount > 0
          ? `${input.risquesCount} risque(s)`
          : "Aucun risque lié",
    },
    {
      key: "controles",
      label: "Contrôles",
      statut: input.controlesCount > 0 ? "ok" : "warn",
      detail:
        input.controlesCount > 0
          ? `${input.controlesCount} contrôle(s) via risques`
          : "Pas de contrôle lié",
    },
    {
      key: "qualite",
      label: "Qualité",
      statut: input.aQualite ? "ok" : "warn",
      detail: input.aQualite ? "Fiche qualité" : "Qualité non configurée",
    },
    {
      key: "conformite",
      label: "Conformité",
      statut: input.exigencesCount > 0 ? "ok" : "warn",
      detail:
        input.exigencesCount > 0
          ? `${input.exigencesCount} exigence(s)`
          : "Aucune exigence liée",
    },
    {
      key: "continuite",
      label: "Continuité",
      statut: input.aContinuite ? "ok" : "warn",
      detail: input.aContinuite
        ? "Analyse de continuité"
        : "Continuité non documentée",
    },
  ];
}
