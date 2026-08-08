"use client";

import { useMemo, useState } from "react";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { CATEGORIE_RISQUE_OPTIONS } from "@/lib/catalog";
import { criticiteNiveau } from "@/lib/labels";

export type MatrixRisquePoint = {
  id: string;
  code: string;
  nom: string;
  categorie: string;
  probabilite: number;
  impact: number;
  criticite: number;
  probabiliteResiduelle: number | null;
  impactResiduel: number | null;
  criticiteResiduelle: number | null;
};

type VueCriticite = "inherent" | "residuel";

export function RiskMatrix({ risques }: { risques: MatrixRisquePoint[] }) {
  const [categorie, setCategorie] = useState("");
  const [vue, setVue] = useState<VueCriticite>("inherent");

  const filtered = useMemo(() => {
    return risques.filter((r) => !categorie || r.categorie === categorie);
  }, [risques, categorie]);

  const matrixCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filtered) {
      const p =
        vue === "residuel"
          ? (r.probabiliteResiduelle ?? r.probabilite)
          : r.probabilite;
      const i =
        vue === "residuel" ? (r.impactResiduel ?? r.impact) : r.impact;
      const key = `${p}-${i}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [filtered, vue]);

  return (
    <CollapsibleSection
      title="Cartographie des risques"
      defaultOpen={false}
      badge={`${risques.length} risque${risques.length > 1 ? "s" : ""}`}
      className="page-zone--panel"
    >
      <p className="muted page-zone__intro" style={{ marginTop: 0 }}>
        Matrice 5×5 — lignes = impact (5→1), colonnes = probabilité (1→5).
        {vue === "inherent"
          ? " Affichage du risque inhérent."
          : " Affichage du risque résiduel (à défaut = inhérent)."}
      </p>

      <div
        className="filter-bar inventory__filters"
        style={{ marginBottom: "0.85rem" }}
      >
        <label className="inventory__select">
          <span className="sr-only">Catégorie</span>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
          >
            <option value="">Toutes catégories</option>
            {CATEGORIE_RISQUE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={`chip chip--button${vue === "inherent" ? " is-active" : ""}`}
          onClick={() => setVue("inherent")}
          aria-pressed={vue === "inherent"}
        >
          Inhérent
        </button>
        <button
          type="button"
          className={`chip chip--button${vue === "residuel" ? " is-active" : ""}`}
          onClick={() => setVue("residuel")}
          aria-pressed={vue === "residuel"}
        >
          Résiduel
        </button>
        <span className="muted" style={{ fontSize: "0.82rem" }}>
          {filtered.length} risque{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="matrix">
        <table className="matrix-table">
          <thead>
            <tr>
              <th scope="col">I \\ P</th>
              {[1, 2, 3, 4, 5].map((p) => (
                <th key={p} scope="col">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((impact) => (
              <tr key={impact}>
                <th scope="row">{impact}</th>
                {[1, 2, 3, 4, 5].map((probabilite) => {
                  const score = probabilite * impact;
                  const count =
                    matrixCounts[`${probabilite}-${impact}`] ?? 0;
                  return (
                    <td
                      key={probabilite}
                      className={`matrix-cell matrix-cell--${criticiteNiveau(score)}`}
                    >
                      {count || "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
