"use client";

import { useMemo, useState } from "react";
import {
  ChipButton,
  InventoryBrowser,
  filterByQuery,
  useInventorySearch,
} from "@/components/inventory/InventoryBrowser";
import { InventoryCreateLink } from "@/components/inventory/InventoryCreateLink";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { toneFromStatut } from "@/components/ui/StatusBadge";

export type ActifITInventoryItem = {
  id: string;
  code: string;
  nom: string;
  typeLabel: string;
  statut: string;
  statutLabel: string;
  responsableId: string | null;
  responsableNom: string;
  nbProcessus: number;
  archive: boolean;
  estActif: boolean;
};

type QuickFilter = "tous" | "actifs" | "archives";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Tous",
  actifs: "Actifs",
  archives: "Archivés",
};

export function ActifITInventory({
  items,
  responsables,
  createHref = "/actifs-it/nouveau",
  createLabel = "Nouvel actif IT",
}: {
  items: ActifITInventoryItem[];
  responsables: { id: string; nom: string }[];
  createHref?: string;
  createLabel?: string;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>("actifs");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statut, setStatut] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "actifs") list = list.filter((a) => a.estActif && !a.archive);
    else if (quick === "archives") list = list.filter((a) => a.archive);
    else list = list.filter((a) => !a.archive);

    if (responsableQuick)
      list = list.filter((a) => a.responsableId === responsableQuick);

    if (statut) list = list.filter((a) => a.statut === statut);

    return filterByQuery(list, deferredQuery, (a) => [
      a.code,
      a.nom,
      a.typeLabel,
    ]);
  }, [items, quick, responsableQuick, deferredQuery, statut]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of items) map.set(a.statut, a.statutLabel);
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
    return chips;
  }, [quick, query, responsableQuick, responsables, statut, statutOptions]);

  const canReset =
    quick !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    statut !== "";

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
    setResponsableQuick("");
    setStatut("");
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un actif IT (code, nom…)"
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
        <InventoryCreateLink href={createHref} label={createLabel} />
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
        <label className="field">
          <span className="field__label">Statut</span>
          <select value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous</option>
            {statutOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucun actif IT ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          dense
          columns={["Code", "Nom", "Type", "Responsable", "Processus", "Statut"]}
        >
          {filtered.map((a) => (
            <li key={a.id}>
              <InventoryRow
                href={`/actifs-it/${a.id}`}
                archived={a.archive}
                primary={[
                  { value: a.code, emphasis: "code" },
                  { value: a.nom, emphasis: "title" },
                  { value: a.typeLabel },
                  { value: a.responsableNom },
                  { value: String(a.nbProcessus) },
                  {
                    value: a.statutLabel,
                    badgeTone: toneFromStatut(a.statut),
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
