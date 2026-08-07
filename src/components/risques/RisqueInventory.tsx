"use client";

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

export type RisqueInventoryItem = {
  id: string;
  code: string;
  nom: string;
  categorieLabel: string;
  statut: string;
  statutLabel: string;
  strategieLabel: string | null;
  responsableId: string;
  responsableNom: string;
  probabilite: number;
  impact: number;
  criticite: number;
  nbControles: number;
  archive: boolean;
  urgence: "retard" | "bientot" | "a_venir" | "neutre";
  estCritique: boolean;
  estEleve: boolean;
  sansStrategie: boolean;
};

type QuickFilter =
  | "tous"
  | "critiques"
  | "eleves"
  | "sans_strategie"
  | "archives";

const QUICK_LABELS: Record<QuickFilter, string> = {
  tous: "Tous",
  critiques: "Critiques",
  eleves: "Élevés",
  sans_strategie: "Sans stratégie",
  archives: "Archivés",
};

export function RisqueInventory({
  items,
  responsables,
}: {
  items: RisqueInventoryItem[];
  responsables: { id: string; nom: string }[];
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>("tous");
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statut, setStatut] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (quick === "critiques")
      list = list.filter((r) => r.estCritique && !r.archive);
    else if (quick === "eleves")
      list = list.filter((r) => r.estEleve && !r.archive);
    else if (quick === "sans_strategie")
      list = list.filter((r) => r.sansStrategie && !r.archive);
    else if (quick === "archives") list = list.filter((r) => r.archive);
    else list = list.filter((r) => !r.archive);

    if (responsableQuick)
      list = list.filter((r) => r.responsableId === responsableQuick);

    list = filterByQuery(list, deferredQuery, (r) => [
      r.code,
      r.nom,
      r.categorieLabel,
    ]);

    if (statut) list = list.filter((r) => r.statut === statut);
    return list;
  }, [items, quick, responsableQuick, deferredQuery, statut]);

  const statutOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of items) map.set(r.statut, r.statutLabel);
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
    return chips;
  }, [quick, query, responsableQuick, statut, responsables, statutOptions]);

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
      searchPlaceholder="Rechercher un risque (code, nom, catégorie…)"
      searchValue={query}
      onSearchChange={setQuery}
      advancedOpen={advancedOpen}
      onAdvancedToggle={() => setAdvancedOpen((v) => !v)}
      resultCount={filtered.length}
      totalCount={items.filter((r) => !r.archive).length}
      activeFilterChips={activeFilterChips}
      onResetFilters={resetAll}
      canResetFilters={canReset}
      quickFilters={
        <>
          <ChipButton active={quick === "tous"} onClick={() => setQuick("tous")}>
            Tous
          </ChipButton>
          <ChipButton
            active={quick === "critiques"}
            onClick={() => setQuick("critiques")}
          >
            Critiques
          </ChipButton>
          <ChipButton
            active={quick === "eleves"}
            onClick={() => setQuick("eleves")}
          >
            Élevés
          </ChipButton>
          <ChipButton
            active={quick === "sans_strategie"}
            onClick={() => setQuick("sans_strategie")}
          >
            Sans stratégie
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
          <div className="form-actions inventory__advanced-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setStatut("")}
            >
              Réinitialiser la recherche avancée
            </button>
          </div>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <InventoryEmpty>
          Aucun risque ne correspond à votre recherche.
        </InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code", "Nom", "Catégorie", "Statut"]}
          secondaryColumns={[
            "Responsable",
            "Criticité",
            "Stratégie",
            "Contrôles",
          ]}
        >
          {filtered.map((r) => (
            <li key={r.id}>
              <InventoryRow
                href={`/risques/${r.id}`}
                urgence={r.urgence}
                archived={r.archive}
                primary={[
                  { value: r.code, emphasis: "code" },
                  { value: r.nom, emphasis: "title" },
                  { value: r.categorieLabel },
                  { value: r.statutLabel, emphasis: "status" },
                ]}
                secondary={[
                  { value: r.responsableNom },
                  {
                    value: `P${r.probabilite}×I${r.impact} = ${r.criticite}`,
                  },
                  { value: r.strategieLabel || "Sans stratégie" },
                  {
                    value: `${r.nbControles} contrôle${r.nbControles > 1 ? "s" : ""}`,
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
