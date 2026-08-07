import assert from "node:assert/strict";
import {
  EMPTY_CONSEIL_ADVANCED,
  filterConseils,
  type ConseilFilterable,
} from "./inventory-filters";

function item(
  partial: Partial<ConseilFilterable> & Pick<ConseilFilterable, "code">,
): ConseilFilterable {
  return {
    objet: partial.objet ?? partial.code,
    tags: null,
    taxinomie: null,
    demandeur: null,
    entiteDemandeuse: null,
    statut: "EN_COURS",
    responsableId: "r1",
    dateReception: "2026-08-01T12:00:00.000Z",
    dateCloture: null,
    archive: false,
    estOuvert: true,
    estClos: false,
    estRetard: false,
    ...partial,
  };
}

const dataset: ConseilFilterable[] = [
  item({
    code: "CNS-0001",
    objet: "Analyse du seuil de délégation",
    tags: "LSubv, Gouvernance",
    taxinomie: "JURIDIQUE",
    responsableId: "claire",
    statut: "EN_COURS",
    estOuvert: true,
    estClos: false,
    dateReception: "2026-08-04T12:00:00.000Z",
  }),
  item({
    code: "CNS-0002",
    objet: "Revue gouvernance",
    tags: "Gouvernance, LSubv",
    taxinomie: "GOUVERNANCE",
    responsableId: "alice",
    statut: "CLOTURE",
    estOuvert: false,
    estClos: true,
    dateReception: "2026-07-18T12:00:00.000Z",
    dateCloture: "2026-07-28T12:00:00.000Z",
  }),
  item({
    code: "CNS-0003",
    objet: "Clause de confidentialité",
    tags: "Contrats",
    taxinomie: "JURIDIQUE",
    responsableId: "bernard",
    statut: "EN_COURS",
    estOuvert: true,
    estClos: false,
    estRetard: true,
    dateReception: "2026-07-23T12:00:00.000Z",
  }),
];

function codes(
  list: ConseilFilterable[],
): string[] {
  return list.map((c) => c.code);
}

// Clôturé + mot-clé Gouvernance
assert.deepEqual(
  codes(
    filterConseils(dataset, {
      quick: "clos",
      query: "gouvernance",
    }),
  ),
  ["CNS-0002"],
);

// Recherche par code
assert.deepEqual(
  codes(
    filterConseils(dataset, {
      quick: "tous",
      query: "CNS-0001",
    }),
  ),
  ["CNS-0001"],
);

// En retard + taxinomie Juridique
assert.deepEqual(
  codes(
    filterConseils(dataset, {
      quick: "retard",
      query: "",
      advanced: { ...EMPTY_CONSEIL_ADVANCED, taxinomie: "JURIDIQUE" },
    }),
  ),
  ["CNS-0003"],
);

// Responsable + période
assert.deepEqual(
  codes(
    filterConseils(dataset, {
      quick: "tous",
      query: "",
      advanced: {
        ...EMPTY_CONSEIL_ADVANCED,
        responsableId: "alice",
        dateReceptionDu: "2026-07-01",
        dateReceptionAu: "2026-07-31",
      },
    }),
  ),
  ["CNS-0002"],
);

// Ouverts seuls
assert.deepEqual(
  codes(
    filterConseils(dataset, {
      quick: "ouverts",
      query: "",
    }),
  ),
  ["CNS-0001", "CNS-0003"],
);

console.log("inventory-filters tests OK");
