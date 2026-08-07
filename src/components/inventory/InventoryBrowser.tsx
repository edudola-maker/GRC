"use client";

import { useDeferredValue, useState, type ReactNode } from "react";

/**
 * Socle réutilisable : recherche dynamique + panneau avancé.
 * Structure en zones : outils (filtres/recherche) puis inventaire.
 * Pattern à étendre aux autres modules.
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
  children: ReactNode;
}) {
  const countLabel =
    resultCount === totalCount
      ? `${totalCount} élément${totalCount > 1 ? "s" : ""}`
      : `${resultCount} sur ${totalCount}`;

  return (
    <div className="inventory inventory-shell">
      <section className="page-zone page-zone--tools" aria-label={toolsLabel}>
        <p className="page-zone__label">{toolsLabel}</p>

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
      </section>

      <section
        className="page-zone page-zone--inventory"
        aria-label={inventoryLabel}
      >
        <div className="page-zone__head">
          <p className="page-zone__label">{inventoryLabel}</p>
          <p className="inventory__count muted">{countLabel}</p>
        </div>
        {children}
      </section>
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

export function filterByQuery<T>(
  items: T[],
  query: string,
  fields: (item: T) => Array<string | null | undefined>,
): T[] {
  if (!query) return items;
  return items.filter((item) =>
    fields(item).some((f) => (f ?? "").toLowerCase().includes(query)),
  );
}
