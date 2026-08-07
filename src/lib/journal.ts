import type { TypeObjetMetier } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function ajouterJournal(params: {
  typeObjet: TypeObjetMetier;
  objetId: string;
  typeEvenement: string;
  message: string;
  auteurId?: string | null;
  automatique?: boolean;
}) {
  return prisma.journalEvenement.create({
    data: {
      typeObjet: params.typeObjet,
      objetId: params.objetId,
      typeEvenement: params.typeEvenement,
      message: params.message,
      auteurId: params.auteurId ?? null,
      automatique: params.automatique ?? true,
    },
  });
}

export async function listerJournal(
  typeObjet: TypeObjetMetier,
  objetId: string,
) {
  return prisma.journalEvenement.findMany({
    where: { typeObjet, objetId },
    include: { auteur: true },
    orderBy: { creeLe: "desc" },
  });
}
