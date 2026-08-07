"use client";

import { useState } from "react";
import { useInventorySearch } from "@/components/inventory/InventoryBrowser";
import { hasAdvancedFilters } from "@/lib/inventory-filters";

/** État commun filtres/recherche pour les inventaires modules. */
export function useModuleInventoryState<
  Q extends string,
  A extends Record<string, string>,
>(opts: {
  defaultQuick: Q;
  emptyAdvanced: A;
  quickLabels: Record<Q, string>;
}) {
  const { query, deferredQuery, setQuery } = useInventorySearch();
  const [quick, setQuick] = useState<Q>(opts.defaultQuick);
  const [responsableQuick, setResponsableQuick] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState<A>(opts.emptyAdvanced);

  const resetAll = () => {
    setQuick("tous" as Q);
    setQuery("");
    setResponsableQuick("");
    setAdvanced(opts.emptyAdvanced);
  };

  const canReset =
    (quick as string) !== "tous" ||
    query.trim() !== "" ||
    responsableQuick !== "" ||
    hasAdvancedFilters(advanced);

  const buildActiveChips = (extra: string[] = []) => {
    const chips: string[] = [];
    if ((quick as string) !== "tous") {
      chips.push(opts.quickLabels[quick] ?? String(quick));
    }
    if (query.trim()) chips.push(`Recherche : « ${query.trim()} »`);
    chips.push(...extra);
    return chips;
  };

  return {
    query,
    deferredQuery,
    setQuery,
    quick,
    setQuick,
    responsableQuick,
    setResponsableQuick,
    advancedOpen,
    setAdvancedOpen,
    advanced,
    setAdvanced,
    resetAll,
    canReset,
    buildActiveChips,
  };
}
