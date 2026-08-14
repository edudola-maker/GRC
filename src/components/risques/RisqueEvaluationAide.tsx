"use client";

import { useState } from "react";
import {
  buildEvaluationSuggestion,
  type ImpactAnswers,
  type ImpactDimension,
  type ImpactNiveau,
  type ProbabiliteAnswers,
} from "@/lib/risque-evaluation-aide";

const IMPACT_DIMS: { key: ImpactDimension; label: string }[] = [
  { key: "financier", label: "Financier" },
  { key: "operationnel", label: "Opérationnel" },
  { key: "juridique", label: "Juridique / conformité" },
  { key: "reputationnel", label: "Réputationnel" },
  { key: "beneficiaires", label: "Bénéficiaires / usagers" },
  { key: "duree", label: "Durée de perturbation" },
  { key: "donnees", label: "Données / sécurité" },
];

const NIVEAUX: { value: ImpactNiveau; label: string }[] = [
  { value: 0, label: "N/A" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

function setSelectValue(id: string, value: string) {
  const el = document.getElementById(id) as HTMLSelectElement | null;
  if (el) {
    el.value = value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function setTextareaValue(id: string, value: string) {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  if (el) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/**
 * Aide déterministe à l’évaluation (Niveau 1).
 * Remplit les champs du formulaire parent (selects + justification).
 */
export function RisqueEvaluationAide({
  probabiliteFieldId = "probabilite",
  impactFieldId = "impact",
  justificationFieldId = "justificationEvaluation",
}: {
  probabiliteFieldId?: string;
  impactFieldId?: string;
  justificationFieldId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [impactAnswers, setImpactAnswers] = useState<ImpactAnswers>({});
  const [probaAnswers, setProbaAnswers] = useState<ProbabiliteAnswers>({});
  const [suggestion, setSuggestion] = useState<ReturnType<
    typeof buildEvaluationSuggestion
  > | null>(null);

  function compute() {
    setSuggestion(buildEvaluationSuggestion(impactAnswers, probaAnswers));
  }

  function accept() {
    if (!suggestion) return;
    setSelectValue(probabiliteFieldId, String(suggestion.probabilite));
    setSelectValue(impactFieldId, String(suggestion.impact));
    setTextareaValue(justificationFieldId, suggestion.justification);
    setOpen(false);
  }

  return (
    <div className="risque-aide">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => {
          setOpen((o) => !o);
          setSuggestion(null);
        }}
      >
        {open ? "Fermer l’aide" : "Aide à l’évaluation"}
      </button>

      {open ? (
        <div className="risque-aide__panel">
          <p className="muted" style={{ marginTop: 0 }}>
            L’outil propose — vous décidez. Moteur déterministe (sans IA).
          </p>

          <h4 className="risque-aide__title">Impact</h4>
          <div className="risque-aide__grid">
            {IMPACT_DIMS.map((d) => (
              <label key={d.key} className="field">
                <span className="field__label">{d.label}</span>
                <select
                  value={impactAnswers[d.key] ?? 0}
                  onChange={(e) =>
                    setImpactAnswers((prev) => ({
                      ...prev,
                      [d.key]: Number(e.target.value) as ImpactNiveau,
                    }))
                  }
                >
                  {NIVEAUX.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <h4 className="risque-aide__title">Probabilité</h4>
          <div className="risque-aide__grid">
            <label className="field">
              <span className="field__label">Déjà produit ?</span>
              <select
                value={probaAnswers.dejaProduit ?? ""}
                onChange={(e) =>
                  setProbaAnswers((p) => ({
                    ...p,
                    dejaProduit: (e.target.value || undefined) as
                      | ProbabiliteAnswers["dejaProduit"]
                      | undefined,
                  }))
                }
              >
                <option value="">—</option>
                <option value="jamais">Jamais</option>
                <option value="rare">Rare</option>
                <option value="occasionnel">Occasionnel</option>
                <option value="frequent">Fréquent</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Exposition</span>
              <select
                value={probaAnswers.exposition ?? ""}
                onChange={(e) =>
                  setProbaAnswers((p) => ({
                    ...p,
                    exposition: (e.target.value || undefined) as
                      | ProbabiliteAnswers["exposition"]
                      | undefined,
                  }))
                }
              >
                <option value="">—</option>
                <option value="faible">Faible</option>
                <option value="moyenne">Moyenne</option>
                <option value="forte">Forte</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Volume d’opérations</span>
              <select
                value={probaAnswers.volumeOperations ?? ""}
                onChange={(e) =>
                  setProbaAnswers((p) => ({
                    ...p,
                    volumeOperations: (e.target.value || undefined) as
                      | ProbabiliteAnswers["volumeOperations"]
                      | undefined,
                  }))
                }
              >
                <option value="">—</option>
                <option value="ponctuel">Ponctuel</option>
                <option value="regulier">Régulier</option>
                <option value="massif">Massif</option>
              </select>
            </label>
            <label className="field field--check">
              <span className="field__label">Facteurs</span>
              <span>
                <input
                  type="checkbox"
                  checked={Boolean(probaAnswers.facteurExterne)}
                  onChange={(e) =>
                    setProbaAnswers((p) => ({
                      ...p,
                      facteurExterne: e.target.checked,
                    }))
                  }
                />{" "}
                Dépendance externe
              </span>
              <span>
                <input
                  type="checkbox"
                  checked={Boolean(probaAnswers.facteursAggravants)}
                  onChange={(e) =>
                    setProbaAnswers((p) => ({
                      ...p,
                      facteursAggravants: e.target.checked,
                    }))
                  }
                />{" "}
                Facteurs aggravants
              </span>
              <span>
                <input
                  type="checkbox"
                  checked={Boolean(probaAnswers.contexteDegrade)}
                  onChange={(e) =>
                    setProbaAnswers((p) => ({
                      ...p,
                      contexteDegrade: e.target.checked,
                    }))
                  }
                />{" "}
                Contexte récemment dégradé
              </span>
            </label>
          </div>

          <div className="form-actions" style={{ marginTop: "0.75rem" }}>
            <button type="button" className="btn btn--primary" onClick={compute}>
              Proposer une évaluation
            </button>
          </div>

          {suggestion ? (
            <div className="risque-aide__result">
              <p>
                <strong>Impact suggéré : {suggestion.impact}/5</strong>
                <br />
                <span className="muted">{suggestion.justificationImpact}</span>
              </p>
              <p>
                <strong>
                  Probabilité suggérée : {suggestion.probabilite}/5
                </strong>
                <br />
                <span className="muted">
                  {suggestion.justificationProbabilite}
                </span>
              </p>
              <p>
                <strong>
                  Risque inhérent suggéré : {suggestion.criticite}/25
                </strong>
              </p>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={accept}
                >
                  Accepter
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setSuggestion(null)}
                >
                  Modifier les réponses
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
