/**
 * Filtrage inventaire — logique pure, testable, partagée.
 */

export function filterByQuery<T>(
  items: T[],
  query: string,
  fields: (item: T) => Array<string | null | undefined>,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields(item).some((f) => (f ?? "").toLowerCase().includes(q)),
  );
}

export function inDateRange(
  value: string | null | undefined,
  du: string,
  au: string,
): boolean {
  if (!du && !au) return true;
  if (!value) return false;
  const d = value.slice(0, 10);
  if (du && d < du) return false;
  if (au && d > au) return false;
  return true;
}

export type ConseilAdvancedFilters = {
  dateReceptionDu: string;
  dateReceptionAu: string;
  dateClotureDu: string;
  dateClotureAu: string;
  provenance: string;
  responsableId: string;
  statut: string;
  taxinomie: string;
  tags: string;
};

export const EMPTY_CONSEIL_ADVANCED: ConseilAdvancedFilters = {
  dateReceptionDu: "",
  dateReceptionAu: "",
  dateClotureDu: "",
  dateClotureAu: "",
  provenance: "",
  responsableId: "",
  statut: "",
  taxinomie: "",
  tags: "",
};

export type ConseilFilterable = {
  code: string;
  objet: string;
  tags: string | null;
  taxinomie: string | null;
  demandeur: string | null;
  entiteDemandeuse: string | null;
  statut: string;
  responsableId: string;
  dateReception: string;
  dateCloture: string | null;
  archive: boolean;
  estOuvert: boolean;
  estClos: boolean;
  estRetard: boolean;
};

export type ConseilQuickFilter =
  | "tous"
  | "ouverts"
  | "clos"
  | "retard"
  | "archives";

export function filterConseils<T extends ConseilFilterable>(
  items: T[],
  opts: {
    quick: ConseilQuickFilter;
    query: string;
    responsableQuick?: string;
    advanced?: ConseilAdvancedFilters;
  },
): T[] {
  let list = items;
  const { quick, query, responsableQuick = "", advanced = EMPTY_CONSEIL_ADVANCED } =
    opts;

  if (quick === "ouverts") list = list.filter((c) => c.estOuvert && !c.archive);
  else if (quick === "clos") list = list.filter((c) => c.estClos && !c.archive);
  else if (quick === "retard")
    list = list.filter((c) => c.estRetard && !c.archive);
  else if (quick === "archives") list = list.filter((c) => c.archive);
  else list = list.filter((c) => !c.archive);

  if (responsableQuick) {
    list = list.filter((c) => c.responsableId === responsableQuick);
  }

  list = filterByQuery(list, query, (c) => [
    c.code,
    c.objet,
    c.tags,
    c.demandeur,
    c.entiteDemandeuse,
  ]);

  const a = advanced;
  if (a.provenance.trim()) {
    const p = a.provenance.trim().toLowerCase();
    list = list.filter(
      (c) =>
        (c.demandeur ?? "").toLowerCase().includes(p) ||
        (c.entiteDemandeuse ?? "").toLowerCase().includes(p),
    );
  }
  if (a.responsableId) {
    list = list.filter((c) => c.responsableId === a.responsableId);
  }
  if (a.statut) list = list.filter((c) => c.statut === a.statut);
  if (a.taxinomie) list = list.filter((c) => c.taxinomie === a.taxinomie);
  if (a.tags.trim()) {
    const t = a.tags.trim().toLowerCase();
    list = list.filter((c) => (c.tags ?? "").toLowerCase().includes(t));
  }
  list = list.filter((c) =>
    inDateRange(c.dateReception, a.dateReceptionDu, a.dateReceptionAu),
  );
  list = list.filter((c) =>
    inDateRange(c.dateCloture, a.dateClotureDu, a.dateClotureAu),
  );

  return list;
}

export function hasAdvancedFilters(
  advanced: Record<string, string>,
): boolean {
  return Object.values(advanced).some((v) => v.trim() !== "");
}
