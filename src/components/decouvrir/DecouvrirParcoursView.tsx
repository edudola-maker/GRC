"use client";

import Link from "next/link";
import { useState } from "react";
import type { DecouvrirParcours } from "@/lib/decouvrir-parcours";

export function DecouvrirParcoursView({
  parcours,
}: {
  parcours: DecouvrirParcours;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hints, setHints] = useState<Record<string, string>>({});

  return (
    <div className="decouvrir-parcours">
      <ol className="decouvrir-parcours__steps">
        {parcours.etapes.map((e, i) => (
          <li key={i} className="decouvrir-parcours__step">
            <span className="decouvrir-parcours__num">{i + 1}</span>
            <div>
              <strong>{e.titre}</strong>
              <p className="muted" style={{ margin: "0.25rem 0 0.5rem" }}>
                {e.detail}
              </p>
              {e.href && e.cta ? (
                <Link href={e.href} className="btn btn--primary">
                  {e.cta}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {parcours.questionnaire && parcours.questionnaire.length > 0 ? (
        <section className="decouvrir-parcours__quiz">
          <h2>Vérifier rapidement</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            2–3 questions locales — rien n’est enregistré côté serveur.
          </p>
          {parcours.questionnaire.map((q) => (
            <fieldset key={q.id} className="decouvrir-parcours__q">
              <legend>{q.prompt}</legend>
              <div className="decouvrir-parcours__opts">
                {q.options.map((o) => (
                  <label key={o.value} className="decouvrir-parcours__opt">
                    <input
                      type="radio"
                      name={q.id}
                      value={o.value}
                      checked={answers[q.id] === o.value}
                      onChange={() => {
                        setAnswers((a) => ({ ...a, [q.id]: o.value }));
                        setHints((h) => ({
                          ...h,
                          [q.id]: o.hint ?? "",
                        }));
                      }}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
              {hints[q.id] ? (
                <p className="decouvrir-parcours__hint muted">{hints[q.id]}</p>
              ) : null}
            </fieldset>
          ))}
        </section>
      ) : null}
    </div>
  );
}
