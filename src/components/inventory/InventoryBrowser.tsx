"use client";

import { useDeferredValue, useState, type ReactNode } from "react";

/**
 * Socle réutilisable : recherche dynamique + panneau avancé.
 * Pattern à étendre aux autres modules (filtres + recherche + avancée).
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
  children: ReactNode;
}) {
  return (
    <div className="inventory">
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

      <p className="inventory__count muted">
        {resultCount === totalCount
          ? `${totalCount} élément${totalCount > 1 ? "s" : ""}`
          : `${resultCount} sur ${totalCount}`}
      </p>

      {children}
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
