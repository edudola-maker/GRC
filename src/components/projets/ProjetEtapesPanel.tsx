"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createProjetEtape,
  deleteProjetEtape,
  reorderProjetEtapes,
  updateProjetEtapeAvancement,
  updateProjetEtapesPoids,
} from "@/app/projets/etapes-actions";
import { computeProjetAvancement } from "@/lib/projet-avancement";

export type ProjetEtapeVue = {
  id: string;
  libelle: string;
  ordre: number;
  poids: number;
  avancement: number;
  termine: boolean;
};

/**
 * Étapes Projet : pondération + slider d’avancement.
 * Avancement global = Σ (poids × avancement).
 */
export function ProjetEtapesPanel({
  projetId,
  etapes: initial,
  editable,
}: {
  projetId: string;
  etapes: ProjetEtapeVue[];
  editable: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [etapes, setEtapes] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const global = computeProjetAvancement(etapes);
  const sommePoids = etapes.reduce((s, e) => s + e.poids, 0);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onSlider(id: string, value: number) {
    setEtapes((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              avancement: value,
              termine: value >= 100,
            }
          : e,
      ),
    );
    await updateProjetEtapeAvancement(projetId, id, value);
    refresh();
  }

  async function onPoidsBlur() {
    const payload = etapes.map((e) => ({ id: e.id, poids: e.poids }));
    await updateProjetEtapesPoids(projetId, payload);
    refresh();
  }

  async function onAdd(formData: FormData) {
    const libelle = String(formData.get("libelle") ?? "").trim();
    if (!libelle) return;
    await createProjetEtape(projetId, libelle);
    refresh();
  }

  async function onDelete(id: string) {
    await deleteProjetEtape(projetId, id);
    setEtapes((prev) => prev.filter((e) => e.id !== id));
    refresh();
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = etapes.findIndex((e) => e.id === dragId);
    const to = etapes.findIndex((e) => e.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...etapes];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    const ordered = next.map((e, i) => ({ ...e, ordre: i }));
    setEtapes(ordered);
    setDragId(null);
    startTransition(async () => {
      await reorderProjetEtapes(
        projetId,
        ordered.map((e) => e.id),
      );
      refresh();
    });
  }

  return (
    <div className={`projet-etapes${pending ? " is-pending" : ""}`}>
      <div className="projet-etapes__global">
        <div className="projet-etapes__global-head">
          <strong>Avancement projet</strong>
          <span className="projet-etapes__pct">{global} %</span>
        </div>
        <div
          className="projet-etapes__bar"
          role="progressbar"
          aria-valuenow={global}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="projet-etapes__bar-fill"
            style={{ width: `${global}%` }}
          />
        </div>
        <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
          Calculé : Σ (poids × avancement). Pas de saisie manuelle du %.
          {sommePoids !== 100 ? (
            <span className="flash flash--warn" style={{ display: "inline", marginLeft: "0.5rem", padding: "0.1rem 0.4rem" }}>
              Poids = {sommePoids} % (cible 100 %)
            </span>
          ) : null}
        </p>
      </div>

      <ul className="projet-etapes__list">
        {etapes.map((e) => (
          <li
            key={e.id}
            className={`projet-etapes__row${e.termine ? " is-done" : ""}`}
            draggable={editable}
            onDragStart={() => setDragId(e.id)}
            onDragOver={(ev) => ev.preventDefault()}
            onDrop={() => onDrop(e.id)}
          >
            <div className="projet-etapes__row-head">
              {editable ? (
                <span className="projet-etapes__grip" title="Glisser pour réordonner" aria-hidden>
                  ⋮⋮
                </span>
              ) : null}
              <strong>{e.libelle}</strong>
              <span className="muted">{e.avancement} %</span>
              {editable ? (
                <label className="projet-etapes__poids">
                  Poids
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={e.poids}
                    onChange={(ev) => {
                      const v = Number(ev.target.value);
                      setEtapes((prev) =>
                        prev.map((x) =>
                          x.id === e.id ? { ...x, poids: Number.isFinite(v) ? v : 0 } : x,
                        ),
                      );
                    }}
                    onBlur={onPoidsBlur}
                  />
                  %
                </label>
              ) : (
                <span className="muted">poids {e.poids} %</span>
              )}
              {editable ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => onDelete(e.id)}
                >
                  ✕
                </button>
              ) : null}
            </div>
            <label className="projet-etapes__slider">
              <span className="sr-only">Avancement {e.libelle}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={e.avancement}
                disabled={!editable}
                onChange={(ev) => onSlider(e.id, Number(ev.target.value))}
              />
              <span className="projet-etapes__slider-ends" aria-hidden>
                <span>0 %</span>
                <span>100 %</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {etapes.length === 0 ? (
        <p className="empty">Aucune étape. Ajoutez le parcours du projet.</p>
      ) : null}

      {editable ? (
        <form action={onAdd} className="projet-etapes__add">
          <input
            name="libelle"
            placeholder="Nouvelle étape…"
            required
            className="input"
          />
          <button type="submit" className="btn btn--ghost">
            + Étape
          </button>
        </form>
      ) : null}
    </div>
  );
}
