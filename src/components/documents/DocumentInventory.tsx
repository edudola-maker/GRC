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

export type DocumentInventoryItem = {
  id: string;
  code: string;
  nom: string;
  typeLabel: string;
  version: string | null;
  statut: string;
  statutLabel: string;
  frequenceLabel: string | null;
  responsableId: string | null;
  responsableNom: string;
  tags: string | null;
  prochaineRevue: string | null;
  nbTachesRevue: number;
  archive: boolean;
  urgence: "retard" | "bientot" | "a_venir" | "neutre";
  estActif: boolean;
  estRetard: boolean;
  estEnVigueur: boolean;
};

type QuickFilter = "tous" | "actifs" | "en_vigueur" | "retard" | "archives";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Tous",
  actifs: "Actifs",
  en_vigueur: "En vigueur",
  retard: "En retard",
  archives: "Archivés",
};

export function DocumentInventory({
  items,
  responsables,
  initialQuick,
  createHref,
  createLabel,
}: {
  items: DocumentInventoryItem[];
  responsables: { id: string; nom: string }[];
  /** Filtre rapide initial (ex. depuis ?filtre=retard). */
  initialQuick?: QuickFilter;
  createHref?: string;
  createLabel?: string;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>(initialQuick ?? "actifs");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statut, setStatut] = useState("");
  const [tags, setTags] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "actifs") list = list.filter((d) => d.estActif && !d.archive);
    else if (quick === "en_vigueur")
      list = list.filter((d) => d.estEnVigueur && !d.archive);
    else if (quick === "retard")
      list = list.filter((d) => d.estRetard && !d.archive);
    else if (quick === "archives") list = list.filter((d) => d.archive);
    else list = list.filter((d) => !d.archive);

    if (responsableQuick)
      list = list.filter((d) => d.responsableId === responsableQuick);

    list = filterByQuery(list, deferredQuery, (d) => [
      d.code,
      d.nom,
      d.tags,
      d.typeLabel,
    ]);

    if (statut) list = list.filter((d) => d.statut === statut);
    if (tags.trim()) {
      const t = tags.trim().toLowerCase();
      list = list.filter((d) => (d.tags ?? "").toLowerCase().includes(t));
    }
    return list;
  }, [items, quick, responsableQuick, deferredQuery, statut, tags]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of items) map.set(d.statut, d.statutLabel);
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
    if (statut) {
      const label =
        statutOptions.find((o) => o.value === statut)?.label ?? statut;
      chips.push(`Statut : ${label}`);
    }
    if (tags.trim()) chips.push(`Tags : ${tags.trim()}`);
    return chips;
  }, [quick, query, responsableQuick, statut, tags, responsables, statutOptions]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    statut !== "" ||
    tags.trim() !== "";

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setResponsableQuick("");
    setStatut("");
    setTags("");
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un document (code, nom, tags…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.length}
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
          <ChipButton active={quick === "tous"} onClick={() => setQuick("tous")}>
            Tous
          </ChipButton>
          <ChipButton
            active={quick === "actifs"}
            onClick={() => setQuick("actifs")}
          >
            Actifs
          </ChipButton>
          <ChipButton
            active={quick === "en_vigueur"}
            onClick={() => setQuick("en_vigueur")}
          >
            En vigueur
          </ChipButton>
          <ChipButton
            active={quick === "retard"}
            onClick={() => setQuick("retard")}
          >
            En retard
          </ChipButton>
          <ChipButton
            active={quick === "archives"}
            onClick={() => setQuick("archives")}
          >
            Archivés
          </ChipButton>
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
            <span className="field__label">Tags</span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
          <div className="form-actions inventory__advanced-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setStatut("");
                setTags("");
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
          Aucun document ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          dense
          columns={["Code", "Nom", "Responsable", "Statut"]}
        >
          {filtered.map((d) => (
            <li key={d.id}>
              <InventoryRow
                href={`/documents/${d.id}`}
                urgence={d.urgence}
                archived={d.archive}
                primary={[
                  { value: d.code, emphasis: "code" },
                  { value: d.nom, emphasis: "title" },
                  { value: d.responsableNom },
                  { value: d.statutLabel, badgeTone: toneFromStatut(d.statut) },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
