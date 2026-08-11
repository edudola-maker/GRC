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

export type ModeleTacheInventoryItem = {
  id: string;
  code: string;
  nom: string;
  actif: boolean;
  etapesCount: number;
  processusCount: number;
  parametres: string;
};

type QuickFilter = "tous" | "actifs" | "inactifs";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Tous",
  actifs: "Actifs",
  inactifs: "Inactifs",
};

export function ModeleTacheInventory({
  items,
  createHref,
  createLabel,
}: {
  items: ModeleTacheInventoryItem[];
  createHref?: string;
  createLabel?: string;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>("actifs");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "actifs") list = list.filter((m) => m.actif);
    else if (quick === "inactifs") list = list.filter((m) => !m.actif);

    return filterByQuery(list, deferredQuery, (m) => [
      m.code,
      m.nom,
      m.parametres,
    ]);
  }, [items, quick, deferredQuery]);

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (quick !== "tous") chips.push(QUICK_LABELS[quick]);
    if (query.trim()) chips.push(`Recherche : « ${query.trim()} »`);
    return chips;
  }, [quick, query]);

  const canReset = quick !== "tous" || query.trim() !== "";

  const resetAll = () => {
    setQuick("tous");
    setQuery("");
  };

  return (
    <InventoryBrowser
      searchPlaceholder="Rechercher un modèle (code, nom…)"
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
          <InventoryCreateLink href={createHref} label={createLabel} />
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
        </>
      }
      advancedPanel={
        <p className="muted" style={{ margin: 0 }}>
          Filtrez par statut via les pastilles ci-dessus, ou recherchez par code
          / nom.
        </p>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucun modèle ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          dense
          columns={["Code", "Nom", "Checklist", "État"]}
        >
          {filtered.map((m) => (
            <li key={m.id}>
              <InventoryRow
                href={`/modeles-taches/${m.id}`}
                archived={!m.actif}
                primary={[
                  { value: m.code, emphasis: "code" },
                  { value: m.nom, emphasis: "title" },
                  {
                    value: `${m.etapesCount} étape${m.etapesCount === 1 ? "" : "s"}`,
                  },
                  {
                    value: m.actif ? "Actif" : "Inactif",
                    emphasis: "status",
                    badgeTone: m.actif ? "ok" : "neutral",
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
