"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChipButton,
  InventoryBrowser,
  filterByQuery,
  useInventorySearch,
} from "@/components/inventory/InventoryBrowser";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { toneFromStatut } from "@/components/ui/StatusBadge";
import { formatDateDot } from "@/lib/labels";

export type TacheInventoryItem = {
  id: string;
  titre: string;
  statut: string;
  statutLabel: string;
  priorite: string;
  prioriteLabel: string;
  categorie: string;
  categorieLabel: string;
  responsableId: string;
  responsableNom: string;
  uniteId: string;
  uniteNom: string;
  dateEcheance: string | null;
  urgence: "retard" | "bientot" | "a_venir" | "neutre";
  estOuverte: boolean;
  estTerminee: boolean;
  estRetard: boolean;
  sourceType: string | null;
  sourceLabel: string | null;
  sourceHref: string | null;
};

type QuickFilter =
  | "tous"
  | "ouvertes"
  | "retard"
  | "terminees"
  | "annulees";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Toutes",
  ouvertes: "Ouvertes",
  retard: "En retard",
  terminees: "Terminées",
  annulees: "Annulées",
};

export function TacheInventory({
  items,
  responsables,
  unites,
  initialQuick,
  createHref,
  createLabel,
}: {
  items: TacheInventoryItem[];
  responsables: { id: string; nom: string }[];
  unites: { id: string; nom: string }[];
  initialQuick?: QuickFilter;
  createHref?: string;
  createLabel?: string;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>(initialQuick ?? "ouvertes");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [uniteQuick, setUniteQuick] = useState("");
  const [sourceQuick, setSourceQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statut, setStatut] = useState("");
  const [categorie, setCategorie] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "ouvertes") list = list.filter((t) => t.estOuverte);
    else if (quick === "retard") list = list.filter((t) => t.estRetard);
    else if (quick === "terminees") list = list.filter((t) => t.estTerminee);
    else if (quick === "annulees")
      list = list.filter((t) => t.statut === "ANNULE");

    if (responsableQuick)
      list = list.filter((t) => t.responsableId === responsableQuick);
    if (uniteQuick) list = list.filter((t) => t.uniteId === uniteQuick);
    if (sourceQuick)
      list = list.filter((t) => (t.sourceType ?? "LIBRE") === sourceQuick);

    list = filterByQuery(list, deferredQuery, (t) => [
      t.titre,
      t.responsableNom,
      t.uniteNom,
      t.sourceLabel ?? "",
      t.categorieLabel,
    ]);

    if (statut) list = list.filter((t) => t.statut === statut);
    if (categorie) list = list.filter((t) => t.categorie === categorie);
    return list;
  }, [
    items,
    quick,
    responsableQuick,
    uniteQuick,
    sourceQuick,
    deferredQuery,
    statut,
    categorie,
  ]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of items) map.set(t.statut, t.statutLabel);
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [items]);

  const categorieOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of items) map.set(t.categorie, t.categorieLabel);
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [items]);

  const sourceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of items) {
      const key = t.sourceType ?? "LIBRE";
      map.set(key, t.sourceType ? t.sourceType : "Libre");
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [items]);

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (quick !== "tous") chips.push(QUICK_LABELS[quick]);
    if (query.trim()) chips.push(`Recherche : « ${query.trim()} »`);
    if (responsableQuick) {
      const nom =
        responsables.find((r) => r.id === responsableQuick)?.nom ??
        "Responsable";
      chips.push(`Responsable : ${nom}`);
    }
    if (uniteQuick) {
      const nom = unites.find((u) => u.id === uniteQuick)?.nom ?? "Unité";
      chips.push(`Unité : ${nom}`);
    }
    if (sourceQuick) chips.push(`Source : ${sourceQuick}`);
    if (statut) {
      const label =
        statutOptions.find((o) => o.value === statut)?.label ?? statut;
      chips.push(`Statut : ${label}`);
    }
    if (categorie) {
      const label =
        categorieOptions.find((o) => o.value === categorie)?.label ??
        categorie;
      chips.push(`Catégorie : ${label}`);
    }
    return chips;
  }, [
    quick,
    query,
    responsableQuick,
    uniteQuick,
    sourceQuick,
    statut,
    categorie,
    responsables,
    unites,
    statutOptions,
    categorieOptions,
  ]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    uniteQuick !== "" ||
    sourceQuick !== "" ||
    statut !== "" ||
    categorie !== "";

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setResponsableQuick("");
    setUniteQuick("");
    setSourceQuick("");
    setStatut("");
    setCategorie("");
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher une tâche (titre, responsable, source…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.length}
      inventoryLabel="Inventaire des tâches"
      activeFilterChips={activeFilterChips}
      onResetFilters={resetAll}
      canResetFilters={canReset}
      createAction={
        createHref && createLabel ? (
          <Link className="btn" href={createHref}>
            {createLabel}
          </Link>
        ) : undefined
      }
      quickFilters={
        <>
          {(Object.keys(QUICK_LABELS) as QuickFilter[]).map((k) => (
            <ChipButton
              key={k}
              active={quick === k}
              onClick={() => setQuick(k)}
            >
              {QUICK_LABELS[k]}
            </ChipButton>
          ))}
          <label className="inventory__select">
            <span className="sr-only">Responsable</span>
            <select
              value={responsableQuick}
              onChange={(e) => setResponsableQuick(e.target.value)}
            >
              <option value="">Tous responsables</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory__select">
            <span className="sr-only">Unité</span>
            <select
              value={uniteQuick}
              onChange={(e) => setUniteQuick(e.target.value)}
            >
              <option value="">Toutes unités</option>
              {unites.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory__select">
            <span className="sr-only">Objet source</span>
            <select
              value={sourceQuick}
              onChange={(e) => setSourceQuick(e.target.value)}
            >
              <option value="">Toutes sources</option>
              {sourceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </>
      }
      advancedPanel={
        <div className="inventory__advanced-grid">
          <label className="field">
            <span className="field__label">Statut</span>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              <option value="">Tous</option>
              {statutOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Catégorie</span>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
            >
              <option value="">Toutes</option>
              {categorieOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions inventory__advanced-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setStatut("");
                setCategorie("");
              }}
            >
              Réinitialiser la recherche avancée
            </button>
          </div>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucune tâche ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          dense
          columns={["Titre", "Responsable", "Échéance", "Statut"]}
        >
          {filtered.map((t) => (
            <li key={t.id}>
              <InventoryRow
                href={`/taches/${t.id}`}
                urgence={t.urgence}
                primary={[
                  { value: t.titre, emphasis: "title" },
                  { value: t.responsableNom },
                  { value: formatDateDot(t.dateEcheance) },
                  { value: t.statutLabel, badgeTone: toneFromStatut(t.statut) },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
