import type { TypeObjetMetier } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Parents supportés pour le journal de bord métier volontaire. */
export const JOURNAL_BORD_PARENTS = ["PROJET", "CONSEIL", "MISSION"] as const;

export async function listerJournalBord(
  typeObjet: TypeObjetMetier,
  objetId: string,
) {
  return prisma.journalBordEntree.findMany({
    where: { typeObjet, objetId },
    include: {
      auteur: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: [{ date: "desc" }, { creeLe: "desc" }],
  });
}

export type JournalBordItem = Awaited<
  ReturnType<typeof listerJournalBord>
>[number];
