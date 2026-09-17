"use client";

import { useEffect, useMemo, useState } from "react";
import { TacheBoard } from "@/components/taches/TacheBoard";
import { TacheCalendar, type TacheCalItem } from "@/components/taches/TacheCalendar";
import {
  TacheInventory,
  type TacheInventoryItem,
} from "@/components/taches/TacheInventory";
import type { GroupByTaches } from "@/lib/taches-temporalite";
import {
  DEFAULT_TACHES_VIEW,
  createSavedView,
  loadSavedViews,
  type TachesSavedView,
  type TachesViewConfig,
  type TachesViewMode,
} from "@/lib/taches-vues";

export function TachesWorkspace({
  items,
  responsables,
  unites,
  organisationId,
  utilisateurId,
  initialQuick,
  createHref,
  createLabel,
}: {
  items: TacheCalItem[];
  responsables: { id: string; nom: string }[];
  unites: { id: string; nom: string }[];
  organisationId: string;
  utilisateurId: string;
  initialQuick?: "tous" | "ouvertes" | "retard" | "terminees" | "annulees";
  createHref?: string;
  createLabel?: string;
}) {
  const [config, setConfig] = useState<TachesViewConfig>(DEFAULT_TACHES_VIEW);
  const [saved, setSaved] = useState<TachesSavedView[]>([]);
  const [filtreResponsable, setFiltreResponsable] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(loadSavedViews(organisationId, utilisateurId));
    setReady(true);
  }, [organisationId, utilisateurId]);

  const filtered = useMemo(() => {
    let list: TacheInventoryItem[] = items;
    if (filtreResponsable) {
      list = list.filter((t) => t.responsableId === filtreResponsable);
    }
    if (config.filtreStatut) {
      list = list.filter((t) => t.statut === config.filtreStatut);
    }
    if (config.filtreUniteId) {
      list = list.filter((t) => t.uniteId === config.filtreUniteId);
    }
    return list;
  }, [items, filtreResponsable, config.filtreStatut, config.filtreUniteId]);

  function setMode(mode: TachesViewMode) {
    setConfig((c) => ({ ...c, mode }));
  }

  function applyView(v: TachesSavedView) {
    setConfig(v.config);
    setFiltreResponsable(v.config.filtreResponsableId ?? "");
  }

  function saveCurrent() {
    const nom = window.prompt("Nom de la vue", "Ma vue");
    if (!nom) return;
    const view = createSavedView(organisationId, utilisateurId, nom, {
      ...config,
      filtreResponsableId: filtreResponsable || undefined,
    });
    setSaved(loadSavedViews(organisationId, utilisateurId));
    applyView(view);
  }

  return (
    <div className="taches-workspace">
      <div className="taches-workspace__bar">
        <div className="taches-workspace__modes" role="tablist" aria-label="Vues">
          {(
            [
              ["liste", "Liste"],
              ["tableau", "Tableau"],
              ["calendrier", "Calendrier"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={config.mode === mode}
              className={`taches-workspace__mode${config.mode === mode ? " is-active" : ""}`}
              onClick={() => setMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="taches-workspace__filters">
          <label className="inventory__select">
            <span className="sr-only">Filtrer responsable</span>
            <select
              value={filtreResponsable}
              onChange={(e) => setFiltreResponsable(e.target.value)}
            >
              <option value="">Filtrer : tous responsables</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </label>
          {ready ? (
            <label className="inventory__select">
              <span className="sr-only">Vues enregistrées</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  const v = saved.find((x) => x.id === e.target.value);
                  if (v) applyView(v);
                  e.target.value = "";
                }}
              >
                <option value="">Vues enregistrées…</option>
                {saved.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nom}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={saveCurrent}>
            + Enregistrer cette vue
          </button>
        </div>
      </div>

      <p className="muted taches-workspace__note">
        Filtre ≠ regroupement : le filtre réduit le jeu ; le regroupement (tableau)
        ne change que la présentation.
      </p>

      {config.mode === "liste" ? (
        <TacheInventory
          items={filtered}
          responsables={responsables}
          unites={unites}
          initialQuick={initialQuick}
          createHref={createHref}
          createLabel={createLabel}
        />
      ) : null}

      {config.mode === "tableau" ? (
        <TacheBoard
          items={filtered}
          groupBy={config.groupBy}
          onGroupByChange={(g: GroupByTaches) =>
            setConfig((c) => ({ ...c, groupBy: g }))
          }
          responsables={responsables}
        />
      ) : null}

      {config.mode === "calendrier" ? (
        <TacheCalendar
          items={filtered as TacheCalItem[]}
          horizon={config.calendrierHorizon ?? "mois"}
          onHorizonChange={(h) =>
            setConfig((c) => ({ ...c, calendrierHorizon: h }))
          }
        />
      ) : null}
    </div>
  );
}
