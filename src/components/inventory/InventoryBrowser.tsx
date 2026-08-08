"use client";

import { useDeferredValue, useState, type ReactNode } from "react";
import { ActiveFiltersBar } from "@/components/inventory/ActiveFiltersBar";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { filterByQuery } from "@/lib/inventory-filters";

/**
 * Socle réutilisable : recherche dynamique + panneau avancé + filtres actifs.
 * Structure en zones repliables : outils puis inventaire.
 */
export function InventoryBrowser({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  quickFilters,
  advancedOpen,
  onAdvancedToggle,
  advancedPanel,
  resultCount,
  totalCount,
  toolsLabel = "Filtres et recherche",
  inventoryLabel = "Inventaire",
  activeFilterChips = [],
  onResetFilters,
  canResetFilters = false,
  children,
}: {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  quickFilters: ReactNode;
  advancedOpen: boolean;
  onAdvancedToggle: () => void;
  advancedPanel: ReactNode;
  resultCount: number;
  totalCount: number;
  toolsLabel?: string;
  inventoryLabel?: string;
  activeFilterChips?: string[];
  onResetFilters?: () => void;
  canResetFilters?: boolean;
  children: ReactNode;
}) {
  const countLabel =
    resultCount === totalCount
      ? `${totalCount} élément${totalCount > 1 ? "s" : ""}`
      : `${resultCount} sur ${totalCount}`;

  return (
    <div className="inventory inventory-shell">
      <CollapsibleSection
        title={toolsLabel}
        defaultOpen
        className="page-zone page-zone--tools collapsible-section--zone"
      >
        <div className="inventory__search-row">
          <label className="inventory__search" htmlFor="inventory-q">
            <span className="sr-only">Recherche</span>
            <input
              id="inventory-q"
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className={`btn btn--ghost inventory__advanced-toggle${advancedOpen ? " is-open" : ""}`}
            onClick={onAdvancedToggle}
            aria-expanded={advancedOpen}
          >
            Recherche avancée
          </button>
        </div>

        {advancedOpen ? (
          <div className="inventory__advanced panel panel--inset">
            {advancedPanel}
          </div>
        ) : null}

        <div className="filter-bar inventory__filters">{quickFilters}</div>

        {onResetFilters ? (
          <ActiveFiltersBar
            chips={activeFilterChips}
            onReset={onResetFilters}
            canReset={canResetFilters}
          />
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        title={inventoryLabel}
        defaultOpen
        badge={countLabel}
        className="page-zone page-zone--inventory collapsible-section--zone"
      >
        {children}
      </CollapsibleSection>
    </div>
  );
}

export function useInventorySearch(initial = "") {
  const [query, setQuery] = useState(initial);
  const deferred = useDeferredValue(query);

  return {
    query,
    deferredQuery: deferred.trim().toLowerCase(),
    setQuery,
  };
}

export function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`chip chip--button${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export { filterByQuery };
