import type { TypeObjetMetier } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Historique de contenu générique (diffs champ-par-champ).
 *
 * Phase 1 :
 * - pas de snapshot JSON ;
 * - pas de purge automatique (choix temporaire) ;
 * - conservation paramétrable ultérieurement par type d’objet /
 *   catégorie d’historique (chantier Protection des données).
 *
 * Journalisation : uniquement les modifications effectivement enregistrées
 * de champs structurants — pas les frappes intermédiaires de brouillon.
 */

export type ChampChange = {
  champ: string;
  avant: string | null;
  apres: string | null;
};

export function serializeHistValue(
  value: string | number | boolean | null | undefined,
): string | null {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  const t = value.trim();
  return t === "" ? null : t;
}

export function diffChamps(
  pairs: Array<{
    champ: string;
    avant: string | number | boolean | null | undefined;
    apres: string | number | boolean | null | undefined;
  }>,
): ChampChange[] {
  return pairs
    .map((p) => ({
      champ: p.champ,
      avant: serializeHistValue(p.avant),
      apres: serializeHistValue(p.apres),
    }))
    .filter((c) => (c.avant ?? "") !== (c.apres ?? ""));
}

/**
 * Enregistre un lot de diffs. Retourne 0 si aucun changement réel.
 * `versionObjet` = version de contenu de l’objet **après** le bump.
 */
export async function enregistrerModifications(params: {
  typeObjet: TypeObjetMetier;
  objetId: string;
  uniteId?: string | null;
  modifieParId: string;
  changes: ChampChange[];
  versionObjet: number;
  motif?: string | null;
}): Promise<number> {
  const rows = params.changes.filter(
    (c) => (c.avant ?? "") !== (c.apres ?? ""),
  );
  if (rows.length === 0) return 0;

  await prisma.historiqueModification.createMany({
    data: rows.map((c) => ({
      typeObjet: params.typeObjet,
      objetId: params.objetId,
      uniteId: params.uniteId ?? null,
      champ: c.champ,
      ancienneValeur: c.avant,
      nouvelleValeur: c.apres,
      modifieParId: params.modifieParId,
      motif: params.motif ?? null,
      versionObjet: params.versionObjet,
    })),
  });

  return rows.length;
}

export async function listerHistorique(
  typeObjet: TypeObjetMetier,
  objetId: string,
  take = 50,
) {
  return prisma.historiqueModification.findMany({
    where: { typeObjet, objetId },
    include: {
      modifiePar: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: { modifieLe: "desc" },
    take,
  });
}
