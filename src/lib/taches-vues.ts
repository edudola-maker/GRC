/**
 * Vues enregistrées personnelles (localStorage) — Tâches.
 * Partage d’équipe = évolution future.
 */

import type { GroupByTaches } from "@/lib/taches-temporalite";

export type TachesViewMode = "liste" | "tableau" | "calendrier";

export type TachesViewConfig = {
  mode: TachesViewMode;
  groupBy: GroupByTaches;
  /** Filtre responsable (≠ regroupement). */
  filtreResponsableId?: string;
  filtreStatut?: string;
  filtrePriorite?: string;
  filtreUniteId?: string;
  /** Horizon calendrier. */
  calendrierHorizon?: "semaine" | "4sem" | "mois";
};

export type TachesSavedView = {
  id: string;
  nom: string;
  config: TachesViewConfig;
  creeLe: string;
};

export const DEFAULT_TACHES_VIEW: TachesViewConfig = {
  mode: "liste",
  groupBy: "temporalite",
  calendrierHorizon: "mois",
};

const PRESETS: TachesSavedView[] = [
  {
    id: "preset_urgences",
    nom: "Mes urgences",
    config: { mode: "tableau", groupBy: "temporalite" },
    creeLe: "preset",
  },
  {
    id: "preset_charge",
    nom: "Charge équipe",
    config: { mode: "tableau", groupBy: "responsable" },
    creeLe: "preset",
  },
  {
    id: "preset_mois",
    nom: "Prochain mois",
    config: {
      mode: "calendrier",
      groupBy: "temporalite",
      calendrierHorizon: "mois",
    },
    creeLe: "preset",
  },
];

function storageKey(organisationId: string, utilisateurId: string) {
  return `grc_taches_vues_${organisationId}_${utilisateurId}`;
}

export function loadSavedViews(
  organisationId: string,
  utilisateurId: string,
): TachesSavedView[] {
  if (typeof window === "undefined") return PRESETS;
  try {
    const raw = localStorage.getItem(storageKey(organisationId, utilisateurId));
    if (!raw) return PRESETS;
    const parsed = JSON.parse(raw) as TachesSavedView[];
    if (!Array.isArray(parsed)) return PRESETS;
    return [...PRESETS, ...parsed.filter((v) => !v.id.startsWith("preset_"))];
  } catch {
    return PRESETS;
  }
}

export function persistCustomViews(
  organisationId: string,
  utilisateurId: string,
  views: TachesSavedView[],
) {
  const custom = views.filter((v) => !v.id.startsWith("preset_"));
  localStorage.setItem(
    storageKey(organisationId, utilisateurId),
    JSON.stringify(custom),
  );
}

export function createSavedView(
  organisationId: string,
  utilisateurId: string,
  nom: string,
  config: TachesViewConfig,
): TachesSavedView {
  const view: TachesSavedView = {
    id: `vue_${Date.now().toString(36)}`,
    nom: nom.trim() || "Vue enregistrée",
    config,
    creeLe: new Date().toISOString(),
  };
  const all = loadSavedViews(organisationId, utilisateurId);
  persistCustomViews(organisationId, utilisateurId, [...all, view]);
  return view;
}
