import type { TypeReferentiel } from "@/generated/prisma/client";
import { TAXINOMIE_OPTIONS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

/** Clés de paramètres fonctionnels (Administration future). */
export const PARAM_CLES = {
  CONSEIL_DELAI_CIBLE_JOURS: "CONSEIL_DELAI_CIBLE_JOURS",
} as const;

export async function listReferentiel(type: TypeReferentiel) {
  const rows = await prisma.referentielValeur.findMany({
    where: { type, actif: true },
    orderBy: [{ ordre: "asc" }, { label: "asc" }],
  });
  if (rows.length === 0 && type === "TAXINOMIE") {
    return TAXINOMIE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  }
  return rows.map((r) => ({ value: r.code, label: r.label }));
}

export async function getParametreUnite(
  uniteId: string,
  cle: string,
  fallback: string,
): Promise<string> {
  const row = await prisma.parametreFonctionnel.findUnique({
    where: { uniteId_cle: { uniteId, cle } },
  });
  return row?.valeur ?? fallback;
}

export async function getConseilDelaiCibleJours(uniteId: string): Promise<number> {
  const raw = await getParametreUnite(
    uniteId,
    PARAM_CLES.CONSEIL_DELAI_CIBLE_JOURS,
    "5",
  );
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}
