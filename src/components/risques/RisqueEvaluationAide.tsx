"use client";

import { useState } from "react";
import {
  buildEvaluationSuggestion,
  IMPACT_DIMENSIONS,
  IMPACT_NIVEAU_CRITERES,
  PROBA_EXPOSITION_CRITERES,
  PROBA_FREQUENCE_CRITERES,
  type ImpactAnswers,
  type ImpactNiveau,
  type ProbabiliteAnswers,
} from "@/lib/risque-evaluation-aide";

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
 * RiskQuant V2 — aide déterministe (questions, critères, exemples).
 * Remplit les champs du formulaire parent ; l’humain retient la note.
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
  const [retenueP, setRetenueP] = useState(1);
  const [retenueI, setRetenueI] = useState(1);

  function compute() {
    const s = buildEvaluationSuggestion(impactAnswers, probaAnswers);
    setSuggestion(s);
    setRetenueP(s.probabilite);
    setRetenueI(s.impact);
  }

  function accept() {
    if (!suggestion) return;
    const criticite = retenueP * retenueI;
    const justification = [
      suggestion.justificationImpact,
      suggestion.justificationProbabilite,
      `Valeur retenue : P=${retenueP} × I=${retenueI} → ${criticite}/25.`,
      retenueP !== suggestion.probabilite || retenueI !== suggestion.impact
        ? `(Suggestion outil : P=${suggestion.probabilite}, I=${suggestion.impact}.)`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    setSelectValue(probabiliteFieldId, String(retenueP));
    setSelectValue(impactFieldId, String(retenueI));
    setTextareaValue(justificationFieldId, justification);
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
        {open ? "Fermer l’aide" : "Aide à l’évaluation (RiskQuant)"}
      </button>

      {open ? (
        <div className="risque-aide__panel">
          <p className="muted" style={{ marginTop: 0 }}>
            L’outil propose — vous retenez la note. Moteur déterministe (sans
            IA). Critères 1–5 ci-dessous.
          </p>

          <details className="risque-aide__legend">
            <summary>Échelle d’impact (référence)</summary>
            <ul className="risque-aide__scale">
              {(
                Object.entries(IMPACT_NIVEAU_CRITERES) as [
                  string,
                  { label: string; exemple: string },
                ][]
              ).map(([n, c]) => (
                <li key={n}>
                  <strong>
                    {n} — {c.label}
                  </strong>
                  <span className="muted"> — {c.exemple}</span>
                </li>
              ))}
            </ul>
          </details>

          <h4 className="risque-aide__title">Dimensions d’impact</h4>
          <div className="risque-aide__grid risque-aide__grid--dims">
            {IMPACT_DIMENSIONS.map((d) => (
              <label key={d.key} className="field risque-aide__dim">
                <span className="field__label">{d.label}</span>
                <span className="muted risque-aide__q">{d.question}</span>
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
                {d.exemples[3] ? (
                  <span className="muted risque-aide__ex">
                    Ex. niveau 3 : {d.exemples[3]}
                  </span>
                ) : null}
              </label>
            ))}
          </div>

          <h4 className="risque-aide__title">
            Probabilité — fréquence &amp; exposition
          </h4>
          <div className="risque-aide__grid">
            <label className="field">
              <span className="field__label">Fréquence / historique</span>
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
                {(
                  Object.entries(PROBA_FREQUENCE_CRITERES) as [
                    string,
                    { label: string; exemple: string },
                  ][]
                ).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.label}
                  </option>
                ))}
              </select>
              {probaAnswers.dejaProduit ? (
                <span className="muted risque-aide__ex">
                  {PROBA_FREQUENCE_CRITERES[probaAnswers.dejaProduit].exemple}
                </span>
              ) : null}
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
                {(
                  Object.entries(PROBA_EXPOSITION_CRITERES) as [
                    string,
                    { label: string },
                  ][]
                ).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.label}
                  </option>
                ))}
              </select>
              {probaAnswers.exposition ? (
                <span className="muted risque-aide__ex">
                  {PROBA_EXPOSITION_CRITERES[probaAnswers.exposition].exemple}
                </span>
              ) : null}
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
                <strong>Suggestion — Impact {suggestion.impact}/5</strong>
                <br />
                <span className="muted">{suggestion.justificationImpact}</span>
              </p>
              <p>
                <strong>
                  Suggestion — Probabilité {suggestion.probabilite}/5
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

              <h4 className="risque-aide__title">Valeur retenue (vous décidez)</h4>
              <div className="risque-aide__grid">
                <label className="field">
                  <span className="field__label">P retenue</span>
                  <select
                    value={retenueP}
                    onChange={(e) => setRetenueP(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">I retenue</span>
                  <select
                    value={retenueI}
                    onChange={(e) => setRetenueI(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="muted" style={{ gridColumn: "1 / -1", margin: 0 }}>
                  Criticité retenue : {retenueP * retenueI}/25 — appliquée au
                  formulaire + justification.
                </p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={accept}
                >
                  Appliquer la valeur retenue
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
