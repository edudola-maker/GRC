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

export type ProcessusInventoryItem = {
  id: string;
  code: string;
  nom: string;
  uniteNom: string;
  statut: string;
  statutLabel: string;
  responsableId: string;
  responsableNom: string;
  criticite: number | null;
  parentNom: string | null;
  tags: string | null;
  archive: boolean;
  estActif: boolean;
  /** True si un lien Confluence / référence est renseigné. */
  aLienConfluence: boolean;
};

type QuickFilter = "tous" | "actifs" | "suspendus" | "sans_confluence" | "archives";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Tous",
  actifs: "Actifs",
  suspendus: "Suspendus",
  sans_confluence: "Sans Confluence",
  archives: "Archivés",
};

export function ProcessusInventory({
  items,
  responsables,
  initialQuick,
  createHref,
  createLabel,
}: {
  items: ProcessusInventoryItem[];
  responsables: { id: string; nom: string }[];
  initialQuick?: QuickFilter;
  createHref?: string;
  createLabel?: string;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>(initialQuick ?? "actifs");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statut, setStatut] = useState("");
  const [parentOnly, setParentOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "actifs")
      list = list.filter((p) => p.estActif && !p.archive);
    else if (quick === "suspendus")
      list = list.filter((p) => p.statut === "SUSPENDU" && !p.archive);
    else if (quick === "sans_confluence")
      list = list.filter((p) => !p.archive && !p.aLienConfluence);
    else if (quick === "archives") list = list.filter((p) => p.archive);
    else list = list.filter((p) => !p.archive);

    if (responsableQuick)
      list = list.filter((p) => p.responsableId === responsableQuick);

    if (statut) list = list.filter((p) => p.statut === statut);
    if (parentOnly) list = list.filter((p) => p.parentNom != null);

    return filterByQuery(list, deferredQuery, (p) => [
      p.code,
      p.nom,
      p.uniteNom,
      p.parentNom ?? "",
      p.tags ?? "",
    ]);
  }, [items, quick, responsableQuick, deferredQuery, statut, parentOnly]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of items) map.set(p.statut, p.statutLabel);
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [items]);

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (quick !== "tous") chips.push(QUICK_LABELS[quick]);
    if (query.trim()) chips.push(`Recherche : « ${query.trim()} »`);
    if (responsableQuick) {
      const nom =
        responsables.find((r) => r.id === responsableQuick)?.nom ?? "?";
      chips.push(`Responsable : ${nom}`);
    }
    if (statut) {
      const label =
        statutOptions.find((o) => o.value === statut)?.label ?? statut;
      chips.push(`Statut : ${label}`);
    }
    if (parentOnly) chips.push("Avec parent");
    return chips;
  }, [
    quick,
    query,
    responsableQuick,
    responsables,
    statut,
    statutOptions,
    parentOnly,
  ]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    statut !== "" ||
    parentOnly;

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setResponsableQuick("");
    setStatut("");
    setParentOnly(false);
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un processus (code, nom…)"
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
          <label className="field field--check">
            <span className="field__label">Hiérarchie</span>
            <span>
              <input
                type="checkbox"
                checked={parentOnly}
                onChange={(e) => setParentOnly(e.target.checked)}
              />{" "}
              Uniquement les sous-processus
            </span>
          </label>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucun processus ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          dense
          columns={["Code", "Unité", "Nom", "Responsable", "Statut"]}
        >
          {filtered.map((p) => (
            <li key={p.id}>
              <InventoryRow
                href={`/processus/${p.id}`}
                archived={p.archive}
                primary={[
                  { value: p.code, emphasis: "code" },
                  { value: p.uniteNom },
                  { value: p.nom, emphasis: "title" },
                  { value: p.responsableNom },
                  {
                    value: p.statutLabel,
                    badgeTone: toneFromStatut(p.statut),
                  },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
