"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DIAGNOSTIC_QUESTIONS,
  STATUT_DIAG_LABELS,
  propositionsFromAnswers,
} from "@/lib/guide-diagnostic";

export function GuideDiagnosticClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = step >= DIAGNOSTIC_QUESTIONS.length;
  const q = DIAGNOSTIC_QUESTIONS[step];

  const propositions = useMemo(
    () => (done ? propositionsFromAnswers(answers) : []),
    [done, answers],
  );

  if (done) {
    return (
      <div className="guide-diag-result">
        <h2>Parcours recommandé</h2>
        <p className="muted">
          Statuts : À faire · En cours · Structuré · À revoir — pas de « maturité
          37 % ».
        </p>
        <ol className="guide-diag-list">
          {propositions.map((p, i) => (
            <li key={p.id}>
              <div className="guide-diag-item">
                <span className="guide-diag-num">{i + 1}</span>
                <div>
                  <strong>{p.titre}</strong>
                  <p className="muted">{p.detail}</p>
                  <span className="strategie-smart__chip">
                    {STATUT_DIAG_LABELS[p.statut]}
                  </span>
                </div>
                <Link href={p.href} className="btn btn--ghost">
                  {p.cta}
                </Link>
              </div>
            </li>
          ))}
        </ol>
        <p>
          <Link href="/guide" className="btn-link">
            ← Retour au Guide
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="guide-diag-q">
      <p className="muted">
        Question {step + 1} / {DIAGNOSTIC_QUESTIONS.length}
      </p>
      <h2>{q!.prompt}</h2>
      <div className="guide-diag-options">
        {q!.options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="btn btn--ghost guide-diag-opt"
            onClick={() => {
              setAnswers((a) => ({ ...a, [q!.id]: o.value }));
              setStep((s) => s + 1);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {step > 0 ? (
        <button
          type="button"
          className="btn-link"
          onClick={() => setStep((s) => s - 1)}
        >
          ← Question précédente
        </button>
      ) : null}
    </div>
  );
}
