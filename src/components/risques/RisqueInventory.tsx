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
} from "@/components/inventory/InventoryRow";
import { CriticiteBadge } from "@/components/risques/CriticiteBadge";
import { StatusBadge, toneFromStatut } from "@/components/ui/StatusBadge";

export type RisqueControleLink = {
  id: string;
  code: string;
  nom: string;
};

export type RisqueInventoryItem = {
  id: string;
  code: string;
  nom: string;
  uniteNom: string;
  categorieLabel: string;
  statut: string;
  statutLabel: string;
  strategieLabel: string | null;
  responsableId: string;
  responsableNom: string;
  probabilite: number;
  impact: number;
  criticite: number;
  probabiliteResiduelle: number | null;
  impactResiduel: number | null;
  criticiteResiduelle: number | null;
  controles: RisqueControleLink[];
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
  initialQuick,
  createHref,
  createLabel,
}: {
  items: RisqueInventoryItem[];
  responsables: { id: string; nom: string }[];
  initialQuick?: QuickFilter;
  createHref?: string;
  createLabel?: string;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<QuickFilter>(initialQuick ?? "tous");
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
      r.uniteNom,
      ...r.controles.flatMap((c) => [c.code, c.nom]),
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
      searchPlaceholder="Rechercher un risque (code, nom, contrôle…)"
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
          className="inventory-table--risque"
          columns={[
            "Code",
            "Unité",
            "Nom",
            "Catégorie",
            "P",
            "I",
            "Inhérent",
            "Résiduel",
            "Contrôles SCI",
            "Statut",
          ]}
          dense
        >
          {filtered.map((r) => (
            <li key={r.id}>
              <div
                className={`inventory-row inventory-row--dense${r.archive ? " is-archived" : ""}`}
              >
                <Link
                  href={`/risques/${r.id}`}
                  className="inventory-row__dense-main"
                >
                  <span className="inventory-cell__value inventory-cell__value--code">
                    {r.code}
                  </span>
                  <span className="inventory-cell__value inventory-cell__value--meta inventory-row__hide-sm">
                    {r.uniteNom}
                  </span>
                  <span className="inventory-cell__value inventory-cell__value--title">
                    {r.nom}
                  </span>
                  <span className="inventory-cell__value inventory-row__hide-sm">
                    {r.categorieLabel}
                  </span>
                  <span className="inventory-cell__value">{r.probabilite}</span>
                  <span className="inventory-cell__value">{r.impact}</span>
                  <span className="inventory-cell__value">
                    <CriticiteBadge value={r.criticite} />
                  </span>
                  <span className="inventory-cell__value inventory-row__hide-md">
                    <CriticiteBadge value={r.criticiteResiduelle} />
                  </span>
                </Link>
                <div className="inventory-row__dense-controles">
                  {r.controles.length === 0 ? (
                    <span className="muted">—</span>
                  ) : (
                    r.controles.map((c) => (
                      <Link
                        key={c.id}
                        href={`/controles-sci/${c.id}`}
                        className="inventory-row__ctl-link"
                      >
                        {c.code} — {c.nom}
                      </Link>
                    ))
                  )}
                </div>
                <Link href={`/risques/${r.id}`} className="inventory-row__dense-statut">
                  <StatusBadge tone={toneFromStatut(r.statut)}>
                    {r.statutLabel}
                  </StatusBadge>
                </Link>
              </div>
            </li>
          ))}
        </InventoryList>
      )}
    </InventoryBrowser>
  );
}
